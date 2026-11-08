/**
 * ClassMana V2 — somente a camada visual da arena.
 * PlayCanvas continua calculando mira, trajetória, pontuação e colisões.
 * A arte 2D substitui apenas a RENDERIZAÇÃO dos modelos antigos que tinham
 * primitivas esféricas, alvo sem contraste e flecha desencaixada do arco.
 */
export function mountArenaVisual({getScene,getMatch}={}){
 const stage=document.getElementById('stage');
 if(!stage||document.body.dataset.page!=='arena')return;
 if(stage.querySelector('#cm-v2-illustrated-arena'))return;

 const layer=document.createElement('div');
 layer.id='cm-v2-illustrated-arena';
 layer.className='cm-arena-art';
 layer.setAttribute('aria-hidden','true');
 const make=(className,src)=>{
  const img=document.createElement('img');
  img.className=className;
  img.src=src;img.alt='';img.draggable=false;
  img.decoding='async';
  layer.appendChild(img);
  return img;
 };
 // Alvo colorido com cavalete para a trilha fixa; sem cavalete na móvel.
 const grounded=make('cm-arena-target-art cm-target-grounded','assets/ui/hud/alvo-com-suporte.png');
 const suspended=make('cm-arena-target-art cm-target-suspended','assets/ui/hud/alvo-circular.png');
 const bow=make('cm-arena-bow-art','assets/equipment/bow.png');
 const sight=make('cm-arena-aim-art','assets/ui/hud/mira-dourada.png');
 stage.appendChild(layer);

 let enabled=false,stopped=false,lastError=false;
 const confirmImage=img=>new Promise(resolve=>{
  if(img.complete)return resolve(img.naturalWidth>0);
  const done=()=>{img.removeEventListener('load',ok);img.removeEventListener('error',bad)};
  const ok=()=>{done();resolve(true)};
  const bad=()=>{done();resolve(false)};
  img.addEventListener('load',ok,{once:true});
  img.addEventListener('error',bad,{once:true});
 });
 Promise.all([grounded,suspended,bow,sight].map(confirmImage)).then(ok=>{
  if(stopped||!stage.isConnected)return;
  enabled=ok.every(Boolean);
  stage.dataset.arenaVisualReady=enabled?'true':'failed';
  if(enabled){
   layer.classList.add('is-ready');
   stage.classList.add('cm-arena-art-active');
   // Os elementos 3D continuam ativos e calculando atrás dos sprites.
   // Não apagar o canvas nem desabilitar a física do PlayCanvas.
  }else{
   console.warn('[ClassMana V2] Não foi possível carregar uma das artes da arena. O motor 3D segue visível.');
  }
  stage.dispatchEvent(new CustomEvent('classmana:arena-art-ready',{detail:{enabled}}));
 });

 function draw(){
  if(!stage.isConnected){stopped=true;return}
  if(enabled){
   const scene=getScene?.(),match=getMatch?.();
   if(scene&&match){
    try{
     const rect=stage.getBoundingClientRect();
     const metrics=scene.getTargetMetrics?.();
     const aim=scene.getAimPoint?.();
     if(metrics&&Number.isFinite(metrics.r)&&metrics.r>0){
      const x=metrics.x,y=metrics.y,r=Math.max(6,metrics.r);
      // Ambos os sprites compartilham o centro do alvo calculado pelo motor;
      // os anéis coloridos têm o mesmo raio que a área de pontuação.
      grounded.style.left=x+'px';grounded.style.top=y+'px';
      grounded.style.width=(2.54*r)+'px';
      suspended.style.left=x+'px';suspended.style.top=y+'px';
      suspended.style.width=(2.12*r)+'px';
      const moving=match.level==='avancado'||match.level==='lendario';
      grounded.hidden=moving;suspended.hidden=!moving;
     }
     if(aim&&Number.isFinite(aim.x)&&Number.isFinite(aim.y)){
      sight.style.left=(100*aim.x)+'%';
      sight.style.top=(100*aim.y)+'%';
      const shiftX=(aim.x-.5)*Math.min(72,rect.width*.08);
      const shiftY=(aim.y-.45)*Math.min(52,rect.height*.08);
      bow.style.setProperty('--cm-bow-x',shiftX.toFixed(1)+'px');
      bow.style.setProperty('--cm-bow-y',shiftY.toFixed(1)+'px');
     }
    }catch(error){
     if(!lastError){
      console.warn('[ClassMana V2] Falha ao sincronizar camada ilustrada:',error);
      lastError=true;
     }
    }
   }
  }
  requestAnimationFrame(draw);
 }
 requestAnimationFrame(draw);
 return {destroy(){stopped=true;stage.classList.remove('cm-arena-art-active');layer.remove()}};
}
