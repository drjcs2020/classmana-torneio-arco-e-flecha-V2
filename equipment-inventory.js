import {GEAR,GEAR_BY_ID,modelSource,getGearLevel,isGearUnlocked} from './equipment-catalog.js?v=win-progress-linear-20261110';
// Inventário isolado: somente um modelo 3D por vez. Nenhum GLB no painel do herói.
const ARROWS=[
 {id:'arrow-standard',name:'Flecha Clássica',type:'Flecha',rarity:'Comum',model:'arrow-standard.glb',desc:'Flecha padrão do Arco de Treino e da Besta Leve.',ability:'Disparo equilibrado'},
 {id:'arrow-precision',name:'Flecha de Precisão',type:'Flecha',rarity:'Raro',model:'arrow-precision.glb',desc:'Flecha utilizada pelos arcos de precisão.',ability:'Associada à arma equipada'},
 {id:'arrow-power',name:'Flecha de Poder',type:'Flecha',rarity:'Épico',model:'arrow-power.glb',desc:'Flecha utilizada pelas armas de maior potência.',ability:'Associada à arma equipada'}
];
const ALL=[...GEAR,...ARROWS],BY_ID=Object.fromEntries(ALL.map(x=>[x.id,x]));
const make=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=value;return e};
export function mountEquipmentInventory({selected='classico',onSelect=()=>{}}={}){
 const host=document.querySelector('.studio-bows');
 if(!host)return {select:()=>{},setProgress:()=>{},get value(){return 'classico'}};
 host.replaceChildren();host.className='studio-bows cm-inventory-entry';
 // Duas artes independentes: painel decorativo e botão funcional.
 const art=make('img','cm-inventory-panel-art');
 art.src='assets/ui/classmana_escudo_inventario.png';
 art.onerror=()=>{art.onerror=null;art.src='assets/ui/inventory-ornate-panel.svg'};
 art.alt='INVENTÁRIO DE ARMAS — Arcos, Bestas e Flechas';
 art.decoding='async';art.draggable=false;
 const openButton=make('button','cm-inventory-launch');openButton.type='button';
 openButton.setAttribute('aria-label','Clique para abrir o arsenal');
 openButton.setAttribute('aria-haspopup','dialog');openButton.setAttribute('aria-controls','cm-arsenal-modal');
 const buttonArt=make('img','cm-inventory-open-art');
 buttonArt.src='assets/ui/classmana_botao_abrir_arsenal.png';
 buttonArt.onerror=()=>{buttonArt.onerror=null;buttonArt.src='assets/ui/inventory-open-button.svg'};
 buttonArt.alt='';buttonArt.draggable=false;
 openButton.append(buttonArt);
 const summary=make('div','cm-inventory-equipped');summary.setAttribute('aria-live','polite');
 host.append(art,openButton,summary);
 document.getElementById('cm-arsenal-modal')?.remove();
 const modal=make('div','cm-arsenal-modal');modal.id='cm-arsenal-modal';modal.hidden=true;
 modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','cm-arsenal-title');
 modal.innerHTML="\n<div class=\"cm-arsenal-shell\"><div class=\"cm-arsenal-core\">\n<header class=\"cm-arsenal-header\">\n<img class=\"cm-arsenal-header-crest\" src=\"assets/ui/arsenal-crest.svg\" alt=\"\">\n<div><p>CLASSMANA · TORNEIO DAS TRÊS CASAS</p><h2 id=\"cm-arsenal-title\">INVENTÁRIO DE ARMAS</h2></div>\n<button class=\"cm-arsenal-close\" type=\"button\" aria-label=\"Fechar inventário\">✕ <span>FECHAR</span></button>\n</header>\n<div class=\"cm-arsenal-layout\">\n<aside class=\"cm-arsenal-sidebar\" aria-label=\"Categorias\">\n<p class=\"cm-arsenal-section-label\">CATEGORIAS</p>\n<nav class=\"cm-arsenal-categories\" aria-label=\"Filtrar equipamentos\">\n<button type=\"button\" data-category=\"Arco\" aria-pressed=\"true\">🏹 <span>ARCOS</span></button>\n<button type=\"button\" data-category=\"Besta\" aria-pressed=\"false\">⚔ <span>BESTAS</span></button>\n<button type=\"button\" data-category=\"Flecha\" aria-pressed=\"false\">➶ <span>FLECHAS</span></button>\n</nav>\n<div class=\"cm-arsenal-progress\"><p>SEU PROGRESSO</p><strong class=\"cm-arsenal-wins\">—</strong><span>vitórias oficiais</span><strong class=\"cm-arsenal-level\">Nv. 1</strong><span>nível do arsenal</span></div>\n<p class=\"cm-arsenal-help\">Explore todas as armas. As bloqueadas são liberadas com vitórias oficiais.</p>\n</aside>\n<section class=\"cm-arsenal-collection\" aria-label=\"Coleção de equipamentos\">\n<div class=\"cm-arsenal-collection-heading\"><h3>COLEÇÃO</h3><span class=\"cm-arsenal-count\"></span></div>\n<div class=\"cm-arsenal-grid\" role=\"list\"></div>\n</section>\n<section class=\"cm-arsenal-detail\" aria-label=\"Detalhes do equipamento\">\n<div class=\"cm-arsenal-detail-top\"><h3 class=\"cm-arsenal-item-name\"></h3><span class=\"cm-arsenal-rarity\"></span></div>\n<div class=\"cm-arsenal-stage\">\n<span class=\"cm-arsenal-stage-rune\" aria-hidden=\"true\">✦</span>\n<div class=\"cm-arsenal-model-placeholder\" aria-hidden=\"true\"></div>\n<model-viewer class=\"cm-arsenal-model\" camera-controls disable-pan disable-zoom interaction-prompt=\"none\" environment-image=\"neutral\" shadow-intensity=\"1\" exposure=\"1.35\" loading=\"eager\" camera-target=\"auto auto auto\" alt=\"Modelo tridimensional da arma\"></model-viewer>\n<div class=\"cm-arsenal-loading\" aria-live=\"polite\">Escolha uma arma para visualizar.</div>\n<div class=\"cm-arsenal-model-controls\">\n<button type=\"button\" data-model-action=\"zoomout\" aria-label=\"Afastar arma\">−</button>\n<button type=\"button\" data-model-action=\"reset\" aria-label=\"Reenquadrar arma\">⌖</button>\n<button type=\"button\" data-model-action=\"rotate\" aria-label=\"Girar arma\">↻</button>\n<button type=\"button\" data-model-action=\"zoomin\" aria-label=\"Aproximar arma\">+</button>\n</div></div>\n<p class=\"cm-arsenal-description\"></p>\n<div class=\"cm-arsenal-stats\" aria-label=\"Atributos da arma\"></div>\n<div class=\"cm-arsenal-ability\"><strong>HABILIDADE</strong><span></span></div>\n<div class=\"cm-arsenal-action-row\"><span class=\"cm-arsenal-unlock\"></span><button type=\"button\" class=\"cm-arsenal-equip\"></button></div>\n</section>\n</div><div class=\"cm-arsenal-foot\">✦ ARSENAL DAS TRÊS CASAS ✦</div>\n</div></div>";
 document.body.append(modal);
 const q=s=>modal.querySelector(s);
 const grid=q('.cm-arsenal-grid'),viewer=q('.cm-arsenal-model'),placeholder=q('.cm-arsenal-model-placeholder');
 const equipButton=q('.cm-arsenal-equip'),loading=q('.cm-arsenal-loading'),stage=q('.cm-arsenal-stage');
 // Artes PNG originais do inventário: ativar individualmente somente após carregar.
 // Impede painéis vazios e mantém textos acessíveis até a imagem estar disponível.
 const artFiles={
  'cm-art-frame':'arsenal-moldura-principal.png',
  'cm-art-title':'arsenal-placa-titulo.png',
  'cm-art-card':'arsenal-moldura-carta.png',
  'cm-art-progress':'arsenal-painel-progresso.png',
  'cm-art-stats':'arsenal-moldura-estatistica.png',
  'cm-art-description':'arsenal-barra-descricao.png'
 };
 for(const [className,file] of Object.entries(artFiles)){
  const image=new Image();
  image.onload=()=>{if(modal.isConnected)modal.classList.add(className)};
  image.src='assets/ui/'+file;
 }
 const categories=[...modal.querySelectorAll('[data-category]')];
 // Botões com imagens fornecidas; se PNG faltar, manter o botão original funcional.
 const categoryArtwork={Arco:'01_categoria_arcos.png',Besta:'02_categoria_bestas.png',Flecha:'03_categoria_flechas.png'};
 const imageRoot='assets/ui/';
 function useButtonArtwork(element,filename){
  if(!element)return;
  const img=new Image();
  img.onload=()=>{
   if(!element.isConnected)return;
   element.style.setProperty('--cm-png-button','url("'+imageRoot+filename+'")');
   element.classList.add('cm-arsenal-png-button');
  };
  img.src=imageRoot+filename;
 }
 for(const button of categories){
   button.setAttribute('aria-label',button.textContent.trim());
   useButtonArtwork(button,categoryArtwork[button.dataset.category]);
 }
 useButtonArtwork(q('.cm-arsenal-close'),'arsenal-botao-fechar.png');
 const pagination=make('nav','cm-arsenal-pagination');
 pagination.setAttribute('aria-label','Páginas das armas');
 const prevPage=make('button','cm-arsenal-page-prev','◀');prevPage.type='button';prevPage.setAttribute('aria-label','Página anterior');
 const pageLabel=make('span','cm-arsenal-page-count','1 / 1');
 const nextPage=make('button','cm-arsenal-page-next','▶');nextPage.type='button';nextPage.setAttribute('aria-label','Próxima página');
 pagination.append(prevPage,pageLabel,nextPage);
 grid.parentElement.append(pagination);
 useButtonArtwork(prevPage,'05_pagina_anterior.png');
 useButtonArtwork(nextPage,'06_pagina_proxima.png');
 let currentPage=0;const itemsPerPage=6;
 function updatePagination(total){
  const pageCount=Math.max(1,Math.ceil(total/itemsPerPage));
  currentPage=Math.min(currentPage,pageCount-1);
  pagination.hidden=total<=itemsPerPage;
  prevPage.disabled=currentPage===0;nextPage.disabled=currentPage>=pageCount-1;
  pageLabel.textContent=(currentPage+1)+' / '+pageCount;
 }
 prevPage.addEventListener('click',()=>{currentPage=Math.max(0,currentPage-1);renderCards()});
 nextPage.addEventListener('click',()=>{currentPage++;renderCards()});
 useButtonArtwork(equipButton,'arsenal-botao-equipar.png');
 let equipped=GEAR_BY_ID[selected]?selected:'classico',preview=equipped,category='Arco',wins=0,confirmed=false;
 let zoom=75,spin=0,requestId=0,previousFocus=null;
 // Miniaturas SEM desenhos inventados: fotografias renderizadas dos GLBs reais.
 const snapshots=new Map();
 const thumbFailed=new Set();
 let thumbQueue=[],thumbBusy=false,thumbGeneration=0;
 const thumbViewer=document.createElement('model-viewer');
 thumbViewer.className='cm-arsenal-snapshot-renderer';
 thumbViewer.setAttribute('interaction-prompt','none');
 thumbViewer.setAttribute('environment-image','neutral');
 thumbViewer.setAttribute('shadow-intensity','0');
 thumbViewer.setAttribute('camera-target','auto auto auto');
 thumbViewer.setAttribute('camera-orbit','50deg 75deg 54%');
 thumbViewer.setAttribute('field-of-view','18deg');
 thumbViewer.setAttribute('loading','eager');
 thumbViewer.setAttribute('reveal','auto');
 thumbViewer.setAttribute('aria-hidden','true');
 thumbViewer.style.cssText='position:fixed;width:224px;height:224px;left:0;top:0;z-index:-1;opacity:.01;pointer-events:none;contain:layout style;';
 modal.append(thumbViewer);
 // A fotografia da arma é sempre gerada do GLB real, nunca de outra arte.
 // Remover transparência da captura melhora a centralização SEM exigir clique.
 async function normalizedThumbnail(dataUri,item){
  const img=new Image();img.src=dataUri;
  await (img.decode?img.decode():new Promise((res,rej)=>{img.onload=res;img.onerror=rej}));
  const w=img.naturalWidth,h=img.naturalHeight;
  if(!w||!h)return dataUri;
  const src=document.createElement('canvas');src.width=w;src.height=h;
  const ctx=src.getContext('2d',{willReadFrequently:true});if(!ctx)return dataUri;
  ctx.drawImage(img,0,0);
  const pix=ctx.getImageData(0,0,w,h).data;
  let left=w,top=h,right=-1,bottom=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   if(pix[(y*w+x)*4+3]>35){
    if(x<left)left=x;if(x>right)right=x;
    if(y<top)top=y;if(y>bottom)bottom=y;
   }
  }
  if(right<left||bottom<top)return dataUri;
  const pad=Math.max(5,Math.round(Math.max(right-left,bottom-top)*.055));
  const x=Math.max(0,left-pad),y=Math.max(0,top-pad);
  const cw=Math.min(w-x,right-left+1+pad*2),ch=Math.min(h-y,bottom-top+1+pad*2);
  // Arcos vistos quase de perfil ficam como uma linha. Inclinar a fotografia
  // do próprio GLB no cartão, sem modificar sua orientação na visualização 3D.
  const slender=ch>cw*1.75;
  const angle=slender?(item?.level%2===0?Math.PI/5:-Math.PI/5):0;
  const rw=Math.abs(cw*Math.cos(angle))+Math.abs(ch*Math.sin(angle));
  const rh=Math.abs(ch*Math.cos(angle))+Math.abs(cw*Math.sin(angle));
  const out=document.createElement('canvas');out.width=384;out.height=384;
  const outCtx=out.getContext('2d');if(!outCtx)return dataUri;
  const scale=Math.min(342/rw,342/rh);
  outCtx.translate(192,192);outCtx.rotate(angle);
  outCtx.drawImage(src,x,y,cw,ch,-cw*scale/2,-ch*scale/2,cw*scale,ch*scale);
  return out.toDataURL('image/png');
 }
 function updateThumb(id){
   const frame=grid.querySelector('[data-id="'+id+'"] .cm-arsenal-thumb');
   if(!frame)return;
   const uri=snapshots.get(id);
   if(uri){const img=make('img','cm-arsenal-thumb-image');img.alt='';img.src=uri;frame.replaceChildren(img)}
   else frame.textContent=thumbFailed.has(id)?'PRÉVIA INDISPONÍVEL':'CARREGANDO 3D…';
 }
 function queueThumbnails(items){
   const generation=++thumbGeneration;
   thumbQueue=items.filter(item=>!snapshots.has(item.id)&&!thumbFailed.has(item.id));
   if(!thumbBusy)void nextThumbnail(generation);
 }
 async function nextThumbnail(generation){
   if(thumbBusy)return;
   thumbBusy=true;
   try{
    while(!modal.hidden&&thumbQueue.length){
     const item=thumbQueue.shift();
     if(!item||snapshots.has(item.id)||thumbFailed.has(item.id))continue;
     try{
      const src=await modelSource(item.model);
      if(modal.hidden)break;
      await new Promise((resolve,reject)=>{
       const timeout=setTimeout(()=>onError(),20000);
       const cleanup=()=>{clearTimeout(timeout);thumbViewer.removeEventListener('load',onLoad);thumbViewer.removeEventListener('error',onError)};
       const onError=()=>{cleanup();reject(new Error('Modelo 3D indisponível ou captura expirada'))};
       const onLoad=()=>{
        requestAnimationFrame(()=>requestAnimationFrame(async()=>{
         try{
          const png=thumbViewer.toDataURL('image/png');
          if(typeof png!=='string'||!png.startsWith('data:image/'))throw Error('Captura indisponível');
          const thumb=await normalizedThumbnail(png,item);
          snapshots.set(item.id,thumb);updateThumb(item.id);cleanup();resolve();
         }catch(err){cleanup();reject(err)}
        }));
       };
       thumbViewer.addEventListener('load',onLoad,{once:true});
       thumbViewer.addEventListener('error',onError,{once:true});
       thumbViewer.setAttribute('orientation',item.previewOrientation||'0deg 0deg 0deg');
       thumbViewer.removeAttribute('src');
       thumbViewer.setAttribute('src',src);
      });
     }catch(err){thumbFailed.add(item.id);updateThumb(item.id);console.warn('[ClassMana] Miniatura 3D:',item.model,err)}
    }
   }finally{
    thumbBusy=false;
    if(!modal.hidden&&thumbQueue.length)void nextThumbnail(thumbGeneration);
   }
 }
 const unlocked=item=>item.type==='Flecha'||item.requiredWins===0||(confirmed&&isGearUnlocked(item,wins));
 function progressText(item){
  if(item.type==='Flecha')return 'VINCULADA À ARMA';
  if(unlocked(item))return '✓ DESBLOQUEADA';
  const remain=Math.max(0,item.requiredWins-wins);
  return '🔒 '+remain+' '+(remain===1?'VITÓRIA':'VITÓRIAS')+' PARA DESBLOQUEAR';
 }
 function updateSummary(){
  const item=GEAR_BY_ID[equipped]||GEAR[0];
  summary.textContent='✓ EQUIPADO: '+item.name+' · '+(confirmed?'NÍVEL '+getGearLevel(wins):'AGUARDANDO PLACAR');
  q('.cm-arsenal-wins').textContent=confirmed?String(wins):'—';
  q('.cm-arsenal-level').textContent=confirmed?String(getGearLevel(wins)):'1';
 }
 function renderCards(){
  const items=ALL.filter(item=>item.type===category);
  q('.cm-arsenal-count').textContent=items.length+' '+(items.length===1?'ITEM':'ITENS');
  updatePagination(items.length);
  grid.replaceChildren();
  for(const item of items.slice(currentPage*itemsPerPage,(currentPage+1)*itemsPerPage)){
   const card=make('button','cm-arsenal-card');card.type='button';card.dataset.id=item.id;
   card.dataset.rarity=item.rarity.toLowerCase();card.dataset.selected=String(item.id===preview);
   card.dataset.locked=String(!unlocked(item));card.setAttribute('role','listitem');
   card.setAttribute('aria-label',item.name+' · '+progressText(item));
   const thumb=make('span','cm-arsenal-thumb');
   const saved=snapshots.get(item.id);
   if(saved){const img=make('img','cm-arsenal-thumb-image');img.src=saved;img.alt='';thumb.append(img)}
   else thumb.textContent=thumbFailed.has(item.id)?'PRÉVIA INDISPONÍVEL':'CARREGANDO 3D…';
   const lvl=make('span','cm-arsenal-card-level',item.type==='Flecha'?'FLECHA':'NV. '+item.level);
   const name=make('strong','cm-arsenal-card-name',item.name);
   const status=make('span','cm-arsenal-card-status',item.type==='Flecha'?'ACESSÓRIO':item.id===equipped?'✓ EQUIPADA':unlocked(item)?'DISPONÍVEL':'🔒 '+item.requiredWins+' VITÓRIAS');
   card.append(lvl,thumb,name,status);card.addEventListener('click',()=>showItem(item.id));grid.append(card);
  }
 }
 function orbit(){viewer.setAttribute('camera-orbit',spin+'deg 90deg '+zoom+'%');viewer.setAttribute('field-of-view','19deg')}
 function showItem(id){
  const item=BY_ID[id]||GEAR[0];preview=item.id;const token=++requestId;
  for(const card of grid.children)card.dataset.selected=String(card.dataset.id===preview);
  q('.cm-arsenal-item-name').textContent=item.name.toUpperCase();
  const rarity=q('.cm-arsenal-rarity');rarity.textContent=item.rarity.toUpperCase()+(item.level?' · NÍVEL '+item.level:'');rarity.dataset.rarity=item.rarity.toLowerCase();
  q('.cm-arsenal-description').textContent=item.desc;q('.cm-arsenal-ability span').textContent=item.ability;
  q('.cm-arsenal-unlock').textContent=progressText(item);
  const isArrow=item.type==='Flecha',isEquipped=item.id===equipped,canEquip=unlocked(item)&&!isEquipped&&!isArrow;
  equipButton.disabled=!canEquip;
  equipButton.textContent=isArrow?'VINCULADA À ARMA':!unlocked(item)?'🔒 BLOQUEADA':isEquipped?'✓ EQUIPADA':'✓ EQUIPAR';
  equipButton.dataset.state=isArrow?'linked':!unlocked(item)?'locked':isEquipped?'equipped':'ready';
  // Aplicar verde diretamente nos dois estados desabilitados: evita que PNG/CSS antigo deixe o botão azul.
  // Reverter as propriedades inline ao voltar para EQUIPAR ou VINCULADA.
  const greenStatus=equipButton.dataset.state==='equipped'||equipButton.dataset.state==='locked';
  for(const prop of ['background','background-image','background-color','color','-webkit-text-fill-color']){
   equipButton.style.removeProperty(prop);
  }
  if(greenStatus){
   equipButton.style.setProperty('background','linear-gradient(180deg,#24a75c 0%,#137e48 55%,#095632 100%)','important');
   equipButton.style.setProperty('background-color','#147a46','important');
   equipButton.style.setProperty('color','#ffffff','important');
   equipButton.style.setProperty('-webkit-text-fill-color','#ffffff','important');
  }
  const wind=item.wind==null?'—':item.wind===1?'Normal':(item.wind<1?'-':'+')+Math.abs(Math.round((item.wind-1)*100))+'%';
  const margin=item.ring==null?'—':((1/item.ring-1)>=0?'+':'')+Math.round((1/item.ring-1)*100)+'%';
  // Informações essenciais agrupadas num único quadro, sem repetir descrição.
  const stats=isArrow?[['TIPO','Flecha 3D'],['USO','Automático'],['ACESSO','Livre']]:
   [['ACERTO',margin],['VENTO',wind],['PONTOS',item.bonus?'+'+item.bonus:'Padrão']];
  q('.cm-arsenal-stats').replaceChildren(...stats.map(([k,v],index)=>{
   const cell=make('div','cm-arsenal-stat');
   const icon=make('span','cm-arsenal-stat-icon',isArrow?['🏹','⚙️','✨'][index]:['🎯','💨','⭐'][index]);
   icon.setAttribute('aria-hidden','true');
   cell.append(icon,make('span','cm-arsenal-stat-label',k),make('strong','',v));return cell;
  }));
  zoom=75;spin=0;orbit();viewer.setAttribute('orientation',item.previewOrientation||'0deg 0deg 0deg');
  viewer.setAttribute('alt','Modelo tridimensional: '+item.name+'. Arraste para girar.');
  viewer.removeAttribute('src');stage.dataset.ready='false';
  placeholder.textContent='CARREGANDO O MODELO ORIGINAL…';loading.textContent='CARREGANDO MODELO 3D…';
  if(modal.hidden)return;
  modelSource(item.model).then(url=>{if(!modal.hidden&&token===requestId)viewer.setAttribute('src',url)}).catch(err=>{
   if(token!==requestId)return;loading.textContent='MODELO INDISPONÍVEL · CONSULTE A FICHA';console.warn('[ClassMana] Inventário:',item.model,err)
  });
 }
 function setCategory(next){
  category=next;currentPage=0;for(const b of categories)b.setAttribute('aria-pressed',String(b.dataset.category===category));
  if(BY_ID[preview]?.type!==category)preview=ALL.find(x=>x.type===category).id;
  renderCards();showItem(preview);queueThumbnails(ALL.filter(item=>item.type===category));
 }
 viewer.addEventListener('load',()=>{
  if(modal.hidden)return;
  stage.dataset.ready='true';loading.textContent='ARRASTE A ARMA PARA GIRAR';
 });
 viewer.addEventListener('error',()=>{stage.dataset.ready='false';loading.textContent='NÃO FOI POSSÍVEL CARREGAR O MODELO 3D'});
 function open(){
  previousFocus=document.activeElement;modal.hidden=false;document.body.classList.add('cm-arsenal-opened');
  const current=GEAR_BY_ID[equipped]||GEAR[0];category=current.type;preview=current.id;currentPage=0;
  for(const b of categories)b.setAttribute('aria-pressed',String(b.dataset.category===category));
  renderCards();showItem(preview);queueThumbnails(ALL.filter(item=>item.type===category));q('.cm-arsenal-close').focus();
 }
 function close(){requestId++;thumbQueue=[];thumbGeneration++;modal.hidden=true;document.body.classList.remove('cm-arsenal-opened');viewer.removeAttribute('src');thumbViewer.removeAttribute('src');previousFocus?.focus?.()}
 openButton.addEventListener('click',open);q('.cm-arsenal-close').addEventListener('click',close);
 modal.addEventListener('click',e=>{if(e.target===modal)close()});
 modal.addEventListener('keydown',e=>{
  if(e.key==='Escape'){e.preventDefault();close();return}
  if(e.key!=='Tab')return;
  const nodes=[...modal.querySelectorAll('button:not([disabled])')].filter(n=>n.getClientRects().length);
  if(!nodes.length)return;
  if(e.shiftKey&&document.activeElement===nodes[0]){e.preventDefault();nodes.at(-1).focus()}
  else if(!e.shiftKey&&document.activeElement===nodes.at(-1)){e.preventDefault();nodes[0].focus()}
 });
 for(const b of categories)b.addEventListener('click',()=>setCategory(b.dataset.category));
 equipButton.addEventListener('click',()=>{
  const item=BY_ID[preview];if(!item||item.type==='Flecha'||!unlocked(item))return;
  equipped=item.id;onSelect(equipped);updateSummary();renderCards();showItem(preview);
 });
 for(const b of modal.querySelectorAll('[data-model-action]'))b.addEventListener('click',()=>{
  if(b.dataset.modelAction==='zoomin')zoom=Math.max(35,zoom-12);
  if(b.dataset.modelAction==='zoomout')zoom=Math.min(135,zoom+12);
  if(b.dataset.modelAction==='reset'){zoom=75;spin=0}
  if(b.dataset.modelAction==='rotate')spin=(spin+90)%360;
  orbit();
 });
 updateSummary();
 return {
  select:id=>{equipped=GEAR_BY_ID[id]?id:'classico';updateSummary();if(!modal.hidden){renderCards();showItem(preview)}},
  setProgress:state=>{wins=Math.max(0,Number(state?.wins)||0);confirmed=Boolean(state?.confirmed);updateSummary();if(!modal.hidden){renderCards();showItem(preview)}},
  get value(){return equipped},get preview(){return preview},open,close
 };
}
