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
  if(instruction)instruction.textContent=person?'Sessão ativa · Jogue ou desafie diretamente.':'Sessão livre para novo jogador';
  if(exit){exit.disabled=false;exit.setAttribute('aria-disabled',String(!person));exit.title=person?'Encerrar a sessão de '+person:'Nenhuma sessão ativa';}
  for(const el of [play,challenges]){
   if(!el)continue;
   el.dataset.sessionOccupied=person?'true':'false';
   el.title=person?'Sessão de '+person+'. Se não é você, encerre antes de jogar.':'Pronto para jogar. Escolha seu nome.';
  }
  if(notice){notice.dataset.visible='false';notice.hidden=true;}
 }
 // Tooltip only when the user hovers, focuses or taps; never a fixed banner.
 const notice=$('cm-v2-session-notice');
 let noteTimer;
 function tooltipFor(button){
  if(!notice)return;
  const id=getId(),person=id?byId(id):null;
  if(button?.dataset.v2Action==='encerrar'){
   notice.textContent=person?'Encerrar a sessão de '+person+' para trocar de aluno.':'Sessão livre · Nenhum aluno para desconectar.';
  }else{
   notice.textContent=person?'Sessão de '+person+'. Se você é outro aluno, encerre a sessão anterior.':'Sessão livre · Selecione JOGAR para começar.';
  }
  notice.hidden=false;notice.dataset.visible='true';clearTimeout(noteTimer);
 }
 function hideTooltip(delay=0){
  clearTimeout(noteTimer);
  noteTimer=setTimeout(()=>{if(notice){notice.dataset.visible='false';notice.hidden=true;}},delay);
 }
 for(const action of ['encerrar','jogar']){
  const button=document.querySelector('[data-v2-action="'+action+'"]');
  button?.addEventListener('pointerenter',()=>tooltipFor(button));
  button?.addEventListener('pointerleave',()=>hideTooltip());
  button?.addEventListener('focus',()=>tooltipFor(button));
  button?.addEventListener('blur',()=>hideTooltip());
  button?.addEventListener('pointerdown',event=>{
   if(event.pointerType!=='mouse'){tooltipFor(button);hideTooltip(2800)}
  });
 }
 $('cm-v2-home-exit')?.addEventListener('click',event=>{
  if(event.currentTarget.getAttribute('aria-disabled')==='true'){
   event.preventDefault();event.stopImmediatePropagation();tooltipFor(event.currentTarget);hideTooltip(2300);
  }
 },true);
 // Perfil ativo não exige confirmação repetida. Troca somente por ENCERRAR SESSÃO.
 window.addEventListener('classmana:v2-lobby-session-changed',paint);
 window.addEventListener('storage',e=>{if(e.key===key)paint()});
 document.addEventListener('DOMContentLoaded',paint,{once:true});
 paint();
})();
