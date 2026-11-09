import {GEAR,GEAR_BY_ID,modelSource} from './equipment-catalog.js?v=1';
// Um equipamento por vez, com setas de navegação e detalhes dinâmicos.
export function mountEquipmentCarousel({selected='classico',onSelect=()=>{}}={}){
 const host=document.querySelector('.studio-bows');
 if(!host)return {select:()=>{}};
 host.replaceChildren();
 host.classList.add('cm-gear-carousel');
 host.setAttribute('role','group');
 host.setAttribute('aria-label','Carrossel de arcos e bestas 3D');
 const prev=document.createElement('button'),next=document.createElement('button');
 for(const [button,txt,label] of [[prev,'❮','Equipamento anterior'],[next,'❯','Próximo equipamento']]){
   button.type='button';button.className='cm-gear-arrow';button.textContent=txt;button.setAttribute('aria-label',label);
 }
 const frame=document.createElement('div');frame.className='cm-gear-frame';
 const scene=document.createElement('div');scene.className='cm-gear-visual';
 const fallback=document.createElement('img');
 fallback.className='cm-gear-fallback';fallback.src='assets/equipment/bow.png';fallback.alt='';fallback.loading='lazy';
 const viewer=document.createElement('model-viewer');
 viewer.setAttribute('interaction-prompt','none');
 viewer.setAttribute('camera-controls','');
 viewer.setAttribute('auto-rotate','');
 viewer.setAttribute('rotation-per-second','14deg');
 viewer.setAttribute('shadow-intensity','0.75');
 viewer.setAttribute('environment-image','neutral');
 viewer.setAttribute('loading','lazy');
 viewer.setAttribute('touch-action','pan-y');
 viewer.className='cm-gear-model';
 scene.append(fallback,viewer);
 const title=document.createElement('strong');title.className='cm-gear-name';
 const kind=document.createElement('span');kind.className='cm-gear-kind';
 const ability=document.createElement('b');ability.className='cm-gear-ability';
 const description=document.createElement('small');description.className='cm-gear-desc';
 const counter=document.createElement('span');counter.className='cm-gear-count';
 const details=document.createElement('div');details.className='cm-gear-details';
 details.append(kind,title,ability,description,counter);
 frame.append(scene,details);host.append(prev,frame,next);
 let active='',token=0;
 function render(id,notify){
   const item=GEAR_BY_ID[id]||GEAR[0],current=++token;
   active=item.id;viewer.removeAttribute('src');
   title.textContent=item.name;kind.textContent=item.type.toUpperCase();
   ability.textContent=item.ability;description.textContent=item.desc;
   counter.textContent=(GEAR.indexOf(item)+1)+' / '+GEAR.length;
   viewer.setAttribute('aria-label','Modelo 3D de '+item.name);
   host.dataset.bow=item.id;host.dataset.type=item.type.toLowerCase();
   scene.classList.remove('cm-gear-ready');
   // Prévia 3D do próprio GLB. Se falhar, o ícone de contingência permanece.
   modelSource(item.model).then(url=>{
     if(current!==token)return;
     viewer.setAttribute('src',url);
   }).catch(error=>console.warn('[ClassMana] Prévia indisponível:',error));
   if(notify)onSelect(item.id);
 }
 viewer.addEventListener('load',()=>scene.classList.add('cm-gear-ready'));
 viewer.addEventListener('error',()=>scene.classList.remove('cm-gear-ready'));
 function step(delta){
   const index=Math.max(0,GEAR.findIndex(g=>g.id===active));
   render(GEAR[(index+delta+GEAR.length)%GEAR.length].id,true);
 }
 prev.addEventListener('click',()=>step(-1));
 next.addEventListener('click',()=>step(1));
 host.addEventListener('keydown',event=>{
   if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
     event.preventDefault();step(event.key==='ArrowRight'?1:-1);
     (event.key==='ArrowRight'?next:prev).focus();
   }
 });
 render(selected,false);
 return {select:id=>{if(id!==active)render(id,false)},get value(){return active}};
}
