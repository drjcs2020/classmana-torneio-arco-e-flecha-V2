import {GEAR,GEAR_BY_ID,modelSource,getGearLevel,isGearUnlocked} from './equipment-catalog.js?v=arsenal-4';
// Prévia e equipamento ativo são estados distintos: navegar nunca equipa uma arma bloqueada.
export function mountEquipmentCarousel({selected='classico',onSelect=()=>{}}={}){
 const host=document.querySelector('.studio-bows');
 if(!host)return {select:()=>{},setProgress:()=>{},get value(){return 'classico'}};
 host.replaceChildren();host.classList.add('cm-gear-carousel');
 host.setAttribute('role','group');host.setAttribute('aria-label','Arsenal de arcos e bestas desbloqueáveis');
 const nav=(text,label)=>{const b=document.createElement('button');b.type='button';b.className='cm-gear-arrow';b.textContent=text;b.setAttribute('aria-label',label);return b};
 const prev=nav('❮','Ver arma anterior'),next=nav('❯','Ver próxima arma');
 const frame=document.createElement('section');frame.className='cm-gear-frame';frame.setAttribute('aria-label','Ficha de equipamento');
 const inner=document.createElement('div');inner.className='cm-gear-inner';
 const visual=document.createElement('div');visual.className='cm-gear-visual';
 const fallback=document.createElement('img');fallback.className='cm-gear-fallback';fallback.src='assets/equipment/bow.png';fallback.alt='';fallback.loading='lazy';
 const viewer=document.createElement('model-viewer');viewer.className='cm-gear-model';
 viewer.setAttribute('camera-controls','');viewer.setAttribute('disable-zoom','');
 viewer.setAttribute('interaction-prompt','none');viewer.setAttribute('shadow-intensity','0.6');
 viewer.setAttribute('environment-image','neutral');viewer.setAttribute('exposure','1.25');
 viewer.setAttribute('camera-target','auto auto auto');viewer.setAttribute('loading','eager');
 viewer.setAttribute('touch-action','pan-y');
 const crest=document.createElement('span');crest.className='cm-gear-crest';crest.setAttribute('aria-hidden','true');crest.textContent='✦';
 const tier=document.createElement('span');tier.className='cm-gear-tier';
 const load=document.createElement('span');load.className='cm-gear-load';load.textContent='Preparando arte 3D…';
 visual.append(fallback,viewer,crest,tier,load);
 const details=document.createElement('div');details.className='cm-gear-details';
 const heading=document.createElement('div');heading.className='cm-gear-titleline';
 const counter=document.createElement('span');counter.className='cm-gear-count';counter.setAttribute('aria-label','Posição no arsenal');
 const kind=document.createElement('span');kind.className='cm-gear-kind';
 const name=document.createElement('strong');name.className='cm-gear-name';heading.append(kind,name,counter);
 const ability=document.createElement('b');ability.className='cm-gear-ability';
 const description=document.createElement('small');description.className='cm-gear-desc';
 const arrow=document.createElement('span');arrow.className='cm-gear-arrowlabel';
 const req=document.createElement('span');req.className='cm-gear-requirement';
 const equip=document.createElement('button');equip.type='button';equip.className='cm-gear-equip';
 const progress=document.createElement('span');progress.className='cm-gear-progress';progress.setAttribute('aria-live','polite');
 details.append(heading,ability,description,arrow,req,equip,progress);
 inner.append(visual,details);frame.append(inner);host.append(prev,frame,next);
 let preview=GEAR_BY_ID[selected]?selected:'classico',equipped=preview,wins=0,confirmed=false,token=0;
 function refreshState(){
   const item=GEAR_BY_ID[preview],unlocked=isGearUnlocked(item,wins),isActive=equipped===preview;
   const remaining=Math.max(0,item.requiredWins-wins);
   frame.dataset.locked=String(!unlocked);frame.dataset.rarity=item.rarity.toLowerCase();frame.dataset.equipped=String(isActive);
   tier.textContent=item.rarity+' · NÍVEL '+item.level;
   req.textContent=unlocked?'✦ DESBLOQUEADO':('🔒 '+remaining+' '+(remaining===1?'VITÓRIA':'VITÓRIAS')+' PARA DESBLOQUEAR');
   equip.disabled=!unlocked||isActive;
   equip.textContent=!unlocked?'🔒 BLOQUEADO':isActive?'✓ EQUIPADO':'⚔ EQUIPAR';
   progress.textContent=confirmed?('🏆 '+wins+' vitórias oficiais · Nv. '+getGearLevel(wins)):('🏆 Vitórias ainda não verificadas · Nv. 1');
   host.dataset.bow=preview;host.dataset.type=item.type.toLowerCase();
   host.dataset.equipped=equipped;
 }
 function render(id){
   const item=GEAR_BY_ID[id]||GEAR[0],current=++token;preview=item.id;
   viewer.removeAttribute('src');visual.classList.remove('cm-gear-ready','cm-gear-error');
   load.textContent='Preparando arte 3D…';
   kind.textContent=item.type.toUpperCase();name.textContent=item.name;
   counter.textContent=(GEAR.indexOf(item)+1)+' / '+GEAR.length;
   ability.textContent='✧ '+item.ability;description.textContent=item.desc;
   arrow.textContent='➶ '+item.arrowName;crest.textContent=item.type==='Besta'?'♜':'✦';
   viewer.setAttribute('aria-label','Modelo tridimensional de '+item.name+'. Arraste para girar.');
   viewer.setAttribute('orientation',item.previewOrientation||'0deg 0deg 0deg');
   viewer.setAttribute('camera-orbit',item.type==='Besta'?'0deg 70deg 85%':'0deg 90deg 85%');
   viewer.setAttribute('field-of-view',item.type==='Besta'?'30deg':'25deg');
   refreshState();
   modelSource(item.model).then(url=>{if(current===token)viewer.setAttribute('src',url)})
     .catch(error=>{if(current!==token)return;visual.classList.add('cm-gear-error');load.textContent='Modelo 3D indisponível';console.warn('[ClassMana] Equipamento 3D:',error)});
 }
 viewer.addEventListener('load',()=>{visual.classList.add('cm-gear-ready');visual.classList.remove('cm-gear-error');load.textContent='ARRASTE PARA GIRAR'});
 viewer.addEventListener('error',()=>{visual.classList.remove('cm-gear-ready');visual.classList.add('cm-gear-error');load.textContent='Prévia 3D indisponível'});
 function step(delta){const index=GEAR.findIndex(g=>g.id===preview);render(GEAR[(index+delta+GEAR.length)%GEAR.length].id)}
 prev.addEventListener('click',()=>step(-1));next.addEventListener('click',()=>step(1));
 equip.addEventListener('click',()=>{
   if(!isGearUnlocked(preview,wins)||preview===equipped)return;
   equipped=preview;refreshState();onSelect(preview);
 });
 host.addEventListener('keydown',event=>{
   if(event.target===viewer||event.target.closest?.('model-viewer'))return;
   if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
     event.preventDefault();step(event.key==='ArrowRight'?1:-1);
     (event.key==='ArrowRight'?next:prev).focus();
   }
 });
 render(preview);
 return {
   select:id=>{equipped=GEAR_BY_ID[id]?id:'classico';if(preview!==equipped)render(equipped);else refreshState()},
   setProgress:state=>{wins=Math.max(0,Number(state?.wins)||0);confirmed=Boolean(state?.confirmed);refreshState()},
   get value(){return equipped},get preview(){return preview}
 };
}
