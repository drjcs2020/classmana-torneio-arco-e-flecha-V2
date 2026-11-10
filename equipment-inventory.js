import {GEAR,GEAR_BY_ID,modelSource,getGearLevel,isGearUnlocked} from './equipment-catalog.js?v=inventory-1';
// Inventário isolado: somente um modelo 3D por vez. Nenhum GLB no painel do herói.
const ARROWS=[
 {id:'arrow-standard',name:'Flecha Clássica',type:'Flecha',rarity:'Comum',model:'arrow-standard.glb',desc:'Flecha padrão do Arco de Treino e da Besta Leve.',ability:'Disparo equilibrado'},
 {id:'arrow-precision',name:'Flecha de Precisão',type:'Flecha',rarity:'Raro',model:'arrow-precision.glb',desc:'Flecha utilizada pelos arcos de precisão.',ability:'Associada à arma equipada'},
 {id:'arrow-power',name:'Flecha de Poder',type:'Flecha',rarity:'Épico',model:'arrow-power.glb',desc:'Flecha utilizada pelas armas de maior potência.',ability:'Associada à arma equipada'}
];
const ALL=[...GEAR,...ARROWS],BY_ID=Object.fromEntries(ALL.map(x=>[x.id,x]));
const make=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=value;return e};
const MINI_COLORS={classico:'#c9945b',real:'#f2c86e',vento:'#7dddf1',lendario:'#ffce58',recurvo:'#d1d8ec',explorador:'#a7d983',aloy:'#ef7361',besta_leve:'#bca27b',besta_real:'#f8d27a','arrow-standard':'#c6a57a','arrow-precision':'#8adfff','arrow-power':'#f2bd59'};
function mini(item){
 const c=MINI_COLORS[item.id]||'#e9c477';
 if(item.type==='Flecha')return '<svg viewBox="0 0 160 100" aria-hidden="true"><path d="M19 80 138 16" stroke="'+c+'" stroke-width="5" stroke-linecap="round"/><path d="m127 12 22-4-10 22-5-12Z" fill="#ffe5a2"/><path d="m19 80-12-2 8-15 9 12Z" fill="'+c+'"/></svg>';
 if(item.type==='Besta')return '<svg viewBox="0 0 160 100" aria-hidden="true"><path d="'+(item.id==='besta_real'?'M13 38Q80 -3 147 38':'M25 39Q80 12 135 39')+'" fill="none" stroke="'+c+'" stroke-width="10" stroke-linecap="round"/><path d="M23 39Q80 59 137 39" fill="none" stroke="#f4e7bc" stroke-width="2"/><path d="M79 13v78" stroke="#c2d4e3" stroke-width="9" stroke-linecap="round"/><path d="M79 46 56 84" stroke="'+c+'" stroke-width="10" stroke-linecap="round"/></svg>';
 const shapes={classico:'M20 76Q80 6 140 76',real:'M13 76Q40 14 62 29Q80 43 98 29Q120 14 147 76',vento:'M18 79Q43 12 65 25Q80 35 95 25Q117 12 142 79',lendario:'M12 78Q37 -5 64 24Q80 41 96 24Q123 -5 148 78',recurvo:'M22 80Q42 28 60 20Q80 48 100 20Q118 28 138 80',explorador:'M18 79Q46 1 75 26Q84 30 93 26Q122 1 142 79',aloy:'M14 79Q36 7 65 28Q80 37 95 28Q124 7 146 79'};
 const p=shapes[item.id]||shapes.classico;
 const gem=['real','lendario','aloy'].includes(item.id)?'<path d="m80 33 7 8-7 8-7-8Z" fill="#76dcff" stroke="#ffe5a2" stroke-width="2"/>':'';
 return '<svg viewBox="0 0 160 100" aria-hidden="true"><path d="'+p+'" fill="none" stroke="#3c241b" stroke-width="13" stroke-linecap="round"/><path d="'+p+'" fill="none" stroke="'+c+'" stroke-width="8" stroke-linecap="round"/><path d="M20 76H140" stroke="#f6e7c4" stroke-width="2"/><path d="M80 26V82" stroke="'+c+'" stroke-width="6" stroke-linecap="round"/>'+gem+'</svg>';
}
export function mountEquipmentInventory({selected='classico',onSelect=()=>{}}={}){
 const host=document.querySelector('.studio-bows');
 if(!host)return {select:()=>{},setProgress:()=>{},get value(){return 'classico'}};
 host.replaceChildren();host.className='studio-bows cm-inventory-entry';
 const openButton=make('button','cm-inventory-launch');openButton.type='button';
 openButton.setAttribute('aria-haspopup','dialog');openButton.setAttribute('aria-controls','cm-arsenal-modal');
 openButton.innerHTML='<span class="cm-inventory-crest"><img src="assets/ui/arsenal-crest.svg" alt="" draggable="false"></span><span class="cm-inventory-launch-copy"><strong>INVENTÁRIO DE ARMAS</strong><span>Arcos · Bestas · Flechas</span><em>CLIQUE PARA ABRIR O ARSENAL</em></span>';
 const summary=make('div','cm-inventory-equipped');summary.setAttribute('aria-live','polite');
 host.append(openButton,summary);
 document.getElementById('cm-arsenal-modal')?.remove();
 const modal=make('div','cm-arsenal-modal');modal.id='cm-arsenal-modal';modal.hidden=true;
 modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','cm-arsenal-title');
 modal.innerHTML="\n<div class=\"cm-arsenal-shell\"><div class=\"cm-arsenal-core\">\n<header class=\"cm-arsenal-header\">\n<img class=\"cm-arsenal-header-crest\" src=\"assets/ui/arsenal-crest.svg\" alt=\"\">\n<div><p>CLASSMANA · TORNEIO DAS TRÊS CASAS</p><h2 id=\"cm-arsenal-title\">INVENTÁRIO DE ARMAS</h2></div>\n<button class=\"cm-arsenal-close\" type=\"button\" aria-label=\"Fechar inventário\">✕ <span>FECHAR</span></button>\n</header>\n<div class=\"cm-arsenal-layout\">\n<aside class=\"cm-arsenal-sidebar\" aria-label=\"Categorias\">\n<p class=\"cm-arsenal-section-label\">CATEGORIAS</p>\n<nav class=\"cm-arsenal-categories\" aria-label=\"Filtrar equipamentos\">\n<button type=\"button\" data-category=\"Arco\" aria-pressed=\"true\">🏹 <span>ARCOS</span></button>\n<button type=\"button\" data-category=\"Besta\" aria-pressed=\"false\">⚔ <span>BESTAS</span></button>\n<button type=\"button\" data-category=\"Flecha\" aria-pressed=\"false\">➶ <span>FLECHAS</span></button>\n</nav>\n<div class=\"cm-arsenal-progress\"><p>SEU PROGRESSO</p><strong class=\"cm-arsenal-wins\">—</strong><span>vitórias oficiais</span><strong class=\"cm-arsenal-level\">Nv. 1</strong><span>nível do arsenal</span></div>\n<p class=\"cm-arsenal-help\">Explore todas as armas. As bloqueadas são liberadas com vitórias oficiais.</p>\n</aside>\n<section class=\"cm-arsenal-collection\" aria-label=\"Coleção de equipamentos\">\n<div class=\"cm-arsenal-collection-heading\"><h3>COLEÇÃO</h3><span class=\"cm-arsenal-count\"></span></div>\n<div class=\"cm-arsenal-grid\" role=\"list\"></div>\n</section>\n<section class=\"cm-arsenal-detail\" aria-label=\"Detalhes do equipamento\">\n<div class=\"cm-arsenal-detail-top\"><h3 class=\"cm-arsenal-item-name\"></h3><span class=\"cm-arsenal-rarity\"></span></div>\n<div class=\"cm-arsenal-stage\">\n<span class=\"cm-arsenal-stage-rune\" aria-hidden=\"true\">✦</span>\n<div class=\"cm-arsenal-model-placeholder\" aria-hidden=\"true\"></div>\n<model-viewer class=\"cm-arsenal-model\" camera-controls disable-pan disable-zoom interaction-prompt=\"none\" environment-image=\"neutral\" shadow-intensity=\"1\" exposure=\"1.35\" loading=\"eager\" camera-target=\"auto auto auto\" alt=\"Modelo tridimensional da arma\"></model-viewer>\n<div class=\"cm-arsenal-loading\" aria-live=\"polite\">Escolha uma arma para visualizar.</div>\n<div class=\"cm-arsenal-model-controls\">\n<button type=\"button\" data-model-action=\"zoomout\" aria-label=\"Afastar arma\">−</button>\n<button type=\"button\" data-model-action=\"reset\" aria-label=\"Reenquadrar arma\">⌖</button>\n<button type=\"button\" data-model-action=\"rotate\" aria-label=\"Girar arma\">↻</button>\n<button type=\"button\" data-model-action=\"zoomin\" aria-label=\"Aproximar arma\">+</button>\n</div></div>\n<p class=\"cm-arsenal-description\"></p>\n<div class=\"cm-arsenal-stats\" aria-label=\"Atributos da arma\"></div>\n<div class=\"cm-arsenal-ability\"><strong>HABILIDADE</strong><span></span></div>\n<div class=\"cm-arsenal-action-row\"><span class=\"cm-arsenal-unlock\"></span><button type=\"button\" class=\"cm-arsenal-equip\"></button></div>\n</section>\n</div><div class=\"cm-arsenal-foot\">✦ ARSENAL DAS TRÊS CASAS ✦</div>\n</div></div>";
 document.body.append(modal);
 const q=s=>modal.querySelector(s);
 const grid=q('.cm-arsenal-grid'),viewer=q('.cm-arsenal-model'),placeholder=q('.cm-arsenal-model-placeholder');
 const equipButton=q('.cm-arsenal-equip'),loading=q('.cm-arsenal-loading'),stage=q('.cm-arsenal-stage');
 const categories=[...modal.querySelectorAll('[data-category]')];
 let equipped=GEAR_BY_ID[selected]?selected:'classico',preview=equipped,category='Arco',wins=0,confirmed=false;
 let zoom=75,spin=0,requestId=0,previousFocus=null;
 const snapshots=new Map();
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
  q('.cm-arsenal-level').textContent=confirmed?'Nv. '+getGearLevel(wins):'Nv. 1';
 }
 function renderCards(){
  const items=ALL.filter(item=>item.type===category);
  q('.cm-arsenal-count').textContent=items.length+' '+(items.length===1?'ITEM':'ITENS');
  grid.replaceChildren();
  for(const item of items){
   const card=make('button','cm-arsenal-card');card.type='button';card.dataset.id=item.id;
   card.dataset.rarity=item.rarity.toLowerCase();card.dataset.selected=String(item.id===preview);
   card.dataset.locked=String(!unlocked(item));card.setAttribute('role','listitem');
   card.setAttribute('aria-label',item.name+' · '+progressText(item));
   const thumb=make('span','cm-arsenal-thumb');
   if(snapshots.has(item.id)){const img=make('img','cm-arsenal-thumb-image');img.src=snapshots.get(item.id);img.alt='';thumb.append(img)}
   else thumb.innerHTML=mini(item);
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
  equipButton.textContent=isArrow?'➶ VINCULADA À ARMA':!unlocked(item)?'🔒 BLOQUEADA':isEquipped?'✓ EQUIPADA':'✓ EQUIPAR ARMA';
  equipButton.dataset.state=isArrow?'linked':!unlocked(item)?'locked':isEquipped?'equipped':'ready';
  const wind=item.wind==null?'—':item.wind===1?'Normal':(item.wind<1?'-':'+')+Math.abs(Math.round((item.wind-1)*100))+'%';
  const margin=item.ring==null?'—':((1/item.ring-1)>=0?'+':'')+Math.round((1/item.ring-1)*100)+'%';
  const stats=isArrow?[['TIPO','Flecha 3D'],['USO','Automático'],['DISTÂNCIAS','10–150 m'],['CUSTO','Vinculada ao arco']]:
   [['MARGEM DE ACERTO',margin],['DESVIO DO VENTO',wind],['PONTOS',item.bonus?'+'+item.bonus:'Padrão'],['DISTÂNCIAS','10–150 m'],['CUSTO PARA LIBERAR',item.requiredWins?item.requiredWins+' vitórias':'Grátis'],['FLECHA',item.arrowName]];
  q('.cm-arsenal-stats').replaceChildren(...stats.map(([k,v])=>{const cell=make('div','cm-arsenal-stat');cell.append(make('span','',k),make('strong','',v));return cell}));
  zoom=75;spin=0;orbit();viewer.setAttribute('orientation',item.previewOrientation||'0deg 0deg 0deg');
  viewer.setAttribute('alt','Modelo tridimensional: '+item.name+'. Arraste para girar.');
  viewer.removeAttribute('src');stage.dataset.ready='false';
  placeholder.innerHTML=mini(item);loading.textContent='CARREGANDO MODELO 3D…';
  if(modal.hidden)return;
  modelSource(item.model).then(url=>{if(!modal.hidden&&token===requestId)viewer.setAttribute('src',url)}).catch(err=>{
   if(token!==requestId)return;loading.textContent='MODELO INDISPONÍVEL · CONSULTE A FICHA';console.warn('[ClassMana] Inventário:',item.model,err)
  });
 }
 function setCategory(next){
  category=next;for(const b of categories)b.setAttribute('aria-pressed',String(b.dataset.category===category));
  if(BY_ID[preview]?.type!==category)preview=ALL.find(x=>x.type===category).id;
  renderCards();showItem(preview);
 }
 viewer.addEventListener('load',()=>{
  if(modal.hidden)return;stage.dataset.ready='true';loading.textContent='ARRASTE A ARMA PARA GIRAR';
  const id=preview;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   if(preview!==id||typeof viewer.toDataURL!=='function')return;
   try{const data=viewer.toDataURL('image/png');if(typeof data==='string'&&data.startsWith('data:image/')){
    snapshots.set(id,data);const thumb=grid.querySelector('[data-id="'+id+'"] .cm-arsenal-thumb');
    if(thumb){const img=make('img','cm-arsenal-thumb-image');img.src=data;img.alt='';thumb.replaceChildren(img)}
   }}catch{/* Captura opcional; a visualização 3D continua funcionando. */}
  }));
 });
 viewer.addEventListener('error',()=>{stage.dataset.ready='false';loading.textContent='NÃO FOI POSSÍVEL CARREGAR O MODELO 3D'});
 function open(){
  previousFocus=document.activeElement;modal.hidden=false;document.body.classList.add('cm-arsenal-opened');
  const current=GEAR_BY_ID[equipped]||GEAR[0];category=current.type;preview=current.id;
  for(const b of categories)b.setAttribute('aria-pressed',String(b.dataset.category===category));
  renderCards();showItem(preview);q('.cm-arsenal-close').focus();
 }
 function close(){requestId++;modal.hidden=true;document.body.classList.remove('cm-arsenal-opened');viewer.removeAttribute('src');previousFocus?.focus?.()}
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
