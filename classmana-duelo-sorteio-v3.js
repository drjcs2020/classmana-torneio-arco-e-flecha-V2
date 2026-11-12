/* Duelo entre Casas V3 — pronto para o ZIP em assets/ui/. */
(function(){
'use strict';
var BASE='assets/ui/';
var H={A:['Águia Dourada','aguia','assets/ui/crests/brasao-aguia-dourada.png'],B:['Leão de Fogo','leao','assets/ui/crests/brasao-leao-de-fogo.png'],C:['Dragão de Esmeralda','dragao','assets/ui/crests/brasao-dragao-esmeralda.png']};
var R=window.CLASSMANA_ROSTER||{},modal=null,home='',enemy='',picked=null,busy=false,ready=false,audio,drawLocked=false;
function el(id){return document.getElementById(id)}
function label(h){return '4º '+h+' · '+H[h][0]}
function rosterId(id){return /^[ABC]\d\d$/.test(id||'') && !!R[id[0]]?.[Number(id.slice(1))-1]}
function current(){var a=[el('player')?.value,el('cm-quick-player')?.value,sessionStorage.getItem('cm_active_student_v2'),localStorage.getItem('cm_v2_lobby_student')];return a.find(rosterId)||''}
function list(h){return (R[h]||[]).map(function(n,i){return {id:h+String(i+1).padStart(2,'0'),name:n}})}
function store(k){try{return JSON.parse(localStorage.getItem(k)||'{}')||{}}catch(e){return {}}}
function gender(id){return store('classmana-student-archer-genders-v2')[id]}
function drawKey(){return 'classmana-duel-once-v3:'+home}
function previousDraw(){try{var p=JSON.parse(sessionStorage.getItem(drawKey())||'null');return p&&p.enemy&&p.id?{enemy:p.enemy,student:list(p.enemy).find(function(x){return x.id===p.id})}:null}catch(e){return null}}
function rememberDraw(){try{sessionStorage.setItem(drawKey(),JSON.stringify({enemy:enemy,id:picked.id}))}catch(e){}}
function portrait(img,h,sex){var g=sex==='f'?'f':'m';img.onerror=function(){img.onerror=null;img.src='assets/v2/heroes/'+H[h][1]+'-'+g+'.webp'};img.src=BASE+'retrato-'+H[h][1]+'-'+g+'.png'}
function t(id,value){el(id).textContent=value}
function bleep(end){try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();var osc=audio.createOscillator(),gain=audio.createGain();osc.frequency.value=end?850:430;gain.gain.setValueAtTime(.03,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.08);osc.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(audio.currentTime+.085)}catch(e){}}
function selectedIndex(n){if(window.crypto&&window.crypto.getRandomValues){var a=new Uint32Array(1),m=Math.floor(4294967296/n)*n;do{window.crypto.getRandomValues(a)}while(a[0]>=m);return a[0]%n}return Math.floor(Math.random()*n)}
function make(){
 modal=document.createElement('div');modal.id='cm-draw-modal';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
 modal.innerHTML=[
 '<div class="cm-draw-shell"><div class="cm-draw-top">',
 '<button class="cm-draw-back" id="cm-draw-back" type="button">⬅ VOLTAR</button>',
 '<img class="cm-draw-logo" src="assets/ui/challenge/logo-classmana-torneio.png" alt="ClassMana">',
 '<button class="cm-draw-inbox" id="cm-draw-inbox" type="button">🔔 Meus desafios</button></div>',
 '<div class="cm-draw-heading"><img src="assets/ui/challenge/banner-duelo-entre-casas.png" alt="DUELO ENTRE CASAS"></div>',
 '<div class="cm-draw-caption">ESCOLHA A CASA E SORTEIE O ADVERSÁRIO</div>',
 '<section class="cm-draw-panel">',
 '<div class="cm-draw-houses" id="cm-draw-houses"></div><div class="cm-draw-grid">',
 '<div class="cm-draw-portrait" id="cm-draw-left"><img id="cm-draw-left-img" alt="Desafiante"><div class="cm-draw-label"><strong id="cm-draw-left-name"></strong><small id="cm-draw-left-house"></small></div></div>',
 '<div class="cm-draw-center"><img class="cm-draw-vs" src="assets/v2/frames/versus.webp" alt="VS">',
 '<img class="cm-draw-spin-banner" src="assets/ui/banner-sorteio.png" alt="Sorteio do Adversário">',
 '<div class="cm-draw-tube" id="cm-draw-tube"><img src="assets/ui/carrossel-tubo.png" alt=""><img id="cm-draw-spin-img" class="cm-draw-spin-face" alt="Retrato alternado">',
 '<img class="cm-draw-select-frame" src="assets/ui/moldura-seletor.png" alt=""></div>',
 '<button id="cm-draw-roll" class="cm-draw-action" type="button" disabled>SORTEAR ADVERSÁRIO</button>',
 '<span class="cm-draw-muted" id="cm-draw-state" aria-live="polite">Selecione uma casa rival.</span></div>',
 '<div class="cm-draw-portrait" id="cm-draw-right"><img id="cm-draw-right-img" alt="Adversário"><div class="cm-draw-label"><strong id="cm-draw-right-name">CASA RIVAL</strong><small id="cm-draw-right-house"></small></div></div>',
 '<div class="cm-draw-list"><h3 id="cm-draw-list-head">ALUNOS DA CASA RIVAL</h3><div class="cm-draw-list-items" id="cm-draw-list-items"></div></div></div>',
 '<div class="cm-draw-result" id="cm-draw-result"><h3><img src="assets/ui/banner-adversario-escolhido.png" alt="ADVERSÁRIO ESCOLHIDO!"></h3>',
 '<button type="button" id="cm-draw-confirm" class="cm-draw-action">CONTINUAR</button></div>',
 '</section>',
 '<div id="cm-draw-transition" class="cm-draw-transition"><p>⚔ PREPARANDO A PARTIDA... ⚔</p></div></div>'
 ].join('');
 document.body.append(modal);
 el('cm-draw-back').onclick=close;
 el('cm-draw-inbox').onclick=function(){close();el('cm-open-challenges')?.click()};
 el('cm-draw-roll').onclick=draw;
 el('cm-draw-confirm').onclick=confirmMatch;
}
function close(){if(busy)return;modal?.remove();modal=null;enemy='';picked=null;document.body.style.removeProperty('overflow')}
function open(){
 home=current();if(!rosterId(home))return false;
 if(modal)modal.remove();
 make();busy=false;enemy='';picked=null;drawLocked=false;document.body.style.overflow='hidden';
 var h=home[0],people=R[h],id=Number(home.slice(1))-1;
 el('cm-draw-left').dataset.h=h;
 portrait(el('cm-draw-left-img'),h,gender(home)||store('classmana-archer-skins-v2')[h]||'m');
 t('cm-draw-left-name',people[id]);t('cm-draw-left-house',label(h));t('cm-draw-right-house','Selecione um brasão');
 var houses=el('cm-draw-houses');
 Object.keys(H).forEach(function(k){
  var btn=document.createElement('button');btn.type='button';btn.className='cm-draw-house';btn.dataset.h=k;btn.disabled=k===h;
  var img=document.createElement('img');img.alt='';img.src=H[k][2];
  var txt=document.createElement('span');txt.textContent=label(k)+(k===h?' · SUA CASA':'');
  btn.append(img,txt);btn.onclick=function(){selectHouse(k)};houses.append(btn);
 });
 var saved=previousDraw();if(saved?.student){selectHouse(saved.enemy);finishDraw(saved.student,true)}
 return true;
}
function selectHouse(h){
 if(busy||drawLocked||h===home[0])return;enemy=h;picked=null;
 document.querySelectorAll('#cm-draw-houses button').forEach(function(b){b.classList.toggle('chosen',b.dataset.h===h)});
 el('cm-draw-result').classList.remove('visible');el('cm-draw-right').dataset.h=h;
 // Antes do sorteio, a casa rival é representada somente pelo brasão oficial.
 el('cm-draw-right-img').onerror=null;el('cm-draw-right-img').src=H[h][2];
 el('cm-draw-spin-img').onerror=null;el('cm-draw-spin-img').src=H[h][2];
 t('cm-draw-right-name','CASA RIVAL');t('cm-draw-right-house',label(h));
 t('cm-draw-list-head','ALUNOS DO '+label(h).toUpperCase());t('cm-draw-state','Pronto para sortear.');
 var holder=el('cm-draw-list-items');holder.replaceChildren();
 list(h).forEach(function(p){
  var row=document.createElement('div');row.className='cm-draw-list-item';row.dataset.studentId=p.id;
  var icon=document.createElement('img');icon.src=BASE+'icone-aluno.png';icon.alt='';
  var name=document.createElement('span');name.textContent=p.name;row.append(icon,name);holder.append(row);
 });
 el('cm-draw-roll').disabled=!R[h]?.length;el('cm-draw-roll').classList.remove('reroll');el('cm-draw-roll').textContent='SORTEAR ADVERSÁRIO';
}
function finishDraw(student,restored){
 picked=student;drawLocked=true;busy=false;
 el('cm-draw-tube').classList.remove('spinning');
 var actual=gender(picked.id);
 if(actual==='m'||actual==='f'){
  portrait(el('cm-draw-spin-img'),enemy,actual);portrait(el('cm-draw-right-img'),enemy,actual);

 }else{
  // Sem avatar salvo para o aluno: manter retrato de arquearia durante a revelação,
  // sem deduzir o gênero pelo nome. O sexo do retrato não identifica o estudante.
  portrait(el('cm-draw-spin-img'),enemy,'m');portrait(el('cm-draw-right-img'),enemy,'m');

 }
 t('cm-draw-right-name',picked.name);t('cm-draw-right-house',label(enemy));
 t('cm-draw-state','CONFRONTO DEFINIDO');
 document.querySelectorAll('#cm-draw-houses button').forEach(function(b){b.disabled=true});
 document.querySelectorAll('.cm-draw-list-item').forEach(function(row){
  var winner=row.dataset.studentId===picked.id;row.classList.toggle('active',winner);
  if(winner&&!row.querySelector('.cm-draw-picked-icon')){
   var icon=document.createElement('img');icon.className='cm-draw-picked-icon';
   icon.alt='Escolhido';icon.src=BASE+'icone-confirmado.png';row.append(icon);
   row.scrollIntoView({block:'nearest'});
  }
 });
 el('cm-draw-result').classList.add('visible');
 el('cm-draw-roll').disabled=true;el('cm-draw-roll').textContent='SORTEIO CONCLUÍDO';
 if(!restored){rememberDraw();bleep(true)}
}
async function draw(){
 if(!enemy||busy||drawLocked)return;
 var pool=list(enemy);if(!pool.length)return;
 busy=true;var selected=pool[selectedIndex(pool.length)];
 el('cm-draw-roll').disabled=true;el('cm-draw-result').classList.remove('visible');
 el('cm-draw-tube').classList.add('spinning');t('cm-draw-right-name','SORTEANDO...');
 var steps=[60,65,72,80,90,105,125,150,180,220,275,345,450,590,700],sex='m';
 for(var wait of steps){
  sex=sex==='m'?'f':'m';
  portrait(el('cm-draw-spin-img'),enemy,sex);portrait(el('cm-draw-right-img'),enemy,sex);bleep();
  await new Promise(function(resolve){setTimeout(resolve,wait)});
 }
 finishDraw(selected,false);
}

function configure(){
 var mode=el('mode'),scope=el('team-scope'),house=el('opponent-house'),team=el('opponent-team'),field=el('rival'),level=el('challenge-level');
 if(!mode||!scope||!house||!team||!field||!level||!picked)return false;
 mode.value='challenge_team';scope.value='other';mode.dispatchEvent(new Event('change',{bubbles:true}));
 house.value=enemy;house.dispatchEvent(new Event('change',{bubbles:true}));
 var found=[...field.options].some(function(o){return o.value===picked.id});
 if(!found)for(var option of [...team.options]){
  team.value=option.value;team.dispatchEvent(new Event('change',{bubbles:true}));
  if([...field.options].some(function(o){return o.value===picked.id})){found=true;break}
 }
 if(!found)return false;
 field.value=picked.id;level.value='avancado';level.dispatchEvent(new Event('change',{bubbles:true}));
 return true;
}
function confirmMatch(){
 if(!picked||busy)return;
 if(!configure()){t('cm-draw-state','Adversário não encontrado na lista válida da partida.');return}
 var overlay=el('cm-draw-transition');overlay.classList.add('active');
 var arena=el('start-game');
 if(!arena){overlay.classList.remove('active');return}
 var observer=new MutationObserver(function(){
  if(document.body.dataset.page==='arena'){observer.disconnect();busy=false;close()}
 });
 observer.observe(document.body,{attributes:true,attributeFilter:['data-page']});
 overlay.onclick=function(){if(!busy){overlay.classList.remove('active');observer.disconnect()}};
 requestAnimationFrame(function(){arena.click()});
 setTimeout(function(){observer.disconnect();if(modal?.isConnected&&document.body.dataset.page!=='arena')overlay.querySelector('p').textContent='Se a conexão falhar, clique para voltar ao confronto.'},12000);
}
var check=new Image();
check.onload=function(){ready=true;window.classmanaDueloSorteioReady=true;if(new URLSearchParams(location.search).has('duelo_preview'))open()};
check.onerror=function(){ready=false;window.classmanaDueloSorteioReady=false};
check.src=BASE+'moldura-seletor.png';
document.addEventListener('click',function(event){
 var trigger=event.target.closest?.('[data-play-mode="challenge_team"]');
 if(!trigger||!ready||!rosterId(current()))return;
 event.preventDefault();event.stopImmediatePropagation();open();
},true);
window.classmanaOpenDueloSorteio=function(){return ready?open():false};
})();
