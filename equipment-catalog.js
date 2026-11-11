// ClassMana V2.1 — catálogo de equipamentos 3D e progressão por vitórias oficiais.
// Os bônus precisam corresponder ao servidor duel-api/server.mjs.
export const GEAR=Object.freeze([
 {id:'classico',name:'Arco de Treino',type:'Arco',rarity:'Comum',level:1,requiredWins:0,ability:'Equilíbrio',desc:'Estável e confiável para começar sua jornada.',wind:1,ring:1,bonus:0,model:'bow-practice.glb',arrow:'arrow-standard.glb',arrowName:'Flecha Clássica',scale:1.15,rotation:[0,0,45],previewOrientation:'0deg 0deg 45deg',offset:[0,0,0]},
 {id:'real',name:'Arco Real',type:'Arco',rarity:'Incomum',level:2,requiredWins:1,ability:'+1 ponto por acerto',desc:'Poder real com uma mira mais exigente.',wind:1,ring:1.12,bonus:1,model:'bow-royal.glb',arrow:'arrow-precision.glb',arrowName:'Flecha de Precisão',scale:.41,rotation:[-90,0,0],previewOrientation:'-90deg 0deg 0deg',offset:[.26,0,0]},
 {id:'vento',name:'Arco dos Ventos',type:'Arco',rarity:'Raro',level:3,requiredWins:2,ability:'−50% do vento',desc:'Reduz pela metade o desvio provocado pelo vento.',wind:.5,ring:1,bonus:0,model:'bow-wind.glb',arrow:'arrow-precision.glb',arrowName:'Flecha de Precisão',scale:.59,rotation:[90,0,90],previewOrientation:'90deg 0deg 90deg',offset:[0,0,0]},
 {id:'besta_leve',name:'Besta Leve',type:'Besta',rarity:'Raro',level:8,requiredWins:10,ability:'Área de acerto +6%',desc:'Amplia a margem de acerto com disparo firme.',wind:.9,ring:.94,bonus:0,model:'crossbow-light.glb',arrow:'arrow-standard.glb',arrowName:'Virote Clássico',scale:1.5,rotation:[0,0,0],previewOrientation:'0deg 0deg 0deg',offset:[0,-.12,0]},
 {id:'lendario',name:'Arco Lendário',type:'Arco',rarity:'Épico',level:4,requiredWins:4,ability:'+2 pontos por acerto',desc:'Poder lendário para arqueiros experientes.',wind:1.2,ring:1.22,bonus:2,model:'bow-legend.glb',arrow:'arrow-power.glb',arrowName:'Flecha de Poder',scale:1.05,rotation:[0,0,0],previewOrientation:'0deg 0deg 0deg',offset:[.05,-.10,0]},
 {id:'besta_real',name:'Besta Real',type:'Besta',rarity:'Lendário',level:9,requiredWins:12,ability:'+1 ponto · menos vento',desc:'Uma besta poderosa para arqueiros experientes.',wind:.8,ring:1.08,bonus:1,model:'crossbow-royal.glb',arrow:'arrow-power.glb',arrowName:'Virote de Poder',scale:.026,rotation:[0,0,0],previewOrientation:'0deg 0deg 0deg',offset:[.07,-.33,0]},
 {id:'recurvo',name:'Arco Recurvo',type:'Arco',rarity:'Épico',level:5,requiredWins:6,ability:'Mira firme · vento reduzido',desc:'Modelo recurvo original, com disparo equilibrado.',wind:.85,ring:1.05,bonus:0,model:'bow-recurve.glb.gz',arrow:'arrow-precision.glb',arrowName:'Flecha de Precisão',scale:1.0,rotation:[0,0,0],previewOrientation:'0deg 0deg 0deg',offset:[0,0,0]},
 {id:'explorador',name:'Arco do Explorador',type:'Arco',rarity:'Lendário',level:6,requiredWins:8,ability:'+1 ponto · precisão aprimorada',desc:'Arco 3D de caça e exploração enviado para o ClassMana.',wind:1,ring:1.1,bonus:1,model:'bow-ranger.glb.gz',arrow:'arrow-precision.glb',arrowName:'Flecha de Precisão',scale:1.0,rotation:[0,0,0],previewOrientation:'0deg 0deg 0deg',offset:[0,0,0]},
 {id:'aloy',name:'Arco de Guerra de Aloy',type:'Arco',rarity:'Mítico',level:7,requiredWins:10,ability:'+2 pontos · resistência ao vento',desc:'O arco de guerra original enviado para o torneio.',wind:.9,ring:1.16,bonus:2,model:'bow-aloy-war.glb.gz',arrow:'arrow-power.glb',arrowName:'Flecha de Poder',scale:1.0,rotation:[0,0,0],previewOrientation:'0deg 0deg 0deg',offset:[0,0,0]}
]);
export const GEAR_BY_ID=Object.freeze(Object.fromEntries(GEAR.map(g=>[g.id,g])));
export function getGearLevel(wins=0){const n=Math.max(0,Number(wins)||0);return Math.max(1,...GEAR.filter(g=>g.type==='Arco'&&n>=g.requiredWins).map(g=>g.level));}
export function isGearUnlocked(gear,wins=0){const g=typeof gear==='string'?GEAR_BY_ID[gear]:gear;return Boolean(g)&&Math.max(0,Number(wins)||0)>=g.requiredWins;}
export const MODEL_PARTS=Object.freeze({'bow-royal.glb':7,'bow-legend.glb':10,'crossbow-royal.glb':6,'bow-recurve.glb.gz':1,'bow-ranger.glb.gz':1,'bow-aloy-war.glb.gz':12});
const resolved=new Map();
const folder='models3d/equipment/';
export function modelSource(file){
 if(!/^[a-z0-9-]+\.glb(?:\.gz)?$/i.test(file))throw Error('Arquivo de modelo inválido');
 const count=MODEL_PARTS[file];
 if(!count)return Promise.resolve(folder+file);
 if(resolved.has(file))return resolved.get(file);
 const task=Promise.all(Array.from({length:count},(_,i)=>{
   const part='model-parts/'+file+'.part'+String(i+1).padStart(2,'0');
   return fetch(folder+part).then(r=>{if(!r.ok)throw Error('GLB incompleto: '+part);return r.arrayBuffer()});
 })).then(async parts=>{
   let blob=new Blob(parts,{type:file.endsWith('.gz')?'application/gzip':'model/gltf-binary'});
   if(file.endsWith('.gz')){
     if(typeof DecompressionStream==='undefined')throw Error('Seu navegador não suporta a descompressão de modelos 3D');
     blob=await new Response(blob.stream().pipeThrough(new DecompressionStream('gzip'))).blob();
   }
   return URL.createObjectURL(new Blob([blob],{type:'model/gltf-binary'}));
 });
 resolved.set(file,task);
 task.catch(()=>resolved.delete(file));
 return task;
}
