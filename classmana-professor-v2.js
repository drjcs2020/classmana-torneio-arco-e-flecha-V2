/** Painel do professor no LOBBY da versão 2. Senha e token não são gravados no navegador. */
import {ONLINE_API_URL} from './online-config.js';
const $=id=>document.getElementById(id);
const dialog=$('cm-teacher-dialog'),trigger=$('cm-teacher-toggle');
if(dialog&&trigger){
 let teacherToken='';
 const notify=(message,isError=false)=>{
  const el=$('cm-teacher-status');el.textContent=message;el.dataset.error=String(isError);
 };
 const loading=(on)=>{dialog.querySelectorAll('button[type="submit"]').forEach(b=>b.disabled=on)};
 async function request(action,payload){
  const url=new URL(ONLINE_API_URL);url.searchParams.set('action',action);
  const method=payload?'POST':'GET';
  const controller=new AbortController(),clock=setTimeout(()=>controller.abort(),15000);
  try{
   const response=await fetch(url,{method,mode:'cors',cache:'no-store',signal:controller.signal,
    headers:{'Content-Type':'application/json',...(teacherToken?{'X-ClassMana-Teacher':teacherToken}:{})},
    ...(payload?{body:JSON.stringify(payload)}:{})});
   const data=await response.json();if(!response.ok||!data.ok)throw Error(data.error||'Não foi possível acessar o professor.');
   return data;
  }catch(error){throw Error(error.name==='AbortError'?'O servidor demorou a responder.':error.message)}
  finally{clearTimeout(clock)}
 }
 function showAuthenticated(auth){
  $('cm-teacher-login-view').hidden=auth;
  $('cm-teacher-controls-view').hidden=!auth;
  $('cm-teacher-password').value='';
 }
 function refreshCounts(data){
  $('cm-teacher-counts').textContent=['A','B','C'].map(h=>`4º ${h}: ${data.counts?.[h]??'—'} alunos`).join('  ·  ');
  $('cm-teacher-last-reset').textContent=data.lastReset
   ?'Último reset: '+new Date(data.lastReset.at).toLocaleString('pt-BR')+' · '+data.lastReset.duelsCount+' duelos arquivados'
   :'Ainda não houve reset de placar pela área do professor.';
 }
 async function refresh(){
  const data=await request('teacherStatus');refreshCounts(data);
  const sel=$('cm-teacher-team'),selected=sel.value;sel.replaceChildren();
  const blank=document.createElement('option');blank.value='';blank.textContent='Sem equipe definida';sel.append(blank);
  for(const name of data.teams||[]){const o=document.createElement('option');o.value=name;o.textContent=name;sel.append(o)}
  sel.value=selected;
 }
 function closePanel(){dialog.close();teacherToken='';$('cm-teacher-change-form').reset();showAuthenticated(false);notify('Entre com a senha do professor.');}
 trigger.addEventListener('click',()=>{
  showAuthenticated(false);teacherToken='';notify('Entre com a senha do professor.');
  if(typeof dialog.showModal==='function')dialog.showModal();
  else dialog.setAttribute('open','');
 });
 $('cm-teacher-close').addEventListener('click',closePanel);
 dialog.addEventListener('cancel',event=>{event.preventDefault();closePanel()});
 dialog.addEventListener('click',event=>{if(event.target===dialog)closePanel()});
 $('cm-teacher-login-form').addEventListener('submit',async event=>{
  event.preventDefault();loading(true);notify('Verificando acesso…');
  try{
   const result=await request('teacherLogin',{password:$('cm-teacher-password').value});
   teacherToken=result.token;showAuthenticated(true);await refresh();notify('Acesso do professor liberado.');
  }catch(error){teacherToken='';showAuthenticated(false);notify(error.message,true)}
  finally{loading(false)}
 });
 $('cm-teacher-change-form').addEventListener('submit',async event=>{
  event.preventDefault();
  const current=$('cm-teacher-old-password').value;
  const next=$('cm-teacher-new-password').value;
  const confirm=$('cm-teacher-confirm-password').value;
  if(next!==confirm){notify('As duas senhas novas não coincidem.',true);return;}
  if(next.length<12||next.length>128||!/[\p{L}]/u.test(next)||!/[0-9]/.test(next)){
    notify('Use 12 a 128 caracteres com letras e números.',true);return;
  }
  loading(true);notify('Alterando a senha do professor…');
  try{
    await request('teacherChangePassword',{currentPassword:current,newPassword:next});
    $('cm-teacher-change-form').reset();
    teacherToken='';showAuthenticated(false);
    notify('Senha alterada! Entre novamente com sua nova senha.');
  }catch(error){notify(error.message,true)}
  finally{loading(false)}
 });
 $('cm-teacher-add-form').addEventListener('submit',async event=>{
  event.preventDefault();
  const name=$('cm-teacher-name').value.trim(),house=$('cm-teacher-house').value,team=$('cm-teacher-team').value;
  if(!name){notify('Digite o nome do aluno.',true);return}
  loading(true);notify('Cadastrando aluno na V2…');
  try{
   const result=await request('teacherAddStudent',{name,house,team});
   $('cm-teacher-name').value='';
   window.dispatchEvent(new CustomEvent('classmana:v2-roster-updated',{detail:{student:result.student}}));
   await refresh();
   notify('✓ '+result.student.name+' cadastrado em 4º '+house+' ('+result.student.id+'). Disponível para jogar.');
  }catch(error){notify(error.message,true)}
  finally{loading(false)}
 });
 $('cm-teacher-reset-form').addEventListener('submit',async event=>{
  event.preventDefault();
  if($('cm-teacher-reset-phrase').value.trim()!=='ZERAR V2'){
   notify('Digite exatamente ZERAR V2 para confirmar o reset.',true);return;
  }
  if(!window.confirm('Zerar TODOS os duelos e o ranking online da V2?\n\nOs registros serão arquivados no banco V2. A versão 1 NÃO será afetada.'))return;
  loading(true);notify('Arquivando dados e zerando o placar da V2…');
  try{
   const result=await request('teacherResetScores',{confirmation:'ZERAR V2'});
   $('cm-teacher-reset-phrase').value='';await refresh();
   notify('✓ Placar V2 zerado: '+result.duelsRemoved+' duelos removidos; cópia de segurança registrada.');
   window.dispatchEvent(new Event('classmana:v2-ranking-reset'));
  }catch(error){notify(error.message,true)}
  finally{loading(false)}
 });
}
