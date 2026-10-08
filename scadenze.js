/* PeriziaFlow V1.8 — scadenze operative salvate nelle pratiche. */
const deadlineTypes=['Sopralluogo','Documenti da ricevere','Consegna perizia','Altro'];
function validDeadlineDate(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const d=new Date(value+'T00:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===value;
}
function cleanDeadline(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Scadenza non valida.');
 if(typeof raw.id!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(raw.id))throw Error('ID scadenza non valido.');
 if(!deadlineTypes.includes(raw.type)||!validDeadlineDate(raw.dueDate))throw Error('Tipo o data scadenza non validi.');
 if(typeof raw.text!=='string'||raw.text.length>2000)throw Error('Descrizione scadenza non valida.');
 if(!['Aperta','Completata'].includes(raw.status))throw Error('Stato scadenza non valido.');
 if(typeof raw.completedAt!=='string'||(raw.status==='Completata'&&!validDeadlineDate(raw.completedAt))||(raw.status==='Aperta'&&raw.completedAt!==''))throw Error('Data completamento non valida.');
 return {id:raw.id,type:raw.type,dueDate:raw.dueDate,text:raw.text,status:raw.status,completedAt:raw.completedAt};
}
function deadlineState(d,reference=today()){
 if(d.status==='Completata')return {key:'done',label:'Completata',color:'green'};
 const days=dayDiff(reference,d.dueDate);
 if(days<0)return {key:'overdue',label:'Scaduta',color:'red'};
 if(days===0)return {key:'today',label:'Oggi',color:'orange'};
 if(days<=7)return {key:'soon',label:'Entro 7 giorni',color:'orange'};
 return {key:'future',label:'Programmata',color:'blue'};
}
function allDeadlineRows(){return cases.flatMap(c=>(c.deadlines||[]).map(d=>({c,d}))).sort((a,b)=>a.d.dueDate.localeCompare(b.d.dueDate)||a.c.claim.localeCompare(b.c.claim));}
function deadlineCommit(c,next){
 const previous=c.deadlines;c.deadlines=next;
 try{save();return true;}catch(e){c.deadlines=previous;alert('Scadenza non salvata: spazio locale non disponibile. Esporta un backup e libera spazio.');return false;}
}
const deadlineDialog=document.createElement('dialog');deadlineDialog.id='deadlineDialog';document.body.append(deadlineDialog);
const deadlinePanel=document.querySelector('#scadenze .panel');
deadlinePanel.innerHTML=`<div class="panel-head"><h3>Scadenze operative</h3><button type="button" class="primary" id="newDeadline">+ Nuova scadenza</button></div><p class="meta">Attività collegate ai sinistri e salvate nel backup. Le scadenze restano aperte finché vengono completate, anche se la pratica è chiusa. Gli avvisi compaiono mentre il programma è aperto.</p><div class="cards" id="deadlineCards"></div><div class="toolbar deadline-toolbar"><label>Cerca sinistro o attività<input type="search" id="deadlineSearch" placeholder="Sinistro, compagnia, assicurato, descrizione"></label><label>Visualizza<select id="deadlineStatus"><option value="open">Tutte le aperte</option><option value="overdue">Scadute</option><option value="today">Oggi</option><option value="soon">Entro 7 giorni (oggi incluso)</option><option value="done">Completate</option><option value="all">Tutte</option></select></label><label>Tipo<select id="deadlineType"><option value="">Tutti i tipi</option>${options(deadlineTypes,'')}</select></label><label>Compagnia<select id="deadlineCompany"></select></label></div><div id="deadlinesList"></div>`;
const deadlineDashboard=document.createElement('div');deadlineDashboard.className='panel';deadlineDashboard.id='deadlineDashboard';
deadlineDashboard.innerHTML='<div class="panel-head"><h3>Avvisi scadenze</h3><button type="button" id="showAllDeadlines">Tutte le scadenze</button></div><div class="cards" id="deadlineDashboardCards"></div><div id="deadlineDashboardList"></div>';
document.querySelector('#kpiCards').after(deadlineDashboard);
function deadlineCardsHTML(rows){return [['Scadute','overdue'],['Oggi','today'],['Nei prossimi 7 giorni','soon'],['Completate','done']].map(([label,key])=>`<div class="card"><div class="label">${label}</div><div class="value">${rows.filter(r=>deadlineState(r.d).key===key).length}</div></div>`).join('');}
function deadlineRowsHTML(rows,actions=true){
 return rows.map(({c,d})=>{const state=deadlineState(d);return `<div class="list-row deadline-row"><div><strong>${esc(d.type)} · ${showDate(d.dueDate)}</strong><div class="meta">Sinistro ${esc(c.claim)} · ${esc(c.company)} · ${esc(c.insured)} · ${esc(c.expert||'Perito non assegnato')}</div>${d.text?`<div class="deadline-description">${esc(d.text)}</div>`:''}${d.completedAt?`<div class="meta">Completata il ${showDate(d.completedAt)}</div>`:''}</div><div class="row-actions"><span class="status ${state.color}">${state.label}</span><button type="button" data-dl-action="case" data-case-id="${esc(c.id)}">Apri pratica</button>${actions?`<button type="button" data-dl-action="edit" data-case-id="${esc(c.id)}" data-deadline-id="${esc(d.id)}">Modifica</button><button type="button" data-dl-action="toggle" data-case-id="${esc(c.id)}" data-deadline-id="${esc(d.id)}">${d.status==='Completata'?'Riapri':'Completata'}</button><button type="button" class="danger-btn" data-dl-action="delete" data-case-id="${esc(c.id)}" data-deadline-id="${esc(d.id)}">Elimina</button>`:''}</div></div>`;}).join('')||'<p class="empty-state">Nessuna scadenza da mostrare.</p>';
}
window.renderDeadlines=function(){
 const rows=allDeadlineRows(),selector=document.querySelector('#deadlineCompany'),company=selector.value;
 selector.innerHTML='<option value="">Tutte le compagnie</option>'+options([...new Set(cases.map(c=>c.company))].sort(),company);selector.value=[...selector.options].some(o=>o.value===company)?company:'';
 const q=document.querySelector('#deadlineSearch').value.trim().toLowerCase(),filter=document.querySelector('#deadlineStatus').value,type=document.querySelector('#deadlineType').value;
 const filtered=rows.filter(({c,d})=>{const state=deadlineState(d).key;return (filter==='all'||(filter==='open'&&state!=='done')||(filter==='soon'&&['today','soon'].includes(state))||state===filter)&&(!type||d.type===type)&&(!selector.value||c.company===selector.value)&&[c.claim,c.company,c.insured,c.expert,d.type,d.text].join(' ').toLowerCase().includes(q);});
 document.querySelector('#deadlineCards').innerHTML=deadlineCardsHTML(rows);
 document.querySelector('#deadlinesList').innerHTML=`<p class="meta">${filtered.length} attività · Riepilogo su tutte le pratiche</p>`+deadlineRowsHTML(filtered);
 renderDeadlineDashboard(rows);
};
function renderDeadlineDashboard(rows=allDeadlineRows()){
 const urgent=rows.filter(({d})=>['overdue','today','soon'].includes(deadlineState(d).key));
 document.querySelector('#deadlineDashboardCards').innerHTML=deadlineCardsHTML(rows);
 document.querySelector('#deadlineDashboardList').innerHTML=deadlineRowsHTML(urgent.slice(0,8),false)+(urgent.length>8?`<p class="meta">Altre ${urgent.length-8} attività nella sezione Scadenze.</p>`:'');
 document.querySelector('#todoList').innerHTML=deadlineRowsHTML(rows.filter(({d})=>['overdue','today'].includes(deadlineState(d).key)).slice(0,4),false);
}
function refreshDeadlineViews(caseId){renderDeadlines();if(document.querySelector('#caseDialog').open)openCase(caseId);}
window.editDeadline=function(caseId='',deadlineId=''){
 if(!cases.length){alert('Crea prima una pratica.');return;}
 const c=cases.find(c=>c.id===caseId),d=c?.deadlines?.find(d=>d.id===deadlineId);
 if(deadlineId&&!d)return;
 deadlineDialog.innerHTML=`<form class="modal" id="deadlineForm"><div class="panel-head"><h3>${d?'Modifica':'Nuova'} scadenza</h3><button type="button" class="icon-btn" id="closeDeadline" aria-label="Chiudi">✕</button></div><div class="form-grid"><label>Pratica / sinistro<select name="caseId" required ${d?'disabled':''}>${cases.map(p=>`<option value="${esc(p.id)}" ${p.id===(c?.id||cases[0].id)?'selected':''}>${esc(p.claim)} · ${esc(p.company)} · ${esc(p.insured)} (${esc(p.id)})</option>`).join('')}</select></label><label>Tipo attività<select name="type">${options(deadlineTypes,d?.type||deadlineTypes[0])}</select></label>${field('dueDate','Data scadenza',d?.dueDate||today(),'date',true)}<label>Descrizione / documenti mancanti<textarea name="text" maxlength="2000" rows="4">${esc(d?.text||'')}</textarea></label></div><p class="meta">Puoi registrare date già trascorse. Gli avvisi sono locali; non vengono inviate email o notifiche esterne.</p><p class="error" id="deadlineError" role="alert"></p><div class="modal-actions"><button type="button" id="cancelDeadline">Annulla</button><button type="submit" class="primary">Salva scadenza</button></div></form>`;
 deadlineDialog.showModal();
 document.querySelector('#closeDeadline').onclick=document.querySelector('#cancelDeadline').onclick=()=>deadlineDialog.close();
 document.querySelector('#deadlineForm').onsubmit=ev=>{
  ev.preventDefault();const f=ev.target;if(!f.reportValidity())return;const values=Object.fromEntries(new FormData(f)),target=d?c:cases.find(c=>c.id===values.caseId);
  if(!target)return;
  try{const entry=cleanDeadline({id:d?.id||crypto.randomUUID(),type:values.type,dueDate:values.dueDate,text:values.text.trim(),status:d?.status||'Aperta',completedAt:d?.completedAt||''});
   const next=d?(target.deadlines||[]).map(x=>x.id===d.id?entry:x):[...(target.deadlines||[]),entry];
   if(!deadlineCommit(target,next))return;deadlineDialog.close();refreshDeadlineViews(target.id);
  }catch(e){document.querySelector('#deadlineError').textContent=e.message;}
 };
};
function handleDeadlineAction(ev){
 const button=ev.target.closest('[data-dl-action]');if(!button)return;ev.preventDefault();
 const c=cases.find(c=>c.id===button.dataset.caseId);if(!c)return;
 if(button.dataset.dlAction==='case'){openCase(c.id);return;}
 const d=c.deadlines?.find(d=>d.id===button.dataset.deadlineId);if(!d)return;
 if(button.dataset.dlAction==='edit'){editDeadline(c.id,d.id);return;}
 if(button.dataset.dlAction==='delete'){
  if(!confirm(`Eliminare la scadenza ${d.type} del ${showDate(d.dueDate)} per il sinistro ${c.claim}?`))return;
  if(deadlineCommit(c,c.deadlines.filter(x=>x.id!==d.id)))refreshDeadlineViews(c.id);
 }else if(button.dataset.dlAction==='toggle'){
  const completed=d.status!=='Completata',next=c.deadlines.map(x=>x.id===d.id?{...x,status:completed?'Completata':'Aperta',completedAt:completed?today():''}:x);
  if(deadlineCommit(c,next))refreshDeadlineViews(c.id);
 }
}
deadlinePanel.addEventListener('click',handleDeadlineAction);deadlineDashboard.addEventListener('click',handleDeadlineAction);document.querySelector('#todoList').addEventListener('click',handleDeadlineAction);
document.querySelector('#newDeadline').onclick=()=>editDeadline();
document.querySelector('#showAllDeadlines').onclick=()=>document.querySelector('[data-view="scadenze"]').click();
for(const id of ['deadlineSearch','deadlineStatus','deadlineType','deadlineCompany'])document.querySelector('#'+id).addEventListener(id==='deadlineSearch'?'input':'change',renderDeadlines);
const openCaseBeforeDeadlines=window.openCase;
window.openCase=function(id){
 openCaseBeforeDeadlines(id);const c=cases.find(c=>c.id===id);if(!c)return;
 const panel=document.createElement('div');panel.className='section-card';panel.id='caseDeadlinePanel';
 panel.innerHTML=`<div class="section-head"><h4>Scadenze della pratica</h4><button type="button" id="addCaseDeadline">+ Scadenza</button></div>`+deadlineRowsHTML((c.deadlines||[]).map(d=>({c,d})).sort((a,b)=>a.d.dueDate.localeCompare(b.d.dueDate)));
 document.querySelector('#caseModalBody .case-tabs').prepend(panel);panel.addEventListener('click',handleDeadlineAction);document.querySelector('#addCaseDeadline').onclick=()=>editDeadline(c.id);
};
const kpisBeforeDeadlines=renderKPIs;
window.renderKPIs=function(){kpisBeforeDeadlines();renderDeadlineDashboard();};
titles.scadenze=['Scadenze','Sopralluoghi, documenti e consegna perizie'];
renderDeadlines();
let deadlineReferenceDate=today();
setInterval(()=>{if(today()!==deadlineReferenceDate){deadlineReferenceDate=today();renderDeadlines();}},60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)renderDeadlines();});
