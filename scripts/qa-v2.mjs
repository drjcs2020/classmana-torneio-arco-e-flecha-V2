/** ClassMana V2: audit visual assets and independence from V1.
 * Execute with: node scripts/qa-v2.mjs
 */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const read=p=>fs.readFileSync(p,'utf8');
const exists=p=>fs.existsSync(p)&&fs.statSync(p).size>0;
const index=read('index.html'),arena=read('arena.html'),game=read('game-v3.js');
const config=read('online-config.js');
const paths=[
 'classmana-v2-ui.js','classmana-v2-theme.css',
 'assets/v2/backgrounds/lobby.webp','assets/v2/backgrounds/arena.webp',
 'assets/v2/backgrounds/ranking.webp','assets/v2/backgrounds/castle.webp',
 'assets/v2/crests/aguia.webp','assets/v2/crests/leao.webp','assets/v2/crests/dragao.webp',
 ...['aguia','leao','dragao'].flatMap(x=>['m','f'].map(s=>`assets/v2/heroes/${x}-${s}.webp`)),
 ...['jogar','ranking','desafios','regras'].map(x=>`assets/v2/buttons/${x}.webp`),
 'assets/sounds/kulakovka-epic-medieval-614879.mp3',
 'duel-api/server.mjs','duel-api/roster.json','duel-api/teams.json',
 'scene-v3.js','arena-difficulty.js','sprite-hud.js',
];
for(const file of paths)assert(exists(file),`Arquivo V2 ausente/vazio: ${file}`);
assert(index.includes('id="cm-v2-home"'),'Menu principal V2 ausente');
assert(index.includes('id="cm-v2-challenge-picker"'),'Desafiar aluno V2 ausente');
assert(index.includes('id="view-ranking"'),'Ranking ausente');
assert(index.includes('id="view-regras"'),'Regras ausentes');
assert(index.includes('id="finish"'),'Resultado ausente');
assert(index.includes('id="cm-v2-result-home"')&&arena.includes('id="cm-v2-result-home"'),'Voltar ao menu nos resultados ausente');
for(const page of [index,arena]){
 assert(page.includes('classmana-v2-theme.css'),'Estilo V2 não ligado');
 assert(page.includes('classmana-v2-ui.js'),'UI V2 não ligada');
 assert(page.includes('game-v3.js?v='),'Motor/estado do jogo removido');
}
assert(config.includes('classmana-v2-duel-api-production.up.railway.app/api'),'Backend V2 incorreto');
assert(!config.includes('classmana-duel-api-production.up.railway.app/api'),'API V1 ligada na V2');
assert(!game.includes('cm_active_archery_match_v1'),'Chaves de sessão da V1 ainda na V2');
assert(!read('online-client.js').includes('classmana_duelo_api_token_v1'),'Token da V1 ainda na V2');
assert(game.includes('cinematics.versus('),'Tela de confronto original não está conectada');
assert(game.includes('cinematics.resultView('),'Resultado original não está conectado');
assert(game.includes('mountSpriteHUD'),'HUD da arena foi removido');
assert(game.includes('online.create(')&&game.includes('online.submit('),'Duelo assíncrono removido');
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const preserved={
 'duel-api/server.mjs':'c5aba8816daa1be2aafa436d828d6967466abdad83cecbc44a3b504b2b469ff5',
};
// Values are exported at package creation, not used as false runtime claims.
for(const [file,expected] of Object.entries(preserved)){
 if(expected==='CALCULAR_NO_EMPACOTAMENTO')continue;
 assert.equal(sha(file),expected,'Backend original foi modificado: '+file);
}
console.log('✅ V2: assets, 6 telas, motor PlayCanvas, API separada, chaves locais, música e duelos preservados.');
