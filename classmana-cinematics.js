/* ClassMana cinematics — based on the submitted prototype's emberRise / VS /
   WebAudio ideas, adapted to the existing vanilla-JS + Railway game. */
const houses={
 A:{name:'ÁGUIA DOURADA',short:'4º A',color:'#7fc9ff'},
 B:{name:'LEÃO DE FOGO',short:'4º B',color:'#ff9d6c'},
 C:{name:'DRAGÃO DE ESMERALDA',short:'4º C',color:'#80e9aa'}
};
const getHouse=id=>houses[id]?id:'A';
// Sexo dos avatares conforme elenco cadastrado; o que o aluno escolheu tem prioridade.
const femaleRoster={
 A:['Alice S.','Aline F.','Ana G.','Debora L.','Eloa B.','Isabela P.','Mayara M.','Sophia L.','Valentine T.'],
 B:['Agatha S.','Ana S.','Ana C.','Dafini C.','Heloisa S.','Isabelly M.','Lais L.','Livia S.','Manuele C.','Maria V.','Maysa A.','Nathalia L.','Sofia G.'],
 C:['Agatha C.','Alice O.','Ana M.','Angela C.','Emily B.','Ester A.','Isabella S.','Lavinia R.','Lavinia S.','Maria S.','Maria C.','Ralinne E.','Samantha S.','Sophia R.']
};
function genderFromRoster(id){
 if(!/^[ABC][0-9]{2}$/.test(id||''))return 'm';
 try{const stored=JSON.parse(localStorage.getItem('classmana-student-archer-genders-v2')||'{}');if(['m','f'].includes(stored?.[id]))return stored[id]}catch{}
 const name=window.CLASSMANA_ROSTER?.[id[0]]?.[Number(id.slice(1))-1];
 return femaleRoster[id[0]].includes(name)?'f':'m';
}
// Artes oficiais fornecidas para a V2: escudo e moldura de cada Casa.
const crest=house=>'assets/v2/crests/'+({A:'aguia',B:'leao',C:'dragao'}[getHouse(house)])+'.webp';
const portrait=(house,gender='m')=>{
 const h=getHouse(house),female=gender==='f'||gender==='female';
 // O masculino do Leão usa o recurso RGBA original comprovado:
 // não reutilizar a URL do HUD, que pode estar desatualizada após navegação.
 if(h==='B'&&!female)return 'assets/v2/heroes/leao-m.webp';
 return 'assets/v2/heroes/'+({A:'aguia',B:'leao',C:'dragao'}[h])+'-'+(female?'f':'m')+'.webp';
};
function portraitFallback(img,house,gender){
 const h=getHouse(house),female=gender==='f'||gender==='female';
 const backup=h==='B'&&!female?'assets/ui/characters/arqueiro-leao-de-fogo.png':
  'assets/archers/'+({A:'aguia',B:'leao',C:'dragao'}[h])+'-'+(female?'feminino':'masculino')+'.webp';
 img.addEventListener('error',()=>{if(!img.dataset.portraitFallback){img.dataset.portraitFallback='true';img.src=backup}}, {once:true});
}
const node=(tag,className,text)=>{
 const el=document.createElement(tag);
 if(className)el.className=className;
 if(text!==undefined)el.textContent=String(text);
 return el;
};
function emberLayer(host,house,count=16){
 const layer=node('div','cm-embers');
 layer.setAttribute('aria-hidden','true');
 layer.dataset.house=getHouse(house);
 const rng=i=>Math.abs(Math.sin(i*19.19+7.713));
 const home=host.id==='cm-v2-home';
 const total=Math.min(home?165:100,count);
 // Volta à densidade original das bordas: X cúbico aproxima brasas dos cantos.
 // A semente de cada lado é distinta: nenhuma dupla espelhada ou forma desenhada.
 for(let i=0;i<total;i++){
  const dot=node('span','cm-ember'),v=rng(i+1);
  const side=i%2;
  const edge=Math.pow(rng(i*7+21+side*113),3);
  const x=side===0?2+48*edge:98-48*edge;
  dot.style.setProperty('--ember-x',x.toFixed(1)+'%');
  dot.style.setProperty('--ember-size',(home?4.4+8.7*v+2.2*(1-edge):2.8+6.5*v).toFixed(1)+'px');
  dot.style.setProperty('--ember-duration',(3.4+5.4*rng(i+31)).toFixed(2)+'s');
  dot.style.setProperty('--ember-delay',(-9*rng(i+46)).toFixed(2)+'s');
  dot.style.setProperty('--ember-drift',(-72+144*rng(i+64)).toFixed(0)+'px');
  dot.style.setProperty('--ember-opacity',(home?.23+.76*(1-edge):.65+.35*v).toFixed(2));
  layer.append(dot);
 }
 host.prepend(layer);
 return layer;
}
/** Lightweight continuous atmosphere, using the same emberRise effect as VS.
 * House A: arcane blue sparks; B: glowing fire embers; C: emerald magic.
 * Decorative only: never intercepts clicks, gestures or gameplay physics. */
function mountAmbient(host,house='A',count=56){
 if(!host)return null;
 const existing=host.querySelector(':scope > .cm-ambient-embers');
 if(existing){
  existing.dataset.house=getHouse(house);
  return existing;
 }
 const layer=emberLayer(host,house,count);
 layer.classList.add('cm-ambient-embers');
 return layer;
}
function setAmbientHouse(house){
 for(const layer of document.querySelectorAll('.cm-ambient-embers')){
  layer.dataset.house=getHouse(house);
 }
}
function fighter(person,{robot=false}={}){
 const house=getHouse(person.house);
 const card=node('article','cm-vs-fighter');
 card.dataset.house=house;
 if(robot)card.classList.add('cm-vs-robot');
 const img=node('img');
 if(robot){
  // Retrato exclusivo do robô; nunca reutilizar a arqueira da Casa C.
  // O espelhamento do adversário continua sendo aplicado pela classe cm-vs-facing-left.
  img.alt='Robô arqueiro metálico com arco dourado e alvo no peito';
  img.src='assets/ui/challenge/robo-arqueiro-oficial.webp';
 }else{
  img.alt='Retrato do rosto do arqueiro da Casa '+houses[house].name;
  img.src=portrait(house,person.gender);
  portraitFallback(img,house,person.gender);
 }
 img.decoding='async';
 const crop=node('div','cm-combat-portrait');crop.append(img);
 const info=node('div','cm-vs-fighter-info');
 info.append(node('strong','',person.name||'Arqueiro'),
             node('small','',houses[house].short+' · '+houses[house].name));
 card.append(crop,info);
 return card;
}
let activeDialog=null;
// Manter a prévia VS sobre o lobby durante a troca de documento.
function dismissVersusTransition(){
 const overlay=document.getElementById('cm-vs-overlay');
 if(overlay?.dataset.launching==='true')overlay.remove();
 if(activeDialog===overlay)activeDialog=null;
}
// Navegar para trás usando o cache não deve trazer uma prévia congelada.
if(typeof window!=='undefined'){
 window.addEventListener('pageshow',event=>{
  if(event.persisted)dismissVersusTransition();
 });
}
function versus(config){
 // The actual challenge must already be validated/created by the existing API.
 if(activeDialog)return Promise.resolve(false);
 const own={name:config.player,house:config.house,gender:config.gender};
 const rival={name:config.rival,house:config.rivalHouse,gender:config.rivalGender||genderFromRoster(config.rivalId)};
 const outer=node('div','cm-vs-overlay');
 outer.id='cm-vs-overlay';
 outer.setAttribute('role','dialog');
 outer.setAttribute('aria-modal','true');
 outer.setAttribute('aria-labelledby','cm-vs-title');
 outer.dataset.house=getHouse(own.house);
 outer.dataset.mode=config.mode||'duel'; // estilização visual específica da prévia contra o robô
 const embers=emberLayer(outer,config.house,52);
 const shell=node('div','cm-vs-shell');
 const heading=node('div','cm-combat-heading');
 const leftCrest=node('img','cm-combat-heading-crest'),rightCrest=node('img','cm-combat-heading-crest');
 leftCrest.src=crest(own.house);rightCrest.src=crest(rival.house);
 leftCrest.alt='Escudo '+houses[getHouse(own.house)].name;
 rightCrest.alt='Escudo '+houses[getHouse(rival.house)].name;
 const title=node('h2','cm-vs-title',config.mode==='bot'?'DESAFIO DE TREINO':'DUELO ENTRE CASAS');
 title.id='cm-vs-title';
 if(config.mode!=='bot'){
   // Arte oficial já usada no seletor; não desenhar outro título via CSS.
   const art=node('img','cm-vs-title-art');
   art.src='assets/ui/challenge/banner-duelo-entre-casas.png';
   art.alt='DUELO ENTRE CASAS';
   title.textContent='';
   title.append(art);
   title.style.setProperty('background','none','important');
   title.style.setProperty('border','0','important');
   title.style.setProperty('box-shadow','none','important');
   title.style.setProperty('padding','0','important');
   title.style.setProperty('font-size','0','important');
   art.style.cssText='display:block;width:100%;height:auto;max-height:clamp(74px,15vh,143px);object-fit:contain;margin:auto';
 }
 const sub=node('p','cm-vs-sub','🏹 CINCO FLECHAS • MAIOR PONTUAÇÃO VENCE');
 const fighters=node('div','cm-vs-fighters');
 const versusSign=node('div','cm-vs-mark','VS');
 const ownCard=fighter(own), rivalCard=fighter(rival,{robot:config.mode==='bot'});
  // Apenas o retrato do adversário é espelhado: textos e moldura intactos.
  rivalCard.classList.add('cm-vs-facing-left');
  fighters.append(ownCard,versusSign,rivalCard);
  // Igual ao resultado: turma e Casa em uma única plaqueta, sem quebra forçada.
 const actions=node('div','cm-vs-actions');
 const start=node('button','cm-vs-start','▶ INICIAR DUELO');
 start.id='cm-vs-start';start.type='button';
 const cancel=node('button','cm-vs-cancel','← VOLTAR');
 cancel.id='cm-vs-cancel';cancel.type='button';
 actions.append(start,cancel);
 heading.append(leftCrest,title,rightCrest);
 const note=config.mode==='bot'
   ?'Treino contra o robô: sem envio ao servidor e sem pontos no ranking oficial.'
   :'O convite só é enviado uma vez. O placar permanece vinculado ao jogador.';
 shell.append(heading,sub,fighters,actions,node('p','cm-vs-note',note));
 outer.append(shell);document.body.append(outer);
 requestAnimationFrame(()=>requestAnimationFrame(()=>fitVersusLabels(outer)));
 document.fonts?.ready?.then(()=>requestAnimationFrame(()=>fitVersusLabels(outer)));
 const previousFocus=document.activeElement;
 activeDialog=outer;
 try{config.sound?.('banner')}catch{}
 start.focus();
 return new Promise(resolve=>{
  let done=false;
  const complete=bool=>{
   if(done)return;done=true;
   outer.removeEventListener('keydown',keys);
   activeDialog=null;
   if(bool){
    outer.dataset.launching='true';
    outer.setAttribute('aria-busy','true');
    start.disabled=true;cancel.disabled=true;
    start.textContent='⌛ ABRINDO ARENA...';
    try{config.sound?.('versus')}catch{}
   }else{
    outer.remove();previousFocus?.focus?.();
    try{config.sound?.('back')}catch{}
   }
   resolve(bool);
  };
  const keys=event=>{
   if(event.key==='Escape'){event.preventDefault();complete(false);}
   if(event.key==='Tab'){
    const target=event.shiftKey?(document.activeElement===start?cancel:start):(document.activeElement===cancel?start:cancel);
    event.preventDefault();target.focus();
   }
  };
  outer.addEventListener('keydown',keys);
  start.addEventListener('click',()=>complete(true),{once:true});
  cancel.addEventListener('click',()=>complete(false),{once:true});
 });
}

// As plaquetas são parte da arte original; ajustar o texto ao espaço real,
// sem cortar nomes longos ou deixar a Casa passar sobre o filete dourado.
const resultFitCanvas=document.createElement('canvas');
// Ajusta os textos da plaqueta ao espaço interno real, preservando os nomes completos.
function fitVersusLabels(overlay){
 if(!overlay?.isConnected)return;
 const ctx=resultFitCanvas.getContext('2d');if(!ctx)return;
 for(const el of overlay.querySelectorAll('.cm-vs-fighter-info strong,.cm-vs-fighter-info small')){
  el.style.removeProperty('font-size');
  const style=getComputedStyle(el),size=parseFloat(style.fontSize);
  const available=el.clientWidth-10,text=el.textContent||'';
  if(!(size>0&&available>0))continue;
  ctx.font=style.fontStyle+' '+style.fontWeight+' '+size+'px '+style.fontFamily;
  const spacing=parseFloat(style.letterSpacing)||0;
  const width=ctx.measureText(text).width+Math.max(0,text.length-1)*spacing;
  // Fontes definidas no CSS; não reduzir os nomes automaticamente.
  el.title=text;
 }
}
function fitResultLabels(){
 const finish=document.getElementById('finish');
 if(!finish?.classList.contains('cm-v21-result')||finish.classList.contains('hidden'))return;
 const ctx=resultFitCanvas.getContext('2d');if(!ctx)return;
 for(const el of finish.querySelectorAll('.cm-v21-name,.cm-v21-house')){
  el.style.removeProperty('font-size');
  const style=getComputedStyle(el),size=parseFloat(style.fontSize);
  const available=el.clientWidth-10,text=el.textContent||'';
  if(!(size>0&&available>0))continue;
  ctx.font=style.fontStyle+' '+style.fontWeight+' '+size+'px '+style.fontFamily;
  const spacing=parseFloat(style.letterSpacing)||0;
  const width=ctx.measureText(text).width+Math.max(0,text.length-1)*spacing;
  if(!el.matches('.cm-v21-house') && width>available)el.style.setProperty('font-size',Math.max(10,Math.floor(size*available/width*10)/10)+'px','important');
  el.title=text;
 }
}
window.addEventListener('resize',()=>{
 requestAnimationFrame(fitResultLabels);
 const overlay=document.getElementById('cm-vs-overlay');
 if(overlay)requestAnimationFrame(()=>fitVersusLabels(overlay));
});

function resultView({player,house,rival,rivalHouse,gender='m',rivalGender='m',ownShots=[],rivalShots=[],opponent='—',mode='duel',ownTotal=null,rivalTotal=null}){
 const finish=document.getElementById('finish');
 const card=finish?.querySelector('.finish-card');
 if(!card)return;
 finish.classList.add('cm-cinematic-result','cm-v21-result');
 finish.classList.remove('cm-result-compact');
 finish.dataset.cmResultMode=mode;
 const ownOk=typeof ownTotal==='number'&&Number.isFinite(ownTotal);
 const rivalOk=typeof rivalTotal==='number'&&Number.isFinite(rivalTotal);
 const competitive=mode!=='practice'&&ownOk&&rivalOk;
 const outcome=competitive?(ownTotal>rivalTotal?'win':ownTotal<rivalTotal?'loss':'draw'):'pending';
 finish.dataset.cmResultOutcome=outcome;
 const title=card.querySelector('#finish-title');
 let head=card.querySelector('.cm-v21-head');
 if(!head){
  head=node('header','cm-v21-head');
  
  
  const sub=node('div','cm-v21-subtitle');
  if(title)head.append(title,sub);
  card.prepend(head);
  card.querySelector('.cm-finish-heading')?.remove();
 }
 head.querySelector('.cm-v21-subtitle').textContent=mode==='practice'?'RESULTADO DO TREINO LIVRE':'RESULTADO DO DUELO';
 if(title)title.textContent=mode==='practice'?'TREINO CONCLUÍDO':outcome==='win'?'VITÓRIA':outcome==='loss'?'DERROTA':outcome==='draw'?'EMPATE':mode==='bot'?'TREINO CONCLUÍDO':'DESAFIO ENVIADO';
 card.querySelector(':scope > small')?.remove(); // faixa azul já identifica o resultado
 card.querySelector('.cm-final-duel')?.remove();
 card.querySelector('.cm-v21-stage')?.remove();
 card.querySelector('.cm-embers')?.remove();
 const mirrored=mode==='practice';
 const left=resultPerson(player,house,gender);
 const right=resultPerson(mirrored?player:(rival||'Adversário'),mirrored?house:rivalHouse,mirrored?gender:rivalGender);
  // O arqueiro da direita encara o da esquerda: espelho apenas do sprite.
  right.classList.add('cm-v21-facing-left');
 if(mirrored){right.classList.add('cm-v21-mirror');right.setAttribute('aria-label',player+' — espelho do treino livre');}
 if(outcome==='win')addResultBadge(left,'VENCEDOR');
 if(outcome==='loss')addResultBadge(right,'VENCEDOR');
 if(outcome==='draw'){addResultBadge(left,'EMPATE');addResultBadge(right,'EMPATE');}
 const v1=ownOk?String(ownTotal):'—';
 const v2=mirrored?v1:rivalOk?String(rivalTotal):'—';
 const scores=node('div','cm-v21-scores');
 scores.setAttribute('role','group');scores.setAttribute('aria-label',v1+' pontos contra '+v2+' pontos');
 const vs=node('div','cm-v21-vs');
 const badge=node('img','cm-v21-vs-art');badge.src='assets/v21/result-art/vs.webp';badge.alt='';
 vs.append(badge,node('span','', 'VS'));
 scores.append(node('strong','cm-v21-total',v1),vs,node('strong','cm-v21-total',v2));
 if(!rivalOk&&!mirrored)scores.append(node('small','cm-v21-await','AGUARDANDO ADVERSÁRIO'));
 const stage=node('div','cm-v21-stage');stage.append(left,scores,right);
 const anchor=card.querySelector('#finish-results');if(anchor)anchor.before(stage);else card.append(stage);
 requestAnimationFrame(()=>requestAnimationFrame(fitResultLabels));
 document.fonts?.ready?.then(()=>requestAnimationFrame(fitResultLabels));
 const replay=card.querySelector('#play-again');
 if(replay){const local=mode==='bot'||mode==='practice';replay.replaceChildren(node('span','cm-result-replay-label',local?'▶ JOGAR NOVAMENTE':'▶ NOVO DESAFIO'));replay.setAttribute('aria-label',local?'Jogar novamente com as mesmas configurações':'Voltar para escolher um novo desafio');}
 const back=card.querySelector('#cm-v2-result-home');
 if(back){back.textContent='⌂ VOLTAR AO MENU';back.setAttribute('aria-label','Voltar ao menu de desafios');}
}
function addResultBadge(card,text){
 const badge=node('div','cm-v21-winner');
 badge.setAttribute('aria-label',text);
 badge.append(node('span','',text));
 card.append(badge);
}
function resultPerson(name,house,gender){
 const h=getHouse(house),card=node('article','cm-v21-player');
 card.dataset.house=h;
 const crop=node('div','cm-v21-crop'),hero=node('img');
 hero.src=portrait(h,gender);portraitFallback(hero,h,gender);hero.decoding='async';
 hero.alt='Arqueiro da '+houses[h].name;crop.append(hero);
 const frame=node('img','cm-v21-frame');frame.src='assets/v21/result-art/frame-'+h+'.webp';frame.alt='';
 card.append(crop,frame,node('b','cm-v21-name',name||'Arqueiro'),node('small','cm-v21-house',houses[h].short+' · '+houses[h].name));
 return card;
}
function impactSparkle(stage,x,y,score,house){
 if(!stage||score<8||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const area=node('div','cm-impact-sparks');area.style.left=(x*100)+'%';area.style.top=(y*100)+'%';
 area.dataset.house=getHouse(house);
 for(let i=0;i<12;i++){
  const spark=node('span');spark.style.setProperty('--sz',(3+i%3*2)+'px');
  spark.style.setProperty('--tx',(-38+i*7)+'px');
  spark.style.setProperty('--duration',(.55+(i%5)*.12)+'s');
  spark.style.left=(-20+i*4)+'px';
  spark.style.animationDelay=(i%4)*.04+'s';
  area.append(spark);
 }
 stage.append(area);setTimeout(()=>area.remove(),1450);
}
function bindMenuSound(sound){
 document.addEventListener('click',event=>{
  const element=event.target instanceof Element?event.target.closest('button'):null;
  if(!element||element.disabled||element.id==='cm-vs-start'||element.id==='cm-vs-cancel')return;
  if(/sound|som/.test(element.id||''))return;
  try{sound('click')}catch{}
 });
}
export const cinematics={versus,dismissVersusTransition,resultView,impactSparkle,bindMenuSound,mountAmbient,setAmbientHouse};
