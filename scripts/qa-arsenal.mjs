// ClassMana: bloqueia publicações com modelos faltando ou regras divergentes.
import {readFileSync,existsSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const source=readFileSync('equipment-catalog.js','utf8');
const {GEAR,MODEL_PARTS}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
assert.equal(GEAR.length,9,'O arsenal deve exibir os nove modelos 3D distintos');
assert.equal(new Set(GEAR.map(x=>x.id)).size,GEAR.length,'IDs duplicados');
assert.equal(new Set(GEAR.map(x=>x.model)).size,GEAR.length,'Modelos 3D duplicados');
const server=readFileSync('duel-api/server.mjs','utf8');
const hashes={
 'bow-recurve.glb.gz':'c1b314512aeb232ad0aa3d0253ff5c9f5a6649f7037a16a2777927ee337ec14d',
 'bow-ranger.glb.gz':'5044c1049f06daec420319fcbda44632c8312d396e01507f446e0a9a1cf4a056',
 'bow-aloy-war.glb.gz':'d9fdb6299ee9563043d1f2dfd4f83646da1481397a91231ab1e49ec61f8758a5'
};
let bytes=0;
for(const gear of GEAR){
 const count=MODEL_PARTS[gear.model]||0;
 const dir='models3d/equipment';
 const paths=count?Array.from({length:count},(_,i)=>join(dir,'model-parts',gear.model+'.part'+String(i+1).padStart(2,'0'))):[join(dir,gear.model)];
 for(const path of paths)assert.ok(existsSync(path),'Arquivo 3D ausente: '+path);
 const raw=Buffer.concat(paths.map(p=>readFileSync(p)));
 bytes+=raw.length;
 if(hashes[gear.model])assert.equal(createHash('sha256').update(raw).digest('hex'),hashes[gear.model],'Modelo corrompido: '+gear.model);
 const glb=gear.model.endsWith('.gz')?gunzipSync(raw):raw;
 assert.equal(glb.subarray(0,4).toString(),'glTF','Assinatura GLB inválida: '+gear.model);
 assert.equal(glb.readUInt32LE(8),glb.length,'GLB truncado: '+gear.model);
 assert.equal(glb.subarray(16,20).toString(),'JSON','JSON GLB ausente: '+gear.model);
 const json=JSON.parse(glb.subarray(20,20+glb.readUInt32LE(12)).toString());
 assert.ok(json.meshes?.length>0,'GLB sem geometria: '+gear.model);
 assert.ok(json.scenes?.length>0,'GLB sem cena: '+gear.model);
 if(gear.model.endsWith('.gz'))assert.ok(json.nodes.some(x=>x.name==='ClassMana_Orientacao_Frontal_Centralizada'),'Modelo novo sem orientação frontal: '+gear.model);
 const escaped=gear.id.replace(/[.*+?^\x24{}()|[\]\\]/g,'\\$&');
 const re=new RegExp('\\b'+escaped+':\\{ring:([0-9.]+),bonus:([0-9]+),requiredWins:([0-9]+)\\}');
 const rule=server.match(re);
 assert.ok(rule,'Arma não validada pela API: '+gear.id);
 assert.equal(Number(rule[1]),gear.ring,'Regra de mira diferente: '+gear.id);
 assert.equal(Number(rule[2]),gear.bonus,'Bônus diferente: '+gear.id);
 assert.equal(Number(rule[3]),gear.requiredWins,'Vitórias diferentes: '+gear.id);
 console.log('✓',gear.level,gear.name,glb.length+' bytes GLB',count||1,'arquivo(s)');
}
console.log('Arsenal ClassMana validado:',GEAR.length,'modelos,',bytes,'bytes armazenados.');
