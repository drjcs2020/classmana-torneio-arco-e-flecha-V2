/** Administração do professor — exclusiva do backend ClassMana V2.
 * A senha NÃO fica no GitHub: configure TEACHER_PASSWORD_SHA256 no Railway V2.
 * Nenhum aluno possui permissões de administração.
 */
import { randomBytes, createHash, timingSafeEqual, scryptSync } from 'node:crypto';

export function createTeacherAdmin({ db, players, known, teamMembership, fail }) {
  db.exec(`CREATE TABLE IF NOT EXISTS extra_students (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, house TEXT NOT NULL, team TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS teacher_resets (
    id TEXT PRIMARY KEY, at TEXT NOT NULL, duels_snapshot TEXT NOT NULL,
    operations_snapshot TEXT NOT NULL, duels_count INTEGER NOT NULL, operations_count INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS teacher_settings (setting TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS student_overrides (
      id TEXT PRIMARY KEY, name TEXT, inactive INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS student_audit (
      id TEXT PRIMARY KEY, student_id TEXT NOT NULL, action TEXT NOT NULL,
      old_name TEXT NOT NULL, new_name TEXT, at TEXT NOT NULL);`);
  const extras = db.prepare('SELECT id,name,house,team FROM extra_students ORDER BY house,id').all();
  for (const player of extras) {
    if (!known.has(player.id)) { players.push(player); known.set(player.id, player); }
  }
  // IDs do cadastro original não mudam: edições persistem em tabela separada.
  // Alunos inativos permanecem em known para preservar nomes nos duelos históricos.
  const inactive=new Set();
  for(const row of db.prepare('SELECT id,name,inactive FROM student_overrides').all()){
    const person=known.get(row.id);
    if(!person)continue;
    if(row.name)person.name=row.name;
    if(row.inactive){inactive.add(row.id);const i=players.findIndex(p=>p.id===row.id);if(i>=0)players.splice(i,1);}
  }
  const actions = new Set(['teacherLogin','teacherStatus','teacherStudents','teacherAddStudent','teacherRenameStudent','teacherDeleteStudent','teacherResetScores','teacherChangePassword']);
  const adminSessions = new Map();
  const failures = new Map();
  const digest = value => createHash('sha256').update(String(value)).digest('hex');
  const configuredHash = String(process.env.TEACHER_PASSWORD_SHA256 || '').trim().toLowerCase();
  const passwordOverride=db.prepare("SELECT value FROM teacher_settings WHERE setting='password'");
  const savePasswordOverride=db.prepare("INSERT INTO teacher_settings(setting,value) VALUES('password',?) ON CONFLICT(setting) DO UPDATE SET value=excluded.value");
  function checkPassword(raw){
    const value=String(raw||'');
    if(value.length>256)return false;
    const override=passwordOverride.get()?.value;
    if(override){
      const [algo,salt,expected]=override.split(':');
      if(algo!=='scrypt'||!/^[a-f0-9]{32}$/.test(salt)||!/^[a-f0-9]{128}$/.test(expected))return false;
      const result=scryptSync(value,Buffer.from(salt,'hex'),64);
      return timingSafeEqual(result,Buffer.from(expected,'hex'));
    }
    return /^[a-f0-9]{64}$/.test(configuredHash) && compareDigest(digest(value),configuredHash);
  }
  const configured = /^[a-f0-9]{64}$/.test(configuredHash) || !!passwordOverride.get()?.value;
  const compareDigest = (a,b) => {
    if (!/^[a-f0-9]{64}$/.test(a) || !/^[a-f0-9]{64}$/.test(b)) return false;
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  };
  const sessionsExpireAt = 30 * 60 * 1000;
  const allowedTeams = [...new Set(Object.values(teamMembership).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  function validName(raw){
    const name=String(raw||'').normalize('NFC').trim().replace(/\s+/g,' ');
    if(name.length<3||name.length>52||! ( /^[\p{L}\p{M} .-]+$/u.test(name) )||!/[\p{L}]/u.test(name))
      fail('Nome inválido: use 3 a 52 caracteres, somente letras, espaços, pontos e hífens.');
    return name;
  }
  const addOverride=db.prepare("INSERT INTO student_overrides(id,name,inactive,updated_at) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,inactive=excluded.inactive,updated_at=excluded.updated_at");
  const audit=db.prepare('INSERT INTO student_audit(id,student_id,action,old_name,new_name,at) VALUES(?,?,?,?,?,?)');
  function teacherSession(request) {
    const raw=String(request.headers['x-classmana-teacher']||'');
    if(!/^[a-f0-9]{64}$/.test(raw)) return false;
    const key=digest(raw), until=adminSessions.get(key);
    if(!until || until<=Date.now()) {adminSessions.delete(key);return false;}
    return true;
  }
  function requireTeacher(request) {if(!teacherSession(request)) fail('Acesso do professor expirou. Entre novamente.',401);}
  function route(request, action, data) {
    if (!actions.has(action)) fail('Ação desconhecida',404);
    if (!configured) fail('Painel do professor ainda não configurado no Railway V2.',503);
    if (action==='teacherLogin') {
      if (request.method!=='POST') fail('Método inválido',405);
      const ip=String(request.socket.remoteAddress||'local');
      const entry=failures.get(ip)||{n:0,blockedUntil:0};
      if(entry.blockedUntil>Date.now()) fail('Aguarde alguns minutos antes de tentar novamente.',429);
      const password=String(data.password||'');
      if(!checkPassword(password)) {
        entry.n++;
        if(entry.n>=5){entry.blockedUntil=Date.now()+15*60*1000;entry.n=0;}
        failures.set(ip,entry);
        fail('Senha de professor inválida.',401);
      }
      failures.delete(ip);
      const token=randomBytes(32).toString('hex');
      adminSessions.set(digest(token),Date.now()+sessionsExpireAt);
      return {token,expiresInSeconds:sessionsExpireAt/1000};
    }
    requireTeacher(request);
    if(action==='teacherChangePassword'){
      if(request.method!=='POST') fail('Método inválido',405);
      const current=String(data.currentPassword||''),next=String(data.newPassword||'');
      if(!checkPassword(current))fail('Senha atual incorreta.',401);
      if(next.length<12||next.length>128||!/[A-Za-z\p{L}]/u.test(next)||!/[0-9]/.test(next))
        fail('A nova senha deve conter de 12 a 128 caracteres, incluindo letra e número.',400);
      if(next===current)fail('Escolha uma senha diferente da atual.',400);
      const salt=randomBytes(16).toString('hex');
      const passwordHash=scryptSync(next,Buffer.from(salt,'hex'),64).toString('hex');
      savePasswordOverride.run('scrypt:'+salt+':'+passwordHash);
      adminSessions.clear();
      failures.clear();
      return {passwordChanged:true,requiresLogin:true};
    }
    if (action==='teacherStatus'||action==='teacherStudents') {
      if(request.method!=='GET') fail('Método inválido',405);
      const counts=Object.fromEntries(['A','B','C'].map(h=>[h,players.filter(p=>p.house===h).length]));
      return {counts,students:action==='teacherStudents'?players:undefined,teams:allowedTeams,
        lastReset:db.prepare('SELECT id,at,duels_count AS duelsCount FROM teacher_resets ORDER BY at DESC LIMIT 1').get()||null};
    }
    if (action==='teacherAddStudent') {
      if(request.method!=='POST') fail('Método inválido',405);
      const house=String(data.house||'').toUpperCase();
      const name=validName(data.name);
      const team=String(data.team||'').trim();
      if(!['A','B','C'].includes(house)) fail('Turma inválida: escolha A, B ou C.');
      if(team && !allowedTeams.includes(team)) fail('Escolha uma equipe existente.');
      if(players.some(p=>p.house===house&&p.name.localeCompare(name,'pt-BR',{sensitivity:'base'})===0))fail('Este aluno já está cadastrado nesta turma.',409);
      const max=[...known.keys()].filter(id=>id[0]===house).reduce((n,id)=>Math.max(n,Number(id.slice(1))),0);
      if(max>=99) fail('Esta turma atingiu o limite de 99 registros.');
      const id=house+String(max+1).padStart(2,'0');
      const student={id,name,house,team};
      db.prepare('INSERT INTO extra_students(id,name,house,team,created_at) VALUES(?,?,?,?,?)')
        .run(id,name,house,team,new Date().toISOString());
      players.push(student);known.set(id,student);
      return {student,counts:Object.fromEntries(['A','B','C'].map(h=>[h,players.filter(p=>p.house===h).length]))};
    }
    if(action==='teacherRenameStudent'){
      if(request.method!=='POST')fail('Método inválido',405);
      const id=String(data.id||''),person=known.get(id);
      if(!person||inactive.has(id))fail('Aluno não encontrado ou excluído.',404);
      const name=validName(data.name);
      if(players.some(p=>p.id!==id&&p.house===person.house&&p.name.localeCompare(name,'pt-BR',{sensitivity:'base'})===0))
        fail('Já existe um aluno com este nome nesta turma.',409);
      if(name===person.name)return {student:{...person},unchanged:true};
      const old=person.name,at=new Date().toISOString();
      db.exec('BEGIN IMMEDIATE');
      try{
        addOverride.run(id,name,0,at);
        if(db.prepare('SELECT id FROM extra_students WHERE id=?').get(id))
          db.prepare('UPDATE extra_students SET name=? WHERE id=?').run(name,id);
        audit.run(randomBytes(12).toString('hex'),id,'rename',old,name,at);
        db.exec('COMMIT');
      }catch(e){db.exec('ROLLBACK');throw e}
      person.name=name;
      return {student:{...person},previousName:old};
    }
    if(action==='teacherDeleteStudent'){
      if(request.method!=='POST')fail('Método inválido',405);
      const id=String(data.id||''),person=known.get(id);
      if(!person||inactive.has(id))fail('Aluno não encontrado ou já excluído.',404);
      if(data.confirmation!==id)fail('Confirme usando o código exato do aluno: '+id,400);
      const at=new Date().toISOString();
      db.exec('BEGIN IMMEDIATE');
      try{
        addOverride.run(id,person.name,1,at);
        audit.run(randomBytes(12).toString('hex'),id,'delete',person.name,null,at);
        db.prepare('DELETE FROM sessions WHERE player=?').run(id);
        db.exec('COMMIT');
      }catch(e){db.exec('ROLLBACK');throw e}
      inactive.add(id);
      const idx=players.findIndex(p=>p.id===id);if(idx>=0)players.splice(idx,1);
      // ID bloqueado permanentemente: não será reutilizado por novo aluno.
      return {student:{...person},inactive:true,historyPreserved:true};
    }
    if(action==='teacherResetScores') {
      if(request.method!=='POST') fail('Método inválido',405);
      if(data.confirmation!=='ZERAR V2') fail('Digite exatamente ZERAR V2 para confirmar.',400);
      // Salva cópia dos duelos e operações no MESMO banco V2 antes de zerar rankings.
      db.exec('BEGIN IMMEDIATE');
      try{
        const duels=db.prepare('SELECT * FROM duels').all(),operations=db.prepare('SELECT * FROM operations').all();
        const id=randomBytes(12).toString('hex'),at=new Date().toISOString();
        db.prepare('INSERT INTO teacher_resets(id,at,duels_snapshot,operations_snapshot,duels_count,operations_count) VALUES(?,?,?,?,?,?)')
          .run(id,at,JSON.stringify(duels),JSON.stringify(operations),duels.length,operations.length);
        db.exec('DELETE FROM operations; DELETE FROM duels;');
        db.exec('COMMIT');
        return {resetId:id,at,duelsRemoved:duels.length,operationsRemoved:operations.length};
      }catch(error){db.exec('ROLLBACK');throw error;}
    }
    fail('Ação desconhecida',404);
  }
  return {handles:action=>actions.has(action),route,isInactive:id=>inactive.has(id)};
}
