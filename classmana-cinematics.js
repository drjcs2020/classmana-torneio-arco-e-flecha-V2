/* ClassMana cinematics — based on the submitted prototype's emberRise / VS /
   WebAudio ideas, adapted to the existing vanilla-JS + Railway game. */
const houses={
 A:{name:'ÁGUIA DOURADA',short:'4º A',color:'#7fc9ff'},
 B:{name:'LEÃO DE FOGO',short:'4º B',color:'#ff9d6c'},
 C:{name:'DRAGÃO DE ESMERALDA',short:'4º C',color:'#80e9aa'}
};
const getHouse=id=>houses[id]?id:'A';
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
 if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  const rng=i=>Math.abs(Math.sin(i*19.19+7.713));
  for(let i=0;i<Math.min(host.id==='cm-v2-home'?165:100,count);i++){
   const dot=node('span','cm-ember'),v=rng(i+1);
   const home=host.id==='cm-v2-home';
   const fromEdge=Math.pow(rng(i+10),3.0);
   const homeX=i%2===0?2+48*fromEdge:98-48*fromEdge;
   dot.style.setProperty('--ember-x',home?homeX.toFixed(1)+'%':(4+92*rng(i+10)).toFixed(1)+'%');
   dot.style.setProperty('--ember-size',home?(4.4+8.7*v+2.2*(1-fromEdge)).toFixed(1)+'px':(2.8+6.5*v).toFixed(1)+'px');
   dot.style.setProperty('--ember-duration',(3.4+5.4*rng(i+31)).toFixed(2)+'s');
   dot.style.setProperty('--ember-delay',(-9*rng(i+46)).toFixed(2)+'s');
   dot.style.setProperty('--ember-drift',(-72+144*rng(i+64)).toFixed(0)+'px');
   dot.style.setProperty('--ember-opacity',home?(.23+.76*(1-fromEdge)).toFixed(2):(.65+.35*v).toFixed(2));
   layer.append(dot);
  }
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
function fighter(person){
 const house=getHouse(person.house);
 const card=node('article','cm-vs-fighter');
 card.dataset.house=house;
 const img=node('img');
 img.alt='Retrato do rosto do arqueiro da Casa '+houses[house].name;
 img.src=portrait(house,person.gender);
 portraitFallback(img,house,person.gender);
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
 const rival={name:config.rival,house:config.rivalHouse,gender:config.rivalGender};
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
 const title=node('h2','cm-vs-title',config.mode==='bot'?'DESAFIO DE TREINO':'DUELO ENTRE ARQUEIROS');
 title.id='cm-vs-title';
 const sub=node('p','cm-vs-sub','🏹 CINCO FLECHAS • MAIOR PONTUAÇÃO VENCE');
 const fighters=node('div','cm-vs-fighters');
 const versusSign=node('div','cm-vs-mark','VS');
 fighters.append(fighter(own),versusSign,fighter(rival));
 const actions=node('div','cm-vs-actions');
 const start=node('button','cm-vs-start','▶ INICIAR DUELO');
 start.id='cm-vs-start';start.type='button';
 const cancel=node('button','cm-vs-cancel','← VOLTAR');
 cancel.id='cm-vs-cancel';cancel.type='button';
 actions.append(start,cancel);
 heading.append(leftCrest,title,rightCrest);
 shell.append(heading,sub,fighters,actions,node('p','cm-vs-note','O convite só é enviado uma vez. O placar permanece vinculado ao jogador.'));
 outer.append(shell);document.body.append(outer);
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
function resultView({player,house,rival,rivalHouse,gender='m',rivalGender='m',ownShots=[],rivalShots=[],opponent='—',mode='duel',ownTotal=null,rivalTotal=null}){
 const finish=document.getElementById('finish');
 if(!finish)return;
 finish.classList.add('cm-cinematic-result');
 // Apenas a conclusão contra o robô usa o layout amplo sem moldura.
 finish.dataset.cmResultMode=mode;
 const scored=Number.isFinite(ownTotal)&&Number.isFinite(rivalTotal);
 const outcome=scored?(ownTotal>rivalTotal?'win':ownTotal<rivalTotal?'loss':'draw'):'pending';
 finish.dataset.cmResultOutcome=outcome;
 const card=finish.querySelector('.finish-card');if(!card)return;
 // Controle real e acessível: não deixar o botão verde sem legenda.
 // O span garante que a arte do botão nunca esconda seu texto.
 const replay=card.querySelector('#play-again');
 if(replay){
  replay.replaceChildren(node('span','cm-result-replay-label','▶ JOGAR NOVAMENTE'));
  replay.setAttribute('aria-label','Jogar novamente — voltar à escolha dos desafios');
  replay.title='Voltar aos desafios para escolher outra partida';
 }
 const eyebrow=card.querySelector(':scope > small');
 if(eyebrow)eyebrow.textContent=mode==='bot'?'🏆 RESULTADO DO TREINO':mode==='practice'?'🏹 RESULTADO DO TREINO LIVRE':'🏆 RESULTADO DO TORNEIO';
 // Mesmo conjunto de escudos e ornamentos na introdução e no resultado.
 const finishTitle=card.querySelector('#finish-title');
 if(finishTitle){
  let heading=card.querySelector('.cm-finish-heading');
  if(!heading){
   heading=node('div','cm-combat-heading cm-finish-heading');
   finishTitle.before(heading);
   const lhs=node('img','cm-combat-heading-crest'),rhs=node('img','cm-combat-heading-crest');
   heading.append(lhs,finishTitle,rhs);
  }
  const shields=heading.querySelectorAll('.cm-combat-heading-crest');
  if(shields.length===2){
   shields[0].src=crest(house);
   shields[1].src=crest(rivalHouse);
   shields[0].alt='Escudo '+houses[getHouse(house)].name;
   shields[1].alt='Escudo '+houses[getHouse(rivalHouse)].name;
  }
 }
 card.querySelector('.cm-final-duel')?.remove();
 card.querySelector('.cm-embers')?.remove();
 emberLayer(card,house,17);
 const wrap=node('div','cm-final-duel');
 const practiceMirror=mode==='practice';
 const left=resultPerson(player,house,gender,ownShots,undefined);
 // Treino livre: o segundo cartão representa o MESMO jogador (Casa/skin),
 // não um adversário nem um recorde fictício.
 const right=resultPerson(practiceMirror?player:(rival||'Adversário'),
  practiceMirror?house:rivalHouse,practiceMirror?gender:rivalGender,
  practiceMirror?[]:rivalShots,practiceMirror?undefined:opponent);
 if(practiceMirror){
  wrap.classList.add('cm-practice-mirror-duel');
  right.classList.add('cm-practice-mirror-player');
  right.setAttribute('aria-label',player+' — espelho de treino livre');
 }
 if(scored){
  if(outcome==='win'||outcome==='draw'){
   left.classList.add(outcome==='win'?'cm-result-winner':'cm-result-tie');
   left.prepend(node('span','cm-result-winner-tag',outcome==='win'?'🏆 VENCEDOR':'🤝 EMPATE'));
  }
  if(outcome==='loss'||outcome==='draw'){
   right.classList.add(outcome==='loss'?'cm-result-winner':'cm-result-tie');
   right.prepend(node('span','cm-result-winner-tag',outcome==='loss'?'🏆 VENCEDOR':'🤝 EMPATE'));
  }
 }
 wrap.append(left,node('div','cm-final-vs','VS'),right);
 const anchor=card.querySelector('#finish-results');
 if(anchor)anchor.before(wrap);else card.append(wrap);
}
function resultPerson(name,house,gender,shots,score){
 const article=node('div','cm-final-player'),img=node('img');
 article.dataset.house=getHouse(house);
 article.dataset.gender=gender==='f'||gender==='female'?'f':'m';
 img.src=portrait(house,gender);
 portraitFallback(img,house,gender);
 img.alt='Retrato do rosto do arqueiro da Casa '+houses[getHouse(house)].name;
 img.decoding='async';
 const crop=node('div','cm-combat-portrait');crop.append(img);
 article.append(crop,node('b','',name),node('small','',houses[getHouse(house)].short+' · '+houses[getHouse(house)].name));
 if(Array.isArray(shots)&&shots.length){
  const strip=node('div','cm-final-shots');strip.setAttribute('aria-label','Pontuação das cinco flechas');
  for(const item of shots.slice(0,5))strip.append(node('span','',Number(item?.score??item)||0));
  article.append(strip);
 }
 // O total já aparece na caixa de pontuação, fora da moldura:
 // não repetir um segundo <small> sobre a etiqueta da Casa.
 if(score!==undefined&&score!=='—')article.setAttribute('aria-label',name+' — '+String(score)+' pontos');
 return article;
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
