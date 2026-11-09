/* ClassMana V2 — ONLY presentation / navigation UI.
 * Integrates visual roster cards with the existing HTML selects and their original handlers.
 * Never computes scores, creates duels, or calls the Railway API itself.
 */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const H={A:{name:'Águia Dourada',short:'4º A',hero:'aguia-m.webp'},B:{name:'Leão de Fogo',short:'4º B',hero:'leao-m.webp'},C:{name:'Dragão de Esmeralda',short:'4º C',hero:'dragao-f.webp'}};
const isDuel=mode=>['challenge','challenge_same','challenge_team'].includes(mode);
const normal=s=>(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const emit=(node)=>node?.dispatchEvent(new Event('change',{bubbles:true}));
const guard=fn=>event=>{try{fn(event)}catch(error){console.warn('Interface V2:',error)}};
function mount(){
 const page=document.body.dataset.page;
 if(page==='arena'){
  // In the arena, every interactive control belongs to the original game code.
  document.body.classList.add('cm-v2-design');
  watchOutcome();
  mountResultHome();
  return;
 }
 if(page!=='lobby')return;
 document.body.classList.add('cm-v2-design','cm-v2-home-mode');
 let selectedHouse='A';
 const root=$('view-inicio'),mode=$('mode'),player=$('player'),rival=$('rival'),opponentHouse=$('opponent-house');
 const search=$('cm-v2-student-search'),list=$('cm-v2-student-list'),picked=$('cm-v2-picked-name'),info=$('cm-v2-picker-info');
 const home=()=>{
  document.body.classList.add('cm-v2-home-mode');
  document.body.classList.remove('cm-v2-onboarding');
  delete document.body.dataset.v2Entry;
  search.value='';
  window.scrollTo?.(0,0);
 };
 const enter=()=>{
  document.body.classList.remove('cm-v2-home-mode');
  document.body.classList.add('cm-v2-onboarding');
  if(root?.dataset.step!=='reino'){
   // Existing navigation owns state transitions. Only ask it to return to the first step.
   const stepButton=document.querySelector('[data-lobby-step="reino"]');
   stepButton?.click();
  }
  window.scrollTo?.(0,0);
 };
 // Um aluno já selecionado não passa novamente por Casa e QUEM VAI JOGAR.
 const openActive=step=>{
  if(typeof window.classmanaOpenActiveLobbyStep!=='function'||!window.classmanaOpenActiveLobbyStep(step))return false;
  document.body.classList.remove('cm-v2-home-mode');
  document.body.classList.add('cm-v2-onboarding');
  delete document.body.dataset.v2Entry;
  window.scrollTo?.(0,0);
  return true;
 };
 document.querySelectorAll('[data-v2-action]').forEach(button=>button.addEventListener('click',guard(()=>{
  const action=button.dataset.v2Action;
  if(action==='jogar'&&!openActive('heroi')){delete document.body.dataset.v2Entry;enter();}
  if(action==='desafios'&&!openActive('desafio')){
   enter();
   document.body.dataset.v2Entry='challenges';
  }
  if(action==='ranking')document.querySelector('[data-view="ranking"]')?.click();
  if(action==='regras')document.querySelector('[data-view="regras"]')?.click();
 })));
 // DESAFIOS reutiliza o botão de Casa original (selectHouse -> QUEM VAI JOGAR).
 document.querySelectorAll('[data-v2-challenge-house]').forEach(card=>{
  const chosen=card.dataset.v2ChallengeHouse;
  const names=window.CLASSMANA_ROSTER?.[chosen];
  const total=Array.isArray(names)?names.length:0;
  const counter=card.querySelector('.cm-v2-challenge-card-label small');
  if(counter)counter.textContent=total?total+' arqueiros':'Escolher turma';
  card.addEventListener('click',guard(()=>{
   document.querySelector('.house[data-house="'+chosen+'"]')?.click();
  }));
 });
 $('cm-v2-navigate-back')?.addEventListener('click',guard(()=>{
  if(!root||root.dataset.step==='reino')home();
  else if(root.dataset.step==='perfil'){
   $('cm-identity-back')?.click();
  }else $('cm-lobby-back')?.click();
 }));
 // Live player-selection card: labels always come from original roster and SELECT options.
 const houseButtons=[...document.querySelectorAll('[data-v2-house]')];
 function ownHouse(){
  const id=player?.value;
  if(/^[ABC]\d{2}$/.test(id||''))return id[0];
  return root?.dataset.house||document.querySelector('.house.selected')?.dataset.house||'A';
 }
 function setTargetHouse(h){
  if(!H[h]||!mode||!rival)return;
  selectedHouse=h;
  const own=ownHouse();
  // Preserve mode semantics: same-house challenges vs interclasses.
  if(mode.value!=='challenge_team'){
   mode.value=h===own?'challenge_same':'challenge';emit(mode);
  } else if(h!==own){
   const scope=$('team-scope');if(scope){scope.value='other';emit(scope)}
  }
  if(opponentHouse?.querySelector(`option[value="${h}"]`)){
   opponentHouse.value=h;emit(opponentHouse);
  }
  search.value='';
  renderCards();
 }
 function renderCards(){
  if(!mode||!rival||!list)return;
  const valid=isDuel(mode.value);
  mode.dataset.v2Duel=valid?'yes':'no';
  const current=ownHouse();
  let actualHouse=valid?(mode.value==='challenge_same'?current:opponentHouse?.value||current):current;
  // Don't silently switch an opposing house chosen in the original form.
  selectedHouse=actualHouse;
  houseButtons.forEach(btn=>{
   const h=btn.dataset.v2House;
   btn.setAttribute('aria-pressed',String(h===actualHouse));
   btn.title=H[h].name+' · '+H[h].short;
  });
  const options=Array.from(rival.options).filter(x=>/^[ABC]\d{2}$/.test(x.value));
  const q=normal(search?.value.trim());
  const filtered=options.filter(x=>!q||normal(x.textContent).includes(q));
  list.replaceChildren();
  for(const opt of filtered){
   const h=opt.value[0];
   const label=opt.textContent.replace(/\s*[·•]\s*4º\s*[ABC].*$/i,'').trim();
   const button=document.createElement('button');button.type='button';button.className='cm-v2-student-option';
   button.dataset.playerId=opt.value;
   button.setAttribute('aria-pressed',String(rival.value===opt.value));
   const img=document.createElement('img');img.src='assets/v2/heroes/'+H[h].hero;img.alt='';img.loading='lazy';
   const span=document.createElement('span');span.textContent=label;
   const meta=document.createElement('small');meta.textContent=H[h].short+' · '+H[h].name;
   span.append(meta);button.append(img,span);
   button.addEventListener('click',()=>{
    rival.value=opt.value;emit(rival);
    document.querySelectorAll('.cm-v2-student-option').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));
    picked.textContent='✓ Desafiar '+label+' · '+H[h].short;
   });
   list.append(button);
  }
  if(info)info.textContent=options.length+' aluno(s) disponível(is) · '+H[actualHouse].short+' · '+H[actualHouse].name;
  if(picked){
   const chosen=options.find(x=>x.value===rival.value);
   picked.textContent=chosen?'✓ Adversário selecionado: '+chosen.textContent:'Escolha um colega da lista.';
  }
  if(!filtered.length){const empty=document.createElement('p');empty.textContent=options.length?'Nenhum aluno encontrado.':'Nenhum colega disponível nesta seleção.';empty.style.cssText='color:#ffe3b0;font-weight:700;padding:8px';list.append(empty)}
 }
 houseButtons.forEach(button=>button.addEventListener('click',guard(()=>setTargetHouse(button.dataset.v2House))));
 search?.addEventListener('input',renderCards);
 mode?.addEventListener('change',renderCards);
 opponentHouse?.addEventListener('change',renderCards);
 rival?.addEventListener('change',renderCards);
 $('team-scope')?.addEventListener('change',renderCards);
 $('opponent-team')?.addEventListener('change',renderCards);
 player?.addEventListener('change',renderCards);
 document.querySelectorAll('.house').forEach(btn=>btn.addEventListener('click',()=>{
  selectedHouse=btn.dataset.house;
  renderCards();
 }));
 document.querySelectorAll('[data-play-mode]').forEach(btn=>btn.addEventListener('click',()=>{
  // Existing handler chooses the real match mode. Re-render after it runs.
  queueMicrotask(renderCards);
 }));
 // Only re-render after the existing code has filled the roster.
 let lastStep='';
 const observer=new MutationObserver(()=>{
  if(root.dataset.step===lastStep)return;
  lastStep=root.dataset.step;
  if(lastStep==='partida')requestAnimationFrame(renderCards);
 });
 if(root)observer.observe(root,{attributes:true,attributeFilter:['data-step']});
 const restore=window.location.search.includes('continuar=1');
 if(restore){
   // JOGAR NOVAMENTE não passa pelas etapas anteriores.
   document.body.classList.remove('cm-v2-home-mode');
   document.body.classList.add('cm-v2-onboarding');
  }
 // If there is a returned active student, the original module handles the session.
 // This menu still requires an explicit click to proceed; no fake match is started.
 requestAnimationFrame(renderCards);
 watchOutcome();
 mountResultHome();
}
function mountResultHome(){
 const button=$('cm-v2-result-home'),title=$('finish-title');
 if(!button||!title)return;
 button.addEventListener('click',()=>{
  const state=normal(title.textContent);
  if(state.includes('salvando')){
   window.alert('O resultado ainda está sendo enviado. Conclua o salvamento antes de sair.');
   return;
  }
  if((state.includes('nao confirmado')||state.includes('erro'))&&
      !window.confirm('O resultado ainda não foi confirmado pelo servidor. Sair agora pode descartar esta tentativa. Deseja sair?'))return;
  // Na saída do resultado, mantenha a sessão e volte aos desafios.
  if(typeof window.classmanaReturnToChallenge==='function'){
   window.classmanaReturnToChallenge();return;
  }
  // Fallback se o módulo do jogo não estiver disponível.
  try{
   const student=sessionStorage.getItem('cm_active_student_v2');
   sessionStorage.removeItem('cm_active_archery_match_v2');
   if(/^[ABC][0-9]{2}$/.test(student||'')){
    sessionStorage.setItem('cm_internal_duel_return_v2','1');
    window.location.assign('./?continuar=1');return;
   }
  }catch{}
  window.location.assign('./');
 });
}
function watchOutcome(){
 const finish=$('finish'),title=$('finish-title');if(!finish||!title)return;
 function mark(){
  const value=normal(title.textContent);
  finish.dataset.v2Outcome=/vitoria|lendaria|recorde/.test(value)?'win':/derrota|continue treinando/.test(value)?'loss':/empate/.test(value)?'draw':'pending';
 }
 new MutationObserver(mark).observe(title,{characterData:true,childList:true,subtree:true});mark();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
