/* Only the ClassMana V2 lobby: the original artwork, current player and five existing buttons. */
(()=>{
 'use strict';
 const key='cm_v2_lobby_student';
 const getId=()=>{try{const id=localStorage.getItem(key)||'';return /^[ABC]\d{2}$/.test(id)?id:''}catch{return ''}};
 const houses={A:{name:'Águia Dourada',grade:'4º A',crest:'aguia.webp'},B:{name:'Leão de Fogo',grade:'4º B',crest:'leao.webp'},C:{name:'Dragão de Esmeralda',grade:'4º C',crest:'dragao.webp'}};
 const byId=id=>{const rows=window.CLASSMANA_ROSTER?.[id[0]];const offset=Number(id.slice(1))-1;return Array.isArray(rows)&&offset>=0&&offset<rows.length?rows[offset]:null};
 const $=id=>document.getElementById(id);
 function paint(){
  const id=getId(),person=id?byId(id):null,h=id?houses[id[0]]:null;
  const exit=$('cm-v2-home-exit'),play=document.querySelector('[data-v2-action="jogar"]');
  const challenges=document.querySelector('[data-v2-action="desafios"]');
  const name=$('cm-v2-student-name'),level=$('cm-v2-student-level'),house=$('cm-v2-student-house'),instruction=$('cm-v2-student-instruction'),crest=$('cm-v2-student-crest'),notice=$('cm-v2-session-notice');
  if(name)name.textContent=person||'Nenhum aluno logado';
  // Torneio atual does not provide XP/level, so never invent them.
  if(level)level.textContent='Nv. —';
  if(house)house.textContent=h?h.grade+' · '+h.name:'Selecione seu aluno em JOGAR';
  if(crest){crest.src='assets/v2/crests/'+(h?.crest||'aguia.webp');crest.alt=h?'Brasão da '+h.name:''}
  if(instruction)instruction.textContent=person?'É você? Clique JOGAR e confirme.':'Sessão livre para novo jogador';
  if(exit){exit.disabled=!person;exit.title=person?'Encerrar a sessão de '+person:'Nenhuma sessão ativa';}
  for(const el of [play,challenges]){
   if(!el)continue;
   el.dataset.sessionOccupied=person?'true':'false';
   el.title=person?'Sessão de '+person+'. Se não é você, encerre antes de jogar.':'Pronto para jogar. Escolha seu nome.';
  }
  if(notice)notice.textContent=person?'Sessão atual: '+person+' · Se for outro aluno, encerre antes de jogar.':'Sessão livre · Selecione JOGAR para começar.';
 }
 function guard(event){
  const id=getId(),person=id?byId(id):null;
  if(!person)return;
  const action=event.currentTarget.dataset.v2Action;
  const ok=window.confirm('Sessão atual: '+person+'.\n\nÉ você quem vai continuar em '+action.toUpperCase()+'?\n\nSe for outro aluno, clique em ENCERRAR SESSÃO.');
  if(!ok){event.preventDefault();event.stopImmediatePropagation();}
 }
 // Register our guard in the capture phase, before the existing V2 UI handlers.
 for(const action of ['jogar','desafios'])document.querySelector('[data-v2-action="'+action+'"]')?.addEventListener('click',guard,true);
 window.addEventListener('classmana:v2-lobby-session-changed',paint);
 window.addEventListener('storage',e=>{if(e.key===key)paint()});
 document.addEventListener('DOMContentLoaded',paint,{once:true});
 paint();
})();
