/* Reposiciona o indicador já existente sem alterar velocidade nem física do vento. */
const stage=document.getElementById('stage');
const wind=document.getElementById('wind');
// O HUD V2 é uma grade de quatro painéis; não tirar o vento do grupo.
// A movimentação antiga permanece apenas como fallback para telas legadas.
if(stage&&wind&&!wind.closest('.cm-arena-readouts')){
  stage.appendChild(wind);
  wind.classList.add('cm-wind-restored');
}
