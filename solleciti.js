/* PeriziaFlow V1.9 — bozze locali e storico invii dichiarati dall'operatore. */
const reminderTypes=['Documentazione','Sopralluogo','Consegna perizia','Aggiornamento pratica'];
function validReminderEmail(value){return value===''||/^[^\s@<>;,]+@[^\s@<>;,]+\.[^\s@<>;,]+$/.test(value);}
function validReminderTimestamp(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(value)&&!isNaN(Date.parse(value))&&new Date(value).toISOString()===value;}
function cleanReminder(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||typeof raw.id!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(raw.id))throw Error('Sollecito non valido.');
 const out={id:raw.id};for(const [key,max] of [['recipientName',300],['recipientEmail',320],['subject',500],['body',20000],['deadlineId',100]]){if(typeof raw[key]!=='string'||raw[key].length>max)throw Error('Campo sollecito non valido: '+key);out[key]=raw[key];}
 if(!out.subject.trim()||/[\r\n]/.test(out.subject)||!out.body.trim()||!validReminderEmail(out.recipientEmail)||/[\r\n]/.test(out.recipientName))throw Error('Controlla oggetto, testo e destinatario del sollecito.');
 if(out.deadlineId&&!/^[A-Za-z0-9_-]{1,100}$/.test(out.deadlineId))throw Error('Collegamento scadenza non valido.');
 if(!reminderTypes.includes(raw.type)||!['Bozza','Inviato manualmente'].includes(raw.status))throw Error('Tipo o stato sollecito non valido.');
 if(!validReminderTimestamp(raw.createdAt)||!validReminderTimestamp(raw.updatedAt)||raw.updatedAt<raw.createdAt)throw Error('Date sollecito non valide.');
 if(typeof raw.sentAt!=='string'||(raw.status==='Bozza'&&raw.sentAt!=='')||(raw.status==='Inviato manualmente'&&(!validReminderTimestamp(raw.sentAt)||raw.sentAt<raw.createdAt||!out.recipientEmail)))throw Error('Dati invio manuale non validi.');
 return {...out,type:raw.type,status:raw.status,createdAt:raw.createdAt,updatedAt:raw.updatedAt,sentAt:raw.sentAt};
}
function reminderFromDeadline(d){return d?.type==='Documenti da ricevere'?'Documentazione':d?.type==='Sopralluogo'?'Sopralluogo':d?.type==='Consegna perizia'?'Consegna perizia':'Aggiornamento pratica';}
function reminderTemplate(c,type,d){
 const intro=`Buongiorno,\n\nin riferimento al sinistro ${c.claim}, compagnia ${c.company}, assicurato ${c.insured}, `;
 const requests={Documentazione:'chiediamo cortesemente un aggiornamento sulla documentazione ancora da ricevere.',Sopralluogo:'chiediamo cortesemente conferma della disponibilità e dello stato di organizzazione del sopralluogo.','Consegna perizia':'chiediamo cortesemente un aggiornamento sulla consegna della relazione peritale.','Aggiornamento pratica':'chiediamo cortesemente un aggiornamento sullo stato della pratica e sulle attività ancora da completare.'};
 return {subject:`Sollecito ${type.toLowerCase()} – Sinistro ${c.claim}`,body:intro+requests[type]+(d?`\n\nAttività: ${d.type}\nData prevista: ${showDate(d.dueDate)}`:'')+(d?.text?`\nDettagli da verificare: ${d.text}`:'')+'\n\nVi chiediamo di indicarci le tempistiche previste per il completamento.\n\nGrazie per la collaborazione.\nCordiali saluti,\nUfficio perizie'};
}
function reminderCommit(c,next){const previous=c.reminders;c.reminders=next;try{save();return true;}catch(e){c.reminders=previous;alert('Sollecito non salvato: spazio locale non disponibile. Esporta un backup e libera spazio.');return false;}}
function reminderDate(value){return value?new Date(value).toLocaleString('it-IT'):'—';}
function allReminderRows(){return cases.flatMap(c=>(c.reminders||[]).map(r=>({c,r}))).sort((a,b)=>b.r.updatedAt.localeCompare(a.r.updatedAt));}
function reminderRowsHTML(rows){return rows.map(({c,r})=>`<div class="list-row reminder-row"><div><strong>${esc(r.subject)}</strong><div class="meta">Sinistro ${esc(c.claim)} · ${esc(c.company)} · ${esc(c.insured)}</div><div class="meta">${esc(r.recipientName||'Destinatario da indicare')} · ${esc(r.recipientEmail||'Email da indicare')}</div><div class="meta">${r.status==='Bozza'?'Bozza aggiornata':'Invio dichiarato dall’operatore'}: ${esc(reminderDate(r.sentAt||r.updatedAt))}</div></div><div class="row-actions"><span class="status ${r.status==='Bozza'?'orange':'green'}">${r.status}</span><button type="button" data-reminder-action="open" data-case-id="${esc(c.id)}" data-reminder-id="${esc(r.id)}">${r.status==='Bozza'?'Apri bozza':'Vedi testo'}</button>${r.status==='Bozza'?`<button type="button" class="danger-btn" data-reminder-action="delete" data-case-id="${esc(c.id)}" data-reminder-id="${esc(r.id)}">Elimina bozza</button>`:''}</div></div>`).join('')||'<p class="empty-state">Nessun sollecito registrato.</p>';}
const reminderNav=document.createElement('button');reminderNav.className='nav-item';reminderNav.dataset.view='solleciti';reminderNav.textContent='Solleciti';document.querySelector('#nav').append(reminderNav);
const reminderSection=document.createElement('section');reminderSection.id='solleciti';reminderSection.className='view';reminderSection.innerHTML=`<div class="panel"><div class="panel-head"><h3>Solleciti assistiti</h3><button type="button" class="primary" id="newReminder">+ Nuova bozza</button></div><p>Prepara e controlla il testo, copialo nella tua email e invialo da lì. Registra l’invio solo dopo averlo effettuato. PeriziaFlow non invia email e non può confermare la consegna.</p><h4>Attività da verificare</h4><div id="reminderSuggestions"></div><h4>Storico e bozze</h4><div class="toolbar"><label>Cerca<input id="reminderSearch" type="search" placeholder="Sinistro, destinatario, testo"></label><label>Stato<select id="reminderStatus"><option value="">Tutti</option><option>Bozza</option><option>Inviato manualmente</option></select></label></div><div id="reminderHistory"></div></div>`;document.querySelector('.main').append(reminderSection);
reminderNav.onclick=()=>{document.querySelectorAll('.nav-item,.view').forEach(e=>e.classList.remove('active'));reminderNav.classList.add('active');reminderSection.classList.add('active');document.querySelector('#pageTitle').textContent='Solleciti';document.querySelector('#pageSubtitle').textContent='Bozze email e storico degli invii manuali';renderReminders();};
function renderReminders(){
 const q=document.querySelector('#reminderSearch').value.trim().toLowerCase(),status=document.querySelector('#reminderStatus').value;
 document.querySelector('#reminderHistory').innerHTML=reminderRowsHTML(allReminderRows().filter(({c,r})=>(!status||r.status===status)&&[c.claim,c.company,c.insured,r.recipientName,r.recipientEmail,r.subject,r.body].join(' ').toLowerCase().includes(q)));
 const overdue=allDeadlineRows().filter(({d})=>['overdue','today'].includes(deadlineState(d).key));
 const stalled=cases.filter(c=>c.status!=='Chiusa'&&(c.status==='In attesa documentazione'||(validDeadlineDate(c.openedAt)&&dayDiff(c.openedAt,today())>=7))&&!overdue.some(row=>row.c.id===c.id));
 const suggestions=[...overdue.map(({c,d})=>({c,d,label:`${d.type} · ${showDate(d.dueDate)}`})),...stalled.map(c=>({c,label:c.status,type:c.status==='In attesa documentazione'?'Documentazione':'Aggiornamento pratica'}))];
 document.querySelector('#reminderSuggestions').innerHTML=suggestions.map(({c,d,label,type})=>{const linked=(c.reminders||[]).filter(r=>d?r.deadlineId===d.id:true).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)),last=linked[0];return `<div class="list-row"><div><strong>Sinistro ${esc(c.claim)} · ${esc(label)}</strong><div class="meta">${esc(c.company)} · ${esc(c.insured)}${last?' · Ultimo sollecito: '+esc(last.status)+' '+esc(reminderDate(last.sentAt||last.updatedAt)):''}</div></div><button type="button" data-reminder-action="new" data-case-id="${esc(c.id)}" data-deadline-id="${esc(d?.id||'')}" data-reminder-type="${esc(type||'')}">Prepara sollecito</button></div>`;}).join('')||'<p class="empty-state">Nessuna attività urgente da verificare. Puoi preparare una bozza per qualsiasi pratica.</p>';
}
const reminderDialog=document.createElement('dialog');reminderDialog.id='reminderDialog';document.body.append(reminderDialog);
window.openReminder=function(caseId='',deadlineId='',reminderId='',suggestedType=''){
 if(!cases.length){alert('Crea prima una pratica.');return;}
 const initial=cases.find(c=>c.id===caseId)||cases[0],existing=initial.reminders?.find(r=>r.id===reminderId);
 if(reminderId&&!existing)return;
 let currentCase=initial,currentDeadline=initial.deadlines?.find(d=>d.id===deadlineId),activeId=existing?.id||'',isSent=existing?.status==='Inviato manualmente';
 const type=existing?.type||(reminderTypes.includes(suggestedType)?suggestedType:reminderFromDeadline(currentDeadline)),template=existing||reminderTemplate(initial,type,currentDeadline);
 reminderDialog.innerHTML=`<form class="modal" id="reminderForm"><div class="panel-head"><h3>${isSent?'Sollecito registrato':'Bozza di sollecito'}</h3><button type="button" class="icon-btn" id="closeReminder" aria-label="Chiudi">✕</button></div><p class="meta">Controlla destinatario e contenuto. Nessuna email viene inviata dal programma.</p><div class="form-grid"><label>Pratica / sinistro<select name="caseId" id="reminderCase" ${existing||deadlineId?'disabled':''}>${cases.map(c=>`<option value="${esc(c.id)}" ${c.id===initial.id?'selected':''}>${esc(c.claim)} · ${esc(c.company)} · ${esc(c.insured)}</option>`).join('')}</select></label><label>Tipo sollecito<select name="type" id="reminderType" ${isSent?'disabled':''}>${options(reminderTypes,type)}</select></label>${field('recipientName','Nome / ufficio destinatario',existing?.recipientName||'')}${field('recipientEmail','Email destinatario (da verificare)',existing?.recipientEmail||'','email')}</div><label class="reminder-field">Oggetto<input name="subject" maxlength="500" required value="${esc(template.subject)}"></label><label class="reminder-field">Testo email<textarea name="body" rows="12" maxlength="20000" required>${esc(template.body)}</textarea></label><p id="reminderMessage" role="status" aria-live="polite"></p><div class="modal-actions"><button type="button" id="cancelReminder">Chiudi</button>${isSent?'':'<button type="button" id="regenerateReminder">Rigenera testo</button><button type="submit" class="primary">Salva bozza</button>'}<button type="button" id="copyReminder">Copia email</button>${isSent?'':'<button type="button" id="markReminderSent">Registra invio manuale</button>'}</div></form>`;
 reminderDialog.showModal();const form=document.querySelector('#reminderForm');
 const message=text=>document.querySelector('#reminderMessage').textContent=text;
 if(isSent)form.querySelectorAll('input,textarea').forEach(e=>e.readOnly=true);
 let savedSnapshot=existing?JSON.stringify({type:existing.type,recipientName:existing.recipientName,recipientEmail:existing.recipientEmail,subject:existing.subject,body:existing.body}):'';
 function readDraft(){const values=Object.fromEntries(new FormData(form));return {type:isSent?existing.type:values.type,recipientName:values.recipientName.trim(),recipientEmail:values.recipientEmail.trim(),subject:values.subject.trim(),body:values.body.trim()};}
 function refreshHistory(){renderReminders();if(document.querySelector('#caseDialog').open)openCase(currentCase.id);}
 function storeDraft(){
  if(isSent)return existing;if(!form.reportValidity())return null;
  try{const values=readDraft(),now=new Date().toISOString(),old=currentCase.reminders?.find(r=>r.id===activeId),r=cleanReminder({...values,id:activeId||crypto.randomUUID(),deadlineId:old?.deadlineId||currentDeadline?.id||'',status:'Bozza',createdAt:old?.createdAt||now,updatedAt:now,sentAt:''});
   const next=old?currentCase.reminders.map(x=>x.id===r.id?r:x):[...(currentCase.reminders||[]),r];if(!reminderCommit(currentCase,next))return null;
   activeId=r.id;savedSnapshot=JSON.stringify(values);document.querySelector('#reminderCase').disabled=true;refreshHistory();message('Bozza salvata. Nessuna email inviata.');return r;
  }catch(e){message(e.message);return null;}
 }
 function closeEditor(){if(!isSent&&JSON.stringify(readDraft())!==savedSnapshot&&!confirm('Chiudere senza salvare le modifiche alla bozza?'))return;reminderDialog.close();}
 document.querySelector('#closeReminder').onclick=document.querySelector('#cancelReminder').onclick=closeEditor;
 reminderDialog.oncancel=ev=>{ev.preventDefault();closeEditor();};
 document.querySelector('#reminderCase').onchange=ev=>{if(!confirm('Cambiare pratica e rigenerare oggetto e testo? Le modifiche al testo attuale saranno sostituite.')){ev.target.value=currentCase.id;return;}currentCase=cases.find(c=>c.id===ev.target.value);currentDeadline=null;form.elements.recipientName.value='';form.elements.recipientEmail.value='';const t=reminderTemplate(currentCase,form.elements.type.value);form.elements.subject.value=t.subject;form.elements.body.value=t.body;message('Pratica e testo aggiornati. Controlla il destinatario prima di salvare.');};
 if(!isSent){document.querySelector('#regenerateReminder').onclick=()=>{if(!confirm('Sostituire oggetto e testo con il modello della pratica selezionata?'))return;const t=reminderTemplate(currentCase,form.elements.type.value,currentDeadline);form.elements.subject.value=t.subject;form.elements.body.value=t.body;message('Testo rigenerato. Controllalo e salva la bozza.');};form.onsubmit=ev=>{ev.preventDefault();storeDraft();};}
 else form.onsubmit=ev=>ev.preventDefault();
 document.querySelector('#copyReminder').onclick=async()=>{const r=storeDraft();if(!r)return;const text=`${r.recipientEmail?'A: '+r.recipientEmail+'\n':''}Oggetto: ${r.subject}\n\n${r.body}`;
  try{if(!navigator.clipboard?.writeText)throw Error('Clipboard non disponibile');await navigator.clipboard.writeText(text);message('Email copiata. Incollala nella tua posta e controllala prima dell’invio.');}catch{form.elements.body.focus();form.elements.body.select();message('Copia automatica non disponibile: testo selezionato, premi Ctrl+C. Copia anche oggetto e destinatario nei campi della tua email.');}
 };
 if(!isSent)document.querySelector('#markReminderSent').onclick=()=>{
  if(!form.reportValidity())return;let values;try{values=readDraft();}catch(e){message(e.message);return;}
  if(!values.recipientEmail||!validReminderEmail(values.recipientEmail)){message('Indica e verifica l’email del destinatario prima di registrare l’invio.');return;}
  if(!confirm(`Hai già inviato questa email dalla tua posta a ${values.recipientEmail}?\n\nQuesta azione registra la tua dichiarazione e non invia l’email.`))return;
  const draft=storeDraft();if(!draft)return;const now=new Date().toISOString(),sent=cleanReminder({...draft,status:'Inviato manualmente',sentAt:now,updatedAt:now});
  if(!reminderCommit(currentCase,currentCase.reminders.map(r=>r.id===draft.id?sent:r)))return;
  reminderDialog.close();refreshHistory();
 };
};
function handleReminderAction(ev){const b=ev.target.closest('[data-reminder-action]');if(!b)return;ev.preventDefault();const c=cases.find(c=>c.id===b.dataset.caseId);if(!c)return;
 if(b.dataset.reminderAction==='new'){openReminder(c.id,b.dataset.deadlineId||'','',b.dataset.reminderType||'');return;}
 const r=c.reminders?.find(r=>r.id===b.dataset.reminderId);if(!r)return;
 if(b.dataset.reminderAction==='open')openReminder(c.id,'',r.id);
 if(b.dataset.reminderAction==='delete'&&r.status==='Bozza'&&confirm('Eliminare questa bozza di sollecito?')){if(reminderCommit(c,c.reminders.filter(x=>x.id!==r.id))){renderReminders();if(document.querySelector('#caseDialog').open)openCase(c.id);}}
}
reminderSection.addEventListener('click',handleReminderAction);document.querySelector('#newReminder').onclick=()=>openReminder();
for(const id of ['reminderSearch','reminderStatus'])document.querySelector('#'+id).addEventListener(id==='reminderSearch'?'input':'change',renderReminders);
const openCaseBeforeReminders=window.openCase;
window.openCase=function(id){openCaseBeforeReminders(id);const c=cases.find(c=>c.id===id);if(!c)return;const panel=document.createElement('div');panel.className='section-card';panel.id='caseReminderPanel';panel.innerHTML=`<div class="section-head"><h4>Solleciti e bozze</h4><button type="button" id="addCaseReminder">+ Sollecito</button></div>`+reminderRowsHTML((c.reminders||[]).map(r=>({c,r})).sort((a,b)=>b.r.updatedAt.localeCompare(a.r.updatedAt)));document.querySelector('#caseModalBody .case-tabs').append(panel);panel.addEventListener('click',handleReminderAction);document.querySelector('#addCaseReminder').onclick=()=>openReminder(c.id);};
const renderAllBeforeReminders=renderAll;window.renderAll=function(){renderAllBeforeReminders();renderReminders();};
renderReminders();
