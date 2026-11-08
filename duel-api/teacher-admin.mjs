/** Administração do professor — exclusiva do backend ClassMana V2.
 * A senha NÃO fica no GitHub: configure TEACHER_PASSWORD_SHA256 no Railway V2.
 * Nenhum aluno possui permissões de administração.
 */
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';

export function createTeacherAdmin({ db, players, known, teamMembership, fail }) {
  db.exec(`CREATE TABLE IF NOT EXISTS extra_students (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, house TEXT NOT NULL, team TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS teacher_resets (
    id TEXT PRIMARY KEY, at TEXT NOT NULL, duels_snapshot TEXT NOT NULL,
    operations_snapshot TEXT NOT NULL, duels_count INTEGER NOT NULL, operations_count INTEGER NOT NULL);`);
  const extras = db.prepare('SELECT id,name,house,team FROM extra_students ORDER BY house,id').all();
  for (const player of extras) {
    if (!known.has(player.id)) { players.push(player); known.set(player.id, player); }
  }
  const actions = new Set(['teacherLogin','teacherStatus','teacherStudents','teacherAddStudent','teacherResetScores']);
  const adminSessions = new Map();
  const failures = new Map();
  const digest = value => createHash('sha256').update(String(value)).digest('hex');
  const configuredHash = String(process.env.TEACHER_PASSWORD_SHA256 || '').trim().toLowerCase();
  const configured = /^[a-f0-9]{64}$/.test(configuredHash);
  const compareDigest = (a,b) => {
    if (!/^[a-f0-9]{64}$/.test(a) || !/^[a-f0-9]{64}$/.test(b)) return false;
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  };
  const sessionsExpireAt = 30 * 60 * 1000;
  const allowedTeams = [...new Set(Object.values(teamMembership).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
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
      if(password.length>256 || !compareDigest(digest(password),configuredHash)) {
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
    if (action==='teacherStatus'||action==='teacherStudents') {
      if(request.method!=='GET') fail('Método inválido',405);
      const counts=Object.fromEntries(['A','B','C'].map(h=>[h,players.filter(p=>p.house===h).length]));
      return {counts,students:action==='teacherStudents'?players:undefined,teams:allowedTeams,
        lastReset:db.prepare('SELECT id,at,duels_count AS duelsCount FROM teacher_resets ORDER BY at DESC LIMIT 1').get()||null};
    }
    if (action==='teacherAddStudent') {
      if(request.method!=='POST') fail('Método inválido',405);
      const house=String(data.house||'').toUpperCase();
      const name=String(data.name||'').normalize('NFC').trim().replace(/\s+/g,' ');
      const team=String(data.team||'').trim();
      if(!['A','B','C'].includes(house)) fail('Turma inválida: escolha A, B ou C.');
      if(name.length<3 || name.length>52 || !/^[\p{L}\p{M} .-]+$/u.test(name) || !/[\p{L}]/u.test(name))fail('Use somente letras, pontos, espaços e hífens (3 a 52 caracteres).');
      if(team && !allowedTeams.includes(team)) fail('Escolha uma equipe existente.');
      if(players.some(p=>p.house===house&&p.name.localeCompare(name,'pt-BR',{sensitivity:'base'})===0))fail('Este aluno já está cadastrado nesta turma.',409);
      const max=players.filter(p=>p.house===house).reduce((n,p)=>Math.max(n,Number(p.id.slice(1))),0);
      if(max>=99) fail('Esta turma atingiu o limite de 99 registros.');
      const id=house+String(max+1).padStart(2,'0');
      const student={id,name,house,team};
      db.prepare('INSERT INTO extra_students(id,name,house,team,created_at) VALUES(?,?,?,?,?)')
        .run(id,name,house,team,new Date().toISOString());
      players.push(student);known.set(id,student);
      return {student,counts:Object.fromEntries(['A','B','C'].map(h=>[h,players.filter(p=>p.house===h).length]))};
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
  return {handles:action=>actions.has(action),route};
}
