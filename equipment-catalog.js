// ClassMana V2.1 — catálogo único de armas 3D, usado pelo carrossel e pela arena.
// Os atributos de pontuação devem permanecer iguais aos do backend duel-api/server.mjs.
export const GEAR=Object.freeze([
 {id:'classico',name:'Arco de Treino',type:'Arco',ability:'Equilíbrio',desc:'Precisão estável para começar.',wind:1,ring:1,bonus:0,model:'bow-practice.glb',arrow:'arrow-standard.glb',scale:1.05,rotation:[0,0,0],offset:[-.47,.11,0]},
 {id:'real',name:'Arco Real',type:'Arco',ability:'+1 ponto',desc:'Um ponto extra por acerto; mira mais exigente.',wind:1,ring:1.12,bonus:1,model:'bow-royal.glb',arrow:'arrow-precision.glb',scale:.38,rotation:[90,0,0],offset:[-.48,.10,0]},
 {id:'vento',name:'Arco dos Ventos',type:'Arco',ability:'−50% vento',desc:'Metade do desvio causado pelo vento.',wind:.5,ring:1,bonus:0,model:'bow-wind.glb',arrow:'arrow-precision.glb',scale:.53,rotation:[0,0,90],offset:[-.48,.10,0]},
 {id:'lendario',name:'Arco Lendário',type:'Arco',ability:'+2 pontos',desc:'Dois pontos extras; exige grande precisão.',wind:1.2,ring:1.22,bonus:2,model:'bow-legend.glb',arrow:'arrow-power.glb',scale:1.04,rotation:[0,0,0],offset:[-.48,.12,0]},
 {id:'besta_leve',name:'Besta Leve',type:'Besta',ability:'Mira ampliada',desc:'Área de acerto 6% maior; sem pontos extras.',wind:.9,ring:.94,bonus:0,model:'crossbow-light.glb',arrow:'arrow-standard.glb',scale:1.5,rotation:[0,90,0],offset:[-.44,.12,0]},
 {id:'besta_real',name:'Besta Real',type:'Besta',ability:'+1 ponto',desc:'Ponto extra por acerto; maior resistência ao vento.',wind:.8,ring:1.08,bonus:1,model:'crossbow-royal.glb',arrow:'arrow-power.glb',scale:.026,rotation:[0,90,0],offset:[-.48,.12,0]}
]);
export const GEAR_BY_ID=Object.freeze(Object.fromEntries(GEAR.map(g=>[g.id,g])));
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
