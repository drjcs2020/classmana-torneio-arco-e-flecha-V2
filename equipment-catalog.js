// ClassMana V2.1 — catálogo de equipamentos 3D e progressão por vitórias oficiais.
// Os bônus precisam corresponder ao servidor duel-api/server.mjs.
export const GEAR=Object.freeze([
 {id:'classico',name:'Arco de Treino',type:'Arco',rarity:'Comum',level:1,requiredWins:0,ability:'Equilíbrio',desc:'Estável e confiável para começar sua jornada.',wind:1,ring:1,bonus:0,model:'bow-practice.glb',arrow:'arrow-standard.glb',arrowName:'Flecha Clássica',scale:1.05,rotation:[0,0,0],previewOrientation:'0deg 0deg 0deg',offset:[-.47,.11,0]},
 {id:'real',name:'Arco Real',type:'Arco',rarity:'Incomum',level:2,requiredWins:2,ability:'+1 ponto por acerto',desc:'Poder real com uma mira mais exigente.',wind:1,ring:1.12,bonus:1,model:'bow-royal.glb',arrow:'arrow-precision.glb',arrowName:'Flecha de Precisão',scale:1.10,rotation:[0,0,0],previewOrientation:'0deg 0deg 0deg',offset:[-.48,.10,0]},
 {id:'vento',name:'Arco dos Ventos',type:'Arco',rarity:'Raro',level:3,requiredWins:5,ability:'−50% do vento',desc:'Reduz pela metade o desvio provocado pelo vento.',wind:.5,ring:1,bonus:0,model:'bow-wind.glb',arrow:'arrow-precision.glb',arrowName:'Flecha de Precisão',scale:.53,rotation:[90,0,90],previewOrientation:'90deg 0deg 90deg',offset:[-.48,.10,0]},
 {id:'besta_leve',name:'Besta Leve',type:'Besta',rarity:'Raro',level:4,requiredWins:9,ability:'Área de acerto +6%',desc:'Amplia a margem de acerto com disparo firme.',wind:.9,ring:.94,bonus:0,model:'crossbow-light.glb',arrow:'arrow-standard.glb',arrowName:'Virote Clássico',scale:1.5,rotation:[0,0,0],previewOrientation:'0deg 0deg 0deg',offset:[-.44,.12,0]},
 {id:'lendario',name:'Arco Lendário',type:'Arco',rarity:'Épico',level:5,requiredWins:15,ability:'+2 pontos por acerto',desc:'Poder lendário para arqueiros experientes.',wind:1.2,ring:1.22,bonus:2,model:'bow-legend.glb',arrow:'arrow-power.glb',arrowName:'Flecha de Poder',scale:.43,rotation:[90,0,0],previewOrientation:'90deg 0deg 0deg',offset:[-.48,.12,0]},
 {id:'besta_real',name:'Besta Real',type:'Besta',rarity:'Lendário',level:6,requiredWins:24,ability:'+1 ponto · menos vento',desc:'A conquista máxima do arsenal das três Casas.',wind:.8,ring:1.08,bonus:1,model:'crossbow-royal.glb',arrow:'arrow-power.glb',arrowName:'Virote de Poder',scale:.026,rotation:[0,0,0],previewOrientation:'0deg 0deg 0deg',offset:[-.48,.12,0]}
]);
export const GEAR_BY_ID=Object.freeze(Object.fromEntries(GEAR.map(g=>[g.id,g])));
export function getGearLevel(wins=0){const n=Math.max(0,Number(wins)||0);return GEAR.filter(g=>n>=g.requiredWins).length;}
export function isGearUnlocked(gear,wins=0){const g=typeof gear==='string'?GEAR_BY_ID[gear]:gear;return Boolean(g)&&Math.max(0,Number(wins)||0)>=g.requiredWins;}
export const MODEL_PARTS=Object.freeze({'bow-royal.glb':7,'bow-legend.glb':10,'crossbow-royal.glb':6});
const resolved=new Map();
const folder='models3d/equipment/';
export function modelSource(file){
 if(!/^[a-z0-9-]+\.glb$/i.test(file))throw Error('Arquivo de modelo inválido');
 const count=MODEL_PARTS[file];
 if(!count)return Promise.resolve(folder+file);
 if(resolved.has(file))return resolved.get(file);
 const task=Promise.all(Array.from({length:count},(_,i)=>{
   const part='model-parts/'+file+'.part'+String(i+1).padStart(2,'0');
   return fetch(folder+part).then(r=>{if(!r.ok)throw Error('GLB incompleto: '+part);return r.arrayBuffer()});
 })).then(parts=>URL.createObjectURL(new Blob(parts,{type:'model/gltf-binary'})));
 resolved.set(file,task);
 task.catch(()=>resolved.delete(file));
 return task;
}
