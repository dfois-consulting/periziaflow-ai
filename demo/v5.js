/* PeriziaFlow V1.5 — fascicoli e liquidazioni */
const categories = ['Da classificare','RCA','RCT','RCO','RC professionale','Incendio','Furto','Multirischi property','Infortuni','Altro'];
const damageTypes = ['Da classificare','Danni a cose','Lesioni','Danni da acqua','Evento atmosferico','Incendio','Furto','Cristalli','Altro'];
const folders = ['01-Incarico e polizza','02-Documenti ricevuti','03-Foto e sopralluogo','04-Preventivi e fatture','05-Perizia','06-Corrispondenza','07-Liquidazione'];
const states = ['Da assegnare','Assegnata','Cliente da contattare','Sopralluogo fissato','Sopralluogo effettuato','In attesa documentazione','Perizia in lavorazione','Da verificare','Perizia da inviare','Chiusa'];
const today = () => {const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
function isoDate(v){if(!v)return '';if(/^\d{4}-\d{2}-\d{2}$/.test(v))return v;const a=v.split('/');return a.length===3?`${a[2]}-${a[1]}-${a[0]}`:'';}
function showDate(v){return v ? isoDate(v).split('-').reverse().join('/') : '—';}
function dayDiff(a,b){return Math.round((Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z'))/86400000);}
const options=(items,value)=>items.map(x=>`<option value="${esc(x)}" ${x===value?'selected':''}>${esc(x)}</option>`).join('');
let selectedCase='', selectedFolder='';
// Existing records keep their estimates; no historical amount becomes a liquidation.
cases.forEach(c=>{c.category ||= ['Incendio','Furto'].includes(c.type)?c.type:'Da classificare';c.openedAt ||= isoDate(c.created);c.liquidationStatus ||= 'Non liquidato';});
if(!localStorage.getItem('pf_cases') && !localStorage.getItem('pf_v5_demo')){
  const samples=[['RCA',3200,2800,2600],['RCA',5100,4500,4200],['RCT',2100,1800,1500],['RCT',900,0,0]];
  samples.forEach((s,i)=>cases.push({id:`PR-2026-DEMO${i+1}`,claim:`DEMO-${i+1}`,company:i<2?'Generali':'Allianz',insured:`Caso dimostrativo ${i+1}`,category:s[0],type:'Danni a cose',expert:'Luca Bianchi',status:'Chiusa',days:12+i,created:'01/09/2026',openedAt:'2026-09-01',closedAt:'2026-09-15',amount:s[2],requestedAmount:s[1],assessedAmount:s[2],liquidatedAmount:s[3],liquidationStatus:'Definitiva',liquidatedAt:`2026-09-${20+i}`}));
  localStorage.setItem('pf_v5_demo','1');
}
save();
let storedDocs;
try{storedDocs=JSON.parse(localStorage.getItem('pf_documents_v5')||'null');}catch{}
if(Array.isArray(storedDocs))documents.splice(0,documents.length,...storedDocs);
function inferFolder(d){return /fot/i.test(d.type)?folders[2]:/preventiv|fattur/i.test(d.type)?folders[3]:/relaz|perizia/i.test(d.type)?folders[4]:/incarico/i.test(d.type)?folders[0]:folders[1];}
documents.forEach((d,i)=>{d.id ||= `legacy-${i}`;d.folder ||= inferFolder(d);});
function saveDocs(){localStorage.setItem('pf_documents_v5',JSON.stringify(documents));}
const dbPromise = new Promise((resolve,reject)=>{const r=indexedDB.open('PeriziaFlowFiles',1);r.onupgradeneeded=()=>r.result.createObjectStore('files');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
dbPromise.catch(()=>{});
async function blobStore(mode,key,value){const db=await dbPromise;return new Promise((resolve,reject)=>{const tx=db.transaction('files',mode);const s=tx.objectStore('files');const r=mode==='readonly'?s.get(key):s.put(value,key);tx.oncomplete=()=>resolve(r.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
const notice=document.createElement('div');notice.className='prototype-notice';notice.textContent='Prototipo locale · Dati dimostrativi. Pratiche e allegati salvati solo in questo browser; nessuna sincronizzazione con compagnie o email.';document.querySelector('.main').prepend(notice);

// Single validated editor for existing and new practices.
const editDialog=document.createElement('dialog');editDialog.id='editDialog';document.body.append(editDialog);
function field(name,label,value='',type='text',required=false){return `<label>${label}<input name="${name}" type="${type}" value="${esc(value??'')}" ${type==='number'?'min="0" step="0.01"':''} ${required?'required':''}></label>`;}
window.editCase=function(id){
 const c=cases.find(x=>x.id===id)||{category:'Da classificare',type:'Da classificare',status:'Da assegnare',openedAt:today(),liquidationStatus:'Non liquidato'};
 document.querySelector('#caseDialog').close();
 editDialog.innerHTML=`<form class="modal" id="caseEditor"><div class="panel-head"><h3>${id?'Modifica pratica':'Nuova pratica'}</h3><button type="button" class="icon-btn" onclick="document.querySelector('#editDialog').close()">✕</button></div>
 <div class="form-grid">
 ${field('claim','Numero sinistro',c.claim,'text',true)}${field('company','Compagnia',c.company,'text',true)}${field('insured','Assicurato',c.insured,'text',true)}
 <label>Categoria / garanzia<select name="category">${options(categories,c.category)}</select></label>
 <label>Tipo di danno<select name="type">${options([...new Set([...damageTypes,c.type])],c.type)}</select></label>
 ${field('expert','Perito',c.expert)}<label>Stato pratica<select name="status">${options(states,c.status)}</select></label>
 ${field('openedAt','Data apertura incarico',c.openedAt,'date',true)}${field('closedAt','Data chiusura perizia',c.closedAt,'date')}
 ${field('requestedAmount','Importo richiesto (€)',c.requestedAmount,'number')}${field('assessedAmount','Importo periziato (€)',c.assessedAmount,'number')}${field('amount','Stima del danno (€)',c.amount,'number')}
 <label>Stato liquidazione<select name="liquidationStatus">${options(['Non liquidato','Parziale','Definitiva'],c.liquidationStatus)}</select></label>
 ${field('liquidatedAmount','Totale liquidato, acconti + saldo (€)',c.liquidatedAmount,'number')}${field('liquidatedAt','Data liquidazione definitiva',c.liquidatedAt,'date')}
 </div><p class="meta">Lascia vuoti gli importi sconosciuti. Zero indica un importo confermato. La liquidazione è separata dalla chiusura della perizia.</p><p id="editorError" role="alert" class="error"></p>
 <div class="modal-actions"><button type="button" onclick="document.querySelector('#editDialog').close()">Annulla</button><button class="primary" type="submit">Salva pratica</button></div></form>`;
 editDialog.showModal();
 document.querySelector('#caseEditor').onsubmit=ev=>{
  ev.preventDefault();const f=ev.target;if(!f.reportValidity())return;const data=Object.fromEntries(new FormData(f));
  const error=msg=>document.querySelector('#editorError').textContent=msg;
  ['claim','company','insured','expert'].forEach(k=>data[k]=data[k].trim());
  if(!data.claim||!data.company||!data.insured)return error('Compila numero sinistro, compagnia e assicurato.');
  if(cases.some(x=>x.id!==id&&x.company.toLowerCase()===data.company.toLowerCase()&&x.claim.toLowerCase()===data.claim.toLowerCase()))return error('Esiste già una pratica con questo numero sinistro per la compagnia.');
  for(const k of ['requestedAmount','assessedAmount','amount','liquidatedAmount']){data[k]=data[k]===''?null:Number(data[k]);if(data[k]!==null&&(!Number.isFinite(data[k])||data[k]<0))return error('Gli importi devono essere numeri positivi o zero.');}
  if(data.closedAt&&data.closedAt<data.openedAt)return error('La chiusura non può precedere l’apertura.');
  if(data.status==='Chiusa'&&!data.closedAt)return error('Indica la data di chiusura della perizia.');
  if(data.liquidationStatus==='Definitiva'&&(data.liquidatedAmount===null||!data.liquidatedAt))return error('Per una liquidazione definitiva indica importo (anche zero) e data.');
  if(data.liquidatedAt&&data.liquidatedAt<data.openedAt)return error('La liquidazione non può precedere l’apertura.');
  if(data.liquidationStatus==='Non liquidato'&&(data.liquidatedAmount!==null||data.liquidatedAt))return error('Scegli Parziale o Definitiva per registrare una liquidazione, oppure svuota importo e data.');
  if(data.liquidationStatus==='Parziale'&&data.liquidatedAmount===null)return error('Indica il totale liquidato parziale.');
  if(data.liquidationStatus!=='Definitiva')data.liquidatedAt='';
  data.created=showDate(data.openedAt);data.days=Math.max(0,dayDiff(data.openedAt,data.closedAt||today()));
  if(id)Object.assign(c,data);else {data.id=`PR-${new Date().getFullYear()}-${crypto.randomUUID().slice(0,8)}`;cases.push(data);}
  save();populateFilters();refreshReportFilters();renderAll();editDialog.close();openCase(id||data.id);
 };
};
// Replace old new-case handler while preserving the surrounding interface.
const newButton=document.querySelector('#newCaseBtn');const replacement=newButton.cloneNode(true);newButton.replaceWith(replacement);replacement.onclick=()=>editCase('');
const oldOpenCase=window.openCase;
window.openCase=function(id){oldOpenCase(id);const c=cases.find(x=>x.id===id);if(!c)return;
 const panel=document.createElement('div');panel.className='section-card';
 panel.innerHTML=`<div class="section-head"><h4>Liquidazione e classificazione</h4><button type="button" class="secondary" onclick="editCase('${c.id}')">Modifica dati</button></div><div class="detail-grid">
 ${[['Categoria',c.category],['Tipo di danno',c.type],['Richiesto',c.requestedAmount==null?'—':euro(c.requestedAmount)],['Periziato',c.assessedAmount==null?'—':euro(c.assessedAmount)],['Liquidato totale',c.liquidatedAmount==null?'—':euro(c.liquidatedAmount)],['Stato liquidazione',c.liquidationStatus],['Data liquidazione definitiva',showDate(c.liquidatedAt)],['Chiusura perizia',showDate(c.closedAt)]].map(([k,v])=>`<div class="detail-box"><span>${k}</span><strong>${esc(v)}</strong></div>`).join('')}</div>`;
 document.querySelector('#caseModalBody').insertBefore(panel,document.querySelector('.case-tabs'));
 const upload=document.querySelector('.upload-row');upload.insertAdjacentHTML('afterbegin',`<label>Sottocartella<select id="folder-${id}">${options(folders,folders[1])}</select></label>`);
 document.querySelector(`#upload-${id}`).multiple=true;
};
window.changeStatus=id=>editCase(id);
const oldCreate=window.createFromAssignment;
window.createFromAssignment=function(i){const a=assignments[i];if(cases.some(c=>c.company===a.company&&c.claim===a.claim)){alert('Incarico già presente.');return;}oldCreate(i);const c=cases.at(-1);c.category=['Incendio','Furto'].includes(c.type)?c.type:'Da classificare';c.openedAt=today();c.created=showDate(c.openedAt);c.liquidationStatus='Non liquidato';save();refreshReportFilters();renderDocuments();};

// Archive: a stable case identity, folders and optional cross-case search.
const archiveHead=document.createElement('div');archiveHead.className='toolbar';archiveHead.innerHTML=`<label>Cerca fascicolo o file<input type="search" id="docSearch" placeholder="Sinistro, compagnia, nominativo o file"></label>`;document.querySelector('#documentsList').before(archiveHead);document.querySelector('#docSearch').oninput=()=>{selectedCase='';selectedFolder='';renderDocuments();};
window.openFolder=function(id,folder=''){selectedCase=id;selectedFolder=folder;renderDocuments();};
window.renderDocuments=function(){
 const target=document.querySelector('#documentsList');const q=document.querySelector('#docSearch').value.toLowerCase().trim();
 if(!selectedCase){
  const rows=cases.filter(c=>[c.id,c.claim,c.company,c.insured].join(' ').toLowerCase().includes(q)||documents.some(d=>d.caseId===c.id&&d.name.toLowerCase().includes(q)));
  target.innerHTML=`<div class="meta">${rows.length} fascicoli · Una cartella per pratica / sinistro</div><div class="folder-grid">${rows.map(c=>{const ds=documents.filter(d=>d.caseId===c.id);const dates=ds.map(d=>isoDate(d.date)).filter(Boolean).sort();return `<button class="folder-card" onclick="openFolder('${c.id}')"><strong>📁 Sinistro ${esc(c.claim)}</strong><span>${esc(c.company)} · ${esc(c.insured)}</span><small>${esc(c.id)} · ${ds.length} documenti</small><small>Ultimo aggiornamento: ${showDate(dates.at(-1))}</small></button>`;}).join('')}</div>`;return;
 }
 const c=cases.find(x=>x.id===selectedCase);if(!c){selectedCase='';renderDocuments();return;}
 const ds=documents.filter(d=>d.caseId===c.id);
 target.innerHTML=`<div class="back-strip"><button onclick="openFolder('')">← Tutti i fascicoli</button><button onclick="backToCase('${c.id}')">Apri pratica</button></div><h3>Sinistro ${esc(c.claim)} · ${esc(c.company)} · ${esc(c.insured)}</h3><p class="meta">${esc(c.id)} · ${ds.length} documenti</p>
 <div class="folder-grid">${folders.map(f=>`<button class="folder-card ${selectedFolder===f?'selected':''}" onclick="openFolder('${c.id}','${f}')"><strong>📁 ${esc(f)}</strong><small>${ds.filter(d=>d.folder===f).length} documenti</small></button>`).join('')}</div>
 <div class="upload-row"><label>Sottocartella<select id="archiveFolder">${options(folders,selectedFolder||folders[1])}</select></label><input id="archiveUpload" type="file" multiple><button class="primary" id="archiveUploadBtn">Carica file</button></div>
 <h4>${esc(selectedFolder||'Tutti i documenti del fascicolo')}</h4>${ds.filter(d=>!selectedFolder||d.folder===selectedFolder).map(d=>`<div class="list-row"><div><strong>${esc(d.name)}</strong><div class="meta">${esc(d.folder)} · ${showDate(d.date)} · ${d.blobKey?'File locale':'Esempio dimostrativo'}</div></div><button class="secondary" onclick="openDocument('${c.id}',${ds.indexOf(d)})">Apri</button></div>`).join('')||'<p class="empty-state">Nessun documento in questa sottocartella.</p>'}`;
 document.querySelector('#archiveUploadBtn').onclick=()=>storeUpload(c.id,document.querySelector('#archiveUpload'),document.querySelector('#archiveFolder').value,false);
};
window.goToDocuments=function(id){document.querySelector('#caseDialog').close();document.querySelector('[data-view="documenti"]').click();document.querySelector('#docSearch').value='';openFolder(id);};
async function storeUpload(id,input,folder,fromCase){
 if(!input.files.length){alert('Seleziona almeno un file.');return;}
 const files=[...input.files];const button=fromCase?input.parentElement.querySelector('button'):document.querySelector('#archiveUploadBtn');button.disabled=true;
 try{for(const f of files){const key=crypto.randomUUID();await blobStore('readwrite',key,f);const d={id:key,blobKey:key,name:f.name,caseId:id,folder,type:'File caricato',date:today(),size:f.size};documents.unshift(d);try{saveDocs();}catch(e){documents.shift();throw e;}}
 renderDocuments();if(fromCase)openCase(id);
 }catch(e){alert('Caricamento non completato: '+e.message+'. Verifica lo spazio disponibile e i permessi del browser.');}finally{button.disabled=false;}
}
window.uploadDocument=id=>storeUpload(id,document.querySelector(`#upload-${id}`),document.querySelector(`#folder-${id}`).value,true);
const demoOpen=window.openDocument;
window.openDocument=async function(id,idx){const d=documents.filter(x=>x.caseId===id)[idx];if(!d)return;if(!d.blobKey){demoOpen(id,idx);return;}
 try{const file=await blobStore('readonly',d.blobKey);if(!file)throw Error('File non disponibile in questo browser.');const url=URL.createObjectURL(file);const a=document.createElement('a');a.href=url;a.download=d.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}catch(e){alert(e.message);}
};
document.querySelector('[data-view="documenti"]').addEventListener('click',()=>{selectedCase='';selectedFolder='';renderDocuments();});

// Reports: liquidations counted once per case, final only, explicit zero included.
const reportPanel=document.createElement('div');reportPanel.className='panel';reportPanel.innerHTML=`<div class="panel-head"><h3>Medie di liquidazione</h3><button id="exportLiquidations">Esporta CSV</button></div>
 <div class="toolbar report-filters"><label>Dal<input type="date" id="rFrom"></label><label>Al<input type="date" id="rTo"></label><label>Compagnia<select id="rCompany"></select></label><label>Categoria<select id="rCategory"></select></label><label>Danno<select id="rDamage"></select></label><label>Perito<select id="rExpert"></select></label></div>
 <p class="meta">Periodo riferito alla data della liquidazione definitiva. Acconti e saldo sono registrati come totale del sinistro. Medie sullo storico presente, non benchmark di mercato.</p><p id="reportNotice" role="status"></p><div class="cards" id="liquidationCards"></div>
 <div class="table-wrap"><table><thead><tr><th>Categoria</th><th>Danno</th><th>Sinistri definitivi</th><th>Media liquidata</th><th>Mediana</th><th>Richiesta media (n)</th><th>Periziato medio (n)</th><th>Giorni medi (n)</th></tr></thead><tbody id="liquidationTable"></tbody></table></div>`;
document.querySelector('#reportCards').after(reportPanel);
function refreshReportFilters(){for(const [id,values] of [['rCompany',cases.map(c=>c.company)],['rCategory',categories],['rDamage',[...damageTypes,...cases.map(c=>c.type)]],['rExpert',cases.map(c=>c.expert)]]){const el=document.getElementById(id);const val=el.value;el.innerHTML='<option value="">Tutti</option>'+options([...new Set(values)].filter(Boolean).sort(),val);}}
function getReportRows(){const val=id=>document.getElementById(id).value;const from=val('rFrom'),to=val('rTo');if(from&&to&&from>to)return [];
 return cases.filter(c=>c.liquidationStatus==='Definitiva'&&Number.isFinite(c.liquidatedAmount)&&c.liquidatedAmount>=0&&c.liquidatedAt&&(!from||c.liquidatedAt>=from)&&(!to||c.liquidatedAt<=to)&&(!val('rCompany')||c.company===val('rCompany'))&&(!val('rCategory')||c.category===val('rCategory'))&&(!val('rDamage')||c.type===val('rDamage'))&&(!val('rExpert')||c.expert===val('rExpert')));
}
function mean(arr){return arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:null;}
function summary(rows){const money=k=>rows.map(c=>c[k]).filter(x=>Number.isFinite(x));const amounts=money('liquidatedAmount').sort((a,b)=>a-b);const mid=Math.floor(amounts.length/2);const times=rows.filter(c=>c.openedAt&&c.liquidatedAt>=c.openedAt).map(c=>dayDiff(c.openedAt,c.liquidatedAt));return {n:rows.length,avg:mean(amounts),median:amounts.length?(amounts.length%2?amounts[mid]:(amounts[mid-1]+amounts[mid])/2):null,requested:mean(money('requestedAmount')),rn:money('requestedAmount').length,assessed:mean(money('assessedAmount')),an:money('assessedAmount').length,days:mean(times),dn:times.length};}
let reportGroups=[];
const baseReports=renderReports;
window.renderReports=function(){baseReports();const rows=getReportRows();const all=summary(rows);const by=new Map();for(const c of rows){const key=JSON.stringify([c.category,c.type]);if(!by.has(key))by.set(key,[]);by.get(key).push(c);}reportGroups=[...by].map(([k,v])=>({key:JSON.parse(k),...summary(v)}));
 const from=document.querySelector('#rFrom').value,to=document.querySelector('#rTo').value;
 document.querySelector('#reportNotice').textContent=from&&to&&from>to?'Intervallo non valido: la data finale precede quella iniziale.':`${rows.length} sinistri definitivi inclusi. Le liquidazioni parziali e gli importi mancanti sono esclusi; gli zeri confermati sono inclusi.`;
 const fmt=x=>x===null?'—':euro(x);document.querySelector('#liquidationCards').innerHTML=[['Sinistri liquidati',all.n],['Media liquidata',fmt(all.avg)],['Mediana liquidata',fmt(all.median)],['Giorni alla liquidazione',all.days===null?'—':all.days.toFixed(1)+' gg']].map(([k,v])=>`<div class="card"><div class="label">${k}</div><div class="value">${v}</div></div>`).join('');
 document.querySelector('#liquidationTable').innerHTML=reportGroups.map(g=>`<tr><td>${esc(g.key[0])}</td><td>${esc(g.key[1])}</td><td>${g.n}${g.n<5?'<div class="meta">Campione ridotto</div>':''}</td><td>${fmt(g.avg)}</td><td>${fmt(g.median)}</td><td>${fmt(g.requested)} (${g.rn})</td><td>${fmt(g.assessed)} (${g.an})</td><td>${g.days===null?'—':g.days.toFixed(1)} (${g.dn})</td></tr>`).join('')||'<tr><td colspan="8">Nessuna liquidazione definitiva con importo e data per questi filtri.</td></tr>';
};
reportPanel.querySelectorAll('input,select').forEach(el=>el.onchange=renderReports);
document.querySelector('#exportLiquidations').onclick=()=>{const rows=[['Categoria','Danno','Sinistri','Media liquidata','Mediana','Richiesta media','N richieste','Periziato medio','N periziati','Giorni medi','N tempi'],...reportGroups.map(g=>[...g.key,g.n,g.avg,g.median,g.requested,g.rn,g.assessed,g.an,g.days,g.dn])];const cell=v=>'"'+String(v??'').replace(/^[=+@-]/,"'$&").replace(/"/g,'""')+'"';const blob=new Blob(['\ufeff'+rows.map(r=>r.map(cell).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='PeriziaFlow_Medie_Liquidazione.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
refreshReportFilters();renderAll();
