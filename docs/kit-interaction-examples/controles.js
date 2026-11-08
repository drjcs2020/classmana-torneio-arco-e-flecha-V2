/**
 * ClassMana — controles gráficos individuais.
 * A função separa aparência (PNG com alfa) de comportamento real (JS).
 * Não substitui o PlayCanvas: conecte onShot(potencia) ao motor existente.
 */
export function botaoSprite(element, url, acao, nome='') {
  if (!(element instanceof HTMLElement)) throw Error('Elemento HTML obrigatório');
  if (!['BUTTON','A'].includes(element.tagName)) throw Error('Use <button> ou <a> para acessibilidade');
  if (nome) element.setAttribute('aria-label',nome);
  element.classList.add('cm-botao-sprite');
  element.textContent='';
  const img=new Image(); img.src=url; img.alt=''; img.draggable=false;
  img.onerror=()=>{ element.textContent=nome; element.classList.add('cm-botao-fallback'); };
  element.append(img);
  if (typeof acao==='function') element.addEventListener('click',acao);
  return element;
}

/**
 * Slider vertical: 0..100. Para lançar, clique em "ATIRAR" ou use Enter/Espaço.
 * O preenchimento cresce proporcionalmente; o botão prateado acompanha o valor.
 * Nunca grava pontos sozinho — chame a função real do motor em onShot.
 */
export function barraForca(host,{valorInicial=30,onChange=()=>{},onShot=()=>{}}={}) {
  if (!(host instanceof HTMLElement)) throw Error('Container obrigatório');
  const base='../hud/';
  host.classList.add('cm-forca');
  host.innerHTML=`
    <div class="cm-forca-sensor" tabindex="0" role="slider" aria-label="Potência da flecha" aria-valuemin="0" aria-valuemax="100" aria-valuenow="30">
      <img class="cm-forca-moldura" alt="" src="${base}forca-01-moldura.png" draggable="false">
      <div class="cm-forca-trilho">
        <div class="cm-forca-preenchimento"></div>
        <img class="cm-forca-botao" alt="" src="${base}forca-botao-metálico-extra.png" draggable="false">
      </div>
    </div>
    <div class="cm-forca-controles"><output class="cm-forca-valor">30%</output><button class="cm-forca-atirar" type="button">ATIRAR</button></div>`;
  const slider=host.querySelector('[role=slider]');
  const track=host.querySelector('.cm-forca-trilho');
  const fill=host.querySelector('.cm-forca-preenchimento');
  const knob=host.querySelector('.cm-forca-botao');
  const readout=host.querySelector('output');
  let valor=30,drag=false;
  const clamp=x=>Math.min(100,Math.max(0,Number(x)||0));
  function set(v){
    valor=clamp(v);
    fill.style.height=valor+'%';
    knob.style.bottom=`calc(${valor}% - 22px)`;
    readout.textContent=Math.round(valor)+'%';
    slider.setAttribute('aria-valuenow',Math.round(valor));
    onChange(valor);
  }
  const fromPointer=e=>{
    const r=track.getBoundingClientRect();
    return 100*(1-(e.clientY-r.top)/r.height);
  };
  slider.addEventListener('pointerdown',e=>{
    drag=true; slider.setPointerCapture(e.pointerId);set(fromPointer(e));e.preventDefault();
  });
  slider.addEventListener('pointermove',e=>{ if(drag)set(fromPointer(e)); });
  slider.addEventListener('pointerup',e=>{if(drag){set(fromPointer(e));drag=false;}});
  slider.addEventListener('pointercancel',()=>drag=false);
  slider.addEventListener('keydown',e=>{
    if(['ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(e.key)){
      e.preventDefault();set(e.key==='Home'?0:e.key==='End'?100:valor+(
      e.key==='ArrowUp'?1:e.key==='ArrowDown'?-1:e.key==='PageUp'?10:-10));
    }
    if(e.key==='Enter'||e.key===' '){e.preventDefault();onShot(valor/100);}
  });
  host.querySelector('button').addEventListener('click',()=>onShot(valor/100));
  set(valorInicial);
  return {set,get:()=>valor,disparar:()=>onShot(valor/100)};
}
