import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import {randomUUID,randomBytes,createHash} from 'node:crypto';
import {readFileSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {createTeacherAdmin} from './teacher-admin.mjs';

const roster=JSON.parse(readFileSync(new URL('./roster.json',import.meta.url),'utf8'));
const teamMembership=JSON.parse(readFileSync(new URL('./teams.json',import.meta.url),'utf8'));
const players=Object.entries(roster).flatMap(([house,names])=>names.map((name,i)=>{
 const id=house+String(i+1).padStart(2,'0');
 return {id,name,house,team:teamMembership[id]||''};
}));
const known=new Map(players.map(p=>[p.id,p]));
const dbFile=resolve(process.env.DB_PATH||'/data/classmana.sqlite');
mkdirSync(dirname(dbFile),{recursive:true});
const db=new DatabaseSync(dbFile);
db.exec("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS sessions (hash TEXT PRIMARY KEY, player TEXT NOT NULL, expires INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS duels (id TEXT PRIMARY KEY, creator TEXT NOT NULL, recipient TEXT NOT NULL, kind TEXT NOT NULL, level TEXT NOT NULL, created TEXT NOT NULL, status TEXT NOT NULL, creator_shots TEXT, recipient_shots TEXT, creator_score INTEGER, recipient_score INTEGER); CREATE TABLE IF NOT EXISTS operations (player TEXT NOT NULL, request_id TEXT NOT NULL, response TEXT NOT NULL, PRIMARY KEY(player,request_id)); CREATE INDEX IF NOT EXISTS idx_duel_a ON duels(creator);CREATE INDEX IF NOT EXISTS idx_duel_b ON duels(recipient)");
const sql={
  session:db.prepare("SELECT player,expires FROM sessions WHERE hash=?"),
  putSession:db.prepare("INSERT OR REPLACE INTO sessions(hash,player,expires) VALUES(?,?,?)"),
  duel:db.prepare("SELECT * FROM duels WHERE id=?"),
  inbox:db.prepare("SELECT * FROM duels WHERE creator=? OR recipient=? ORDER BY created DESC LIMIT 200"),
  activePair:db.prepare("SELECT * FROM duels WHERE creator=? AND recipient=? AND kind=? AND level=? AND status IN ('CRIADOR_JOGANDO','PENDENTE','ACEITO') AND created>=? ORDER BY created DESC LIMIT 1"),
  insert:db.prepare("INSERT INTO duels(id,creator,recipient,kind,level,created,status) VALUES(?,?,?,?,?,?,?)"),
  updateState:db.prepare("UPDATE duels SET status=? WHERE id=?"),
  creator:db.prepare("UPDATE duels SET creator_shots=?,creator_score=?,status='PENDENTE' WHERE id=?"),
  recipient:db.prepare("UPDATE duels SET recipient_shots=?,recipient_score=?,status='CONCLUIDO' WHERE id=?"),
  operation:db.prepare("SELECT response FROM operations WHERE player=? AND request_id=?"),
  writeOperation:db.prepare("INSERT INTO operations(player,request_id,response) VALUES(?,?,?)")
};
const sha=x=>createHash('sha256').update(String(x)).digest('hex');
function fail(message,status=400){const error=Error(message);error.status=status;throw error}
function auth(request){const token=(request.headers.authorization||'').replace(/^Bearer\s+/i,'');const row=token&&sql.session.get(sha(token));return row&&row.expires>Date.now()?known.get(row.player):null}
function requirePlayer(request){return auth(request)||fail('Selecione um perfil antes de entrar no duelo.',401)}
const teacher = createTeacherAdmin({db,players,known,teamMembership,fail});
function publicDuel(d){return {id:d.id,creator:known.get(d.creator),recipient:known.get(d.recipient),kind:d.kind,level:d.level,created:d.created,status:d.status,creatorShots:d.creator_shots?JSON.parse(d.creator_shots):[],recipientShots:d.recipient_shots?JSON.parse(d.recipient_shots):[],creatorScore:d.creator_score,recipientScore:d.recipient_score,rules:11}}
// Mesmas regras do catálogo do jogo; o servidor valida cada disparo.
const serverBows=Object.freeze({
 classico:{ring:1,bonus:0,requiredWins:0},real:{ring:1.12,bonus:1,requiredWins:1},
 vento:{ring:1,bonus:0,requiredWins:2},lendario:{ring:1.22,bonus:2,requiredWins:4},
 besta_leve:{ring:.94,bonus:0,requiredWins:10},besta_real:{ring:1.08,bonus:1,requiredWins:12},
 recurvo:{ring:1.05,bonus:0,requiredWins:6},explorador:{ring:1.1,bonus:1,requiredWins:8},
 aloy:{ring:1.16,bonus:2,requiredWins:10}
});
function mediumTwinTargets(seconds){
 const t=Math.max(0,Math.min(120,Number(seconds)||0));
 return [{x:2.05*Math.sin(t*1.75),y:0,r:.70}];
}
function shotFlight(distance,power){return .43+.42*Math.pow(Math.max(10,distance)/80,.56)+.13*(1-power);}
const MEDIUM_DISTANCES=[20,45,75,110,150];
function shotsOf(shots,officialWins=0){
 if(!Array.isArray(shots)||shots.length!==5)fail('Exatamente cinco flechas são necessárias');
 return shots.map((s,i)=>{
  if(!s||typeof s!=='object')fail('Dados inválidos');
  const dx=Number(s.dx),dy=Number(s.dy),power=Number(s.power),time=Number(s.time),
    bow=s.bow||'classico',rules=serverBows[bow];
  if(![dx,dy,power,time].every(Number.isFinite)||Math.abs(dx)>100||Math.abs(dy)>100||
     power<0||power>1||time<0||time>7200||!rules)fail('Flecha inválida');
  if(officialWins<rules.requiredWins)fail('Equipamento bloqueado: vitórias oficiais insuficientes',403);
  const blocked=s.blocked===true,n=Math.hypot(dx,dy)*rules.ring;
  const points=blocked||n>1?0:Math.max(1,10-Math.floor(n*10));
  return {dx,dy,impactDx:dx,impactDy:dy,blocked,power,time,bow,
    score:points>0?Math.min(10,points+rules.bonus):0,number:i+1};
 });
}
function leaderboard(){
 const data=db.prepare("SELECT creator,recipient,creator_score,recipient_score FROM duels WHERE status='CONCLUIDO' AND creator_score IS NOT NULL AND recipient_score IS NOT NULL").all();
 const rows=new Map(players.map(p=>[p.id,{...p,plays:0,wins:0,losses:0,draws:0,total:0}]));
 for(const duel of data){
  for(const [id,own,other] of [[duel.creator,duel.creator_score,duel.recipient_score],[duel.recipient,duel.recipient_score,duel.creator_score]]){
   const player=rows.get(id);if(!player)continue;
   player.plays++;player.total+=own;
   if(own>other)player.wins++;else if(own<other)player.losses++;else player.draws++;
  }
 }
 const rank=(a,b)=>b.wins-a.wins||b.total-a.total||b.plays-a.plays||a.name.localeCompare(b.name,'pt-BR');
 const all=[...rows.values()];
 const summarize=(name,members)=>({
  name,members:members.length,
  plays:members.reduce((n,p)=>n+p.plays,0),
  wins:members.reduce((n,p)=>n+p.wins,0),
  losses:members.reduce((n,p)=>n+p.losses,0),
  draws:members.reduce((n,p)=>n+p.draws,0),
  total:members.reduce((n,p)=>n+p.total,0)
 });
 const classes=['A','B','C'].map(h=>summarize(h,all.filter(p=>p.house===h))).sort(rank);
 const names=[...new Set(all.map(p=>p.team).filter(Boolean))];
 const teams=names.map(name=>summarize(name,all.filter(p=>p.team===name))).sort(rank);
 return {games:data.length,classes,teams,players:all.filter(p=>p.plays>0).sort(rank)};
}
function route(request,action,data,query){
 if(action==='ping')return {api:10,persistent:true};
 if(action==='roster')return {players};
 if(action==='login'){const id=String(data.id||'');if(!known.has(id))fail('Perfil desconhecido');const token=randomBytes(32).toString('hex');sql.putSession.run(sha(token),id,Date.now()+30*86400000);return {user:known.get(id),token}}
 if(action==='ranking')return leaderboard();
 const player=requirePlayer(request);
 if(action==='me')return {user:player};
 if(action==='inbox')return {challenges:sql.inbox.all(player.id,player.id).map(publicDuel)};
 if(action==='opResult'){const saved=sql.operation.get(player.id,String(query.get('requestId')||''));return saved?JSON.parse(saved.response):{pending:true}}
 if(action==='challenge'&&request.method==='GET'){const d=sql.duel.get(query.get('id')||'');if(!d||(d.creator!==player.id&&d.recipient!==player.id))fail('Desafio não encontrado',404);return {challenge:publicDuel(d)}}
 if(action==='challenge'){const to=String(data.to||''),kind=String(data.kind||'');if(!known.has(to)||to===player.id)fail('Adversário inválido');if(!['mesma_turma','entre_equipes','interclasses'].includes(kind))fail('Modo inválido');if(kind==='mesma_turma'&&to[0]!==player.house)fail('Escolha aluno da mesma turma');if(kind==='interclasses'&&to[0]===player.house)fail('Escolha outra turma');const level=kind==='entre_equipes'?'iniciante':'avancado';const existing=sql.activePair.get(player.id,to,kind,level,new Date(Date.now()-24*3600000).toISOString());if(existing)return {challenge:publicDuel(existing),reused:true};const id=randomUUID();sql.insert.run(id,player.id,to,kind,level,new Date().toISOString(),'CRIADOR_JOGANDO');return {challenge:publicDuel(sql.duel.get(id))}}
 if(action==='answer'){const d=sql.duel.get(String(data.id||''));if(!d||d.recipient!==player.id)fail('Convite não encontrado',404);if(d.status!=='PENDENTE')fail('Convite não está pendente',409);if(!['accept','decline'].includes(data.decision))fail('Resposta inválida');sql.updateState.run(data.decision==='accept'?'ACEITO':'RECUSADO',d.id);return {challenge:publicDuel(sql.duel.get(d.id))}}
 if(action==='submit'){const d=sql.duel.get(String(data.id||''));if(!d||(d.creator!==player.id&&d.recipient!==player.id))fail('Duelo não encontrado',404);const first=d.creator===player.id;if(first?(d.status!=='CRIADOR_JOGANDO'||d.creator_shots):(d.status!=='ACEITO'||d.recipient_shots))fail('Esta rodada não pode ser registrada novamente',409);const officialWins=db.prepare("SELECT COUNT(*) AS n FROM duels WHERE status='CONCLUIDO' AND ((creator=? AND creator_score>recipient_score) OR (recipient=? AND recipient_score>creator_score))").get(player.id,player.id).n;
 const shots=shotsOf(data.shots,officialWins),score=shots.reduce((a,x)=>a+x.score,0);(first?sql.creator:sql.recipient).run(JSON.stringify(shots),score,d.id);return {score,shots,challenge:publicDuel(sql.duel.get(d.id))}}
 fail('Ação desconhecida',404);
}
const allow=(process.env.ALLOWED_ORIGINS||'https://drjcs2020.github.io,http://localhost:8000,http://127.0.0.1:8000').split(',');
const headers=origin=>({'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':origin||'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization,X-ClassMana-Teacher'});
function send(res,status,json,origin){res.writeHead(status,headers(origin));res.end(JSON.stringify(json))}
const server=http.createServer(async(req,res)=>{
 const origin=req.headers.origin||'';if(origin&&!allow.includes(origin)){send(res,403,{ok:false,error:'Origem não autorizada'},'null');return}
 if(req.method==='OPTIONS'){res.writeHead(204,headers(origin));res.end();return}
 let url;try{url=new URL(req.url,'http://localhost')}catch{send(res,400,{ok:false,error:'URL inválida'},origin);return}
 if(url.pathname!=='/api'){send(res,404,{ok:false,error:'Use /api?action=ping'},origin);return}
 try{
  if(!['GET','POST'].includes(req.method))fail('Método inválido',405);
  let raw='';if(req.method==='POST')for await(const chunk of req){raw+=chunk;if(raw.length>64000)fail('Pedido grande demais',413)}
  const data=raw?JSON.parse(raw):{},action=url.searchParams.get('action')||'';
  if(teacher.handles(action)){send(res,200,{ok:true,...teacher.route(req,action,data)},origin);return;}
  if(req.method==='POST'&&!['login','ping'].includes(action)){
    const player=requirePlayer(req),id=String(data.requestId||'');if(!/^[\w-]{10,128}$/.test(id))fail('ID do pedido inválido');
    const previous=sql.operation.get(player.id,id);if(previous){send(res,200,JSON.parse(previous.response),origin);return}
    db.exec('BEGIN IMMEDIATE');
    let result;try{result={ok:true,...route(req,action,data,url.searchParams)};sql.writeOperation.run(player.id,id,JSON.stringify(result));db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');throw e}
    send(res,200,result,origin);return;
  }
  send(res,200,{ok:true,...route(req,action,data,url.searchParams)},origin);
 }catch(e){if(!e.status)console.error('Backend fault',e);send(res,e.status||500,{ok:false,error:e.status?e.message:'Erro interno'},origin)}
});
server.listen(Number(process.env.PORT||3000),'0.0.0.0');
