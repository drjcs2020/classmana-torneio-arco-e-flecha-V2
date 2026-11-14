/* ClassMana — níveis oficiais em todas as seleções e listas de duelo.
 * Somente apresentação: nenhuma alteração de sorteio, placar ou desafios.
 * Mesma progressão de getGearLevel (equipment-catalog.js): vitórias oficiais.
 */
(()=>{
'use strict';
const API='https://classmana-v2-duel-api-production.up.railway.app/api?action=ranking';
const roster=()=>window.CLASSMANA_ROSTER||{};
const valid=id=>/^[ABC]\d{2}$/.test(id||'');
const byName=name=>{
 const out=[];for(const [h,people] of Object.entries(roster()))(people||[]).forEach((n,i)=>{if(n===name)out.push(h+String(i+1).padStart(2,'0'))});
 return out.length===1?out[0]:'';
};
let official=null,loading=false,requestTime=0,renderTimer=0;
const level=wins=>{const n=Math.max(0,Number(wins)||0);return n>=10?7:n>=8?6:n>=6?5:n>=4?4:n>=2?3:n>=1?2:1};
const lvl=id=>!official||!valid(id)?'—':'Nv. '+level(official.get(id)||0);
const decorate=(node,id)=>{
 if(!node||!valid(id))return;
 const value=lvl(id);
 let badge=node.querySelector(':scope > .cm-official-level');
 if(!badge){badge=document.createElement('span');badge.className='cm-official-level';node.appendChild(badge)}
 if(badge.textContent!==value)badge.textContent=value;
 badge.title=official?'Nível de progressão no torneio, calculado por vitórias oficiais (não é o nível pedagógico XP do ClassMana)':'Aguardando consulta ao ranking oficial';
};
function savedMatch(){try{return JSON.parse(sessionStorage.getItem('cm_active_archery_match_v2')||'null')}catch{return null}}
const current=()=>document.getElementById('player')?.value||savedMatch()?.playerId||sessionStorage.getItem('cm_active_student_v2')||localStorage.getItem('cm_v2_lobby_student')||'';
function paint(){
 const self=current();
 // Também mostrar os níveis na arena, inclusive na página separada arena.html.
 // O robô não tem nível de aluno; nunca inventar nível para ele.
 const active=savedMatch();
 if(document.getElementById('hud-player'))decorate(document.getElementById('hud-player'),active?.playerId||self);
 const rival=active?.incoming?.playerId||active?.rivalId;
 if(document.getElementById('hud-bot')&&valid(rival)&&!['bot','practice'].includes(active?.mode))
   decorate(document.getElementById('hud-bot'),rival);
 // Cartões ilustrados: o nível fica junto ao nome, nunca no brasão.
 decorate(document.getElementById('cm-draw-left-name'),self);
 const right=document.getElementById('cm-draw-right-name');
 const chosen=document.querySelector('#cm-draw-list-items .cm-draw-list-item.active');
 if(chosen)decorate(right,chosen.dataset.studentId);
 // Nomes das três modalidades de duelo.
 decorate(document.getElementById('cm-same-player-name'),self);
 decorate(document.getElementById('cm-global-player-name'),self);
 decorate(document.getElementById('cm-previous-session-name'),self);
 // Roleta: todas as opções exibem seus níveis, sem interferir no sorteio.
 document.querySelectorAll('#cm-draw-list-items .cm-draw-list-item[data-student-id]').forEach(row=>decorate(row,row.dataset.studentId));
 // Seletor principal de adversários, usado nas modalidades entre equipes, mesma turma e interclasses.
 document.querySelectorAll('#cm-v2-student-list .cm-v2-student-option[data-player-id]').forEach(row=>decorate(row,row.dataset.playerId));
 // Lista ilustrada da mesma turma / de outras turmas: respeita a ordem das opções nativas.
 const optionIds=[...document.querySelectorAll('#rival option')].filter(o=>valid(o.value)).map(o=>o.value);
 document.querySelectorAll('#cm-same-rivals-list .cm-same-rival-option').forEach((row,i)=>{
  if(optionIds[i])decorate(row,optionIds[i]);
 });
 // Adversário escolhido: acompanha troca de modo e de aluno.
 decorate(document.getElementById('cm-same-button-text'),document.getElementById('rival')?.value);
 decorate(document.getElementById('cm-v2-picked-name'),document.getElementById('rival')?.value);
 // Meus desafios: convites recebidos, enviados, concluídos e recusados.
 document.querySelectorAll('#inbox-list .cm-challenge > strong').forEach(title=>{
  const text=title.childNodes[0]?.textContent||'';
  const opponent=text.replace(/^.*?(?:Você desafiou |Você foi desafiado por )/,'').trim();
  const id=byName(opponent);
  if(id)decorate(title,id);
 });
}
function schedule(){if(renderTimer)return;renderTimer=requestAnimationFrame(()=>{renderTimer=0;paint()})}
async function refresh(){
 if(loading||Date.now()-requestTime<30000)return;
 loading=true;requestTime=Date.now();
 try{
  const response=await fetch(API,{cache:'no-store',mode:'cors'});
  if(!response.ok)throw Error('Ranking temporariamente indisponível');
  const data=await response.json();
  if(!data.ok||!Array.isArray(data.players))throw Error('Ranking não confirmado');
  official=new Map(data.players.filter(p=>valid(p.id)).map(p=>[p.id,Math.max(0,Number(p.wins)||0)]));
  schedule();
 }catch(e){console.warn('[ClassMana] Níveis oficiais indisponíveis:',e.message)}
 finally{loading=false}
}
const style=document.createElement('style');
style.textContent=`
.cm-official-level{display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;
 margin-left:7px;padding:2px 7px;border:1px solid #e9ba4d;border-radius:999px;
 background:linear-gradient(180deg,#284366,#091b37);color:#ffe7a3;
 font:700 11px/1.2 Georgia,serif;vertical-align:middle;text-shadow:0 1px 1px #000;letter-spacing:.15px}
.cm-draw-list-item .cm-official-level,.cm-v2-student-option .cm-official-level,
.cm-same-rival-option .cm-official-level{margin-left:auto;flex-shrink:0}
#cm-draw-left-name .cm-official-level,#cm-draw-right-name .cm-official-level{font-size:11px}
#inbox-list .cm-challenge > strong .cm-official-level{font-size:11px}
`;
document.head.appendChild(style);
const watch=()=>{
 const observer=new MutationObserver(records=>{
  // A arena reescreve textContent a cada flecha; recolocar o selo sem causar loop.
  if(records.some(record=>!record.target?.closest?.('.cm-official-level') &&
    ([...record.addedNodes].some(n=>!n.classList?.contains('cm-official-level')) ||
     [...record.removedNodes].some(n=>n.classList?.contains('cm-official-level')))))schedule();
 });
 observer.observe(document.body,{subtree:true,childList:true});
 document.addEventListener('change',schedule);
 window.addEventListener('classmana:v2-lobby-session-changed',()=>{schedule();void refresh()});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){schedule();void refresh()}});
 document.addEventListener('click',event=>{
  if(event.target.closest?.('[data-play-mode],#cm-draw-roll,#cm-open-challenges,[data-v2-action="desafios"],#cm-same-open-rivals')){schedule();void refresh()}
 },true);
 schedule();void refresh();
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true});else watch();
})();
