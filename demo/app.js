
const seedCases = [
  {id:"PR-2026-0001", claim:"45687322", company:"Generali", insured:"Mario Rossi", type:"Danni da acqua", expert:"Luca Bianchi", status:"In attesa documentazione", days:12, amount:3850, created:"12/09/2026"},
  {id:"PR-2026-0002", claim:"77893114", company:"Allianz", insured:"Laura Esposito", type:"Evento atmosferico", expert:"Marco Riva", status:"Perizia in lavorazione", days:7, amount:6200, created:"17/09/2026"},
  {id:"PR-2026-0003", claim:"99321007", company:"Unipol", insured:"Paolo Conti", type:"Incendio", expert:"Sara Villa", status:"Da verificare", days:4, amount:14200, created:"20/09/2026"},
  {id:"PR-2026-0004", claim:"78124568", company:"Generali", insured:"Anna Colombo", type:"RC", expert:"", status:"Da assegnare", days:1, amount:0, created:"23/09/2026"},
  {id:"PR-2026-0005", claim:"66220984", company:"Zurich", insured:"Enrico Sala", type:"Furto", expert:"Davide Neri", status:"Cliente da contattare", days:3, amount:5300, created:"21/09/2026"},
  {id:"PR-2026-0006", claim:"88712044", company:"Allianz", insured:"Chiara Romano", type:"Danni da acqua", expert:"Luca Bianchi", status:"Chiusa", days:9, amount:2780, created:"14/09/2026"},
  {id:"PR-2026-0007", claim:"55018221", company:"Unipol", insured:"Stefano Greco", type:"Evento atmosferico", expert:"Marco Riva", status:"Perizia da inviare", days:6, amount:8400, created:"18/09/2026"}
];

const experts = [
  {name:"Luca Bianchi", zone:"Milano / Monza", spec:"Danni acqua / RC", open:18, avg:"4,2 gg", availability:"Alta"},
  {name:"Marco Riva", zone:"Milano / Brianza", spec:"Eventi atmosferici", open:26, avg:"5,1 gg", availability:"Media"},
  {name:"Sara Villa", zone:"Lombardia", spec:"Incendi / Complessi", open:14, avg:"6,0 gg", availability:"Alta"},
  {name:"Davide Neri", zone:"Milano Ovest", spec:"Furti / RC", open:21, avg:"4,8 gg", availability:"Media"}
];

const assignments = [
  {company:"Generali", claim:"78564521", insured:"Franco Sala", city:"Monza", type:"Danni da acqua", confidence:98},
  {company:"Allianz", claim:"99124567", insured:"Marta Ferri", city:"Sesto San Giovanni", type:"Evento atmosferico", confidence:95},
  {company:"Unipol", claim:"88211034", insured:"Gianni Moretti", city:"Desio", type:"RC", confidence:92}
];

const emails = [
  {subject:"Sinistro 45687322 - documentazione integrativa", from:"cliente@example.it", class:"Nuova documentazione", caseId:"PR-2026-0001", time:"10:42"},
  {subject:"Richiesta integrazione pratica 99321007", from:"claims@compagnia.it", class:"Richiesta integrazione", caseId:"PR-2026-0003", time:"09:55"},
  {subject:"Nuovo incarico peritale 78564521", from:"incarichi@compagnia.it", class:"Nuovo incarico", caseId:"", time:"09:21"},
  {subject:"Fattura compensi settembre", from:"luca.bianchi@periti.it", class:"Fattura", caseId:"", time:"08:48"}
];

const documents = [
  {name:"Relazione_peritale_99321007.pdf", caseId:"PR-2026-0003", type:"Relazione", date:"24/09/2026"},
  {name:"Preventivo_riparazione_45687322.pdf", caseId:"PR-2026-0001", type:"Preventivo", date:"24/09/2026"},
  {name:"Foto_sopralluogo_77893114.zip", caseId:"PR-2026-0002", type:"Fotografie", date:"23/09/2026"},
  {name:"Verbale_RC_55018221.pdf", caseId:"PR-2026-0007", type:"Verbale", date:"23/09/2026"},
  {name:"Incarico_compagnia_45687322.pdf", caseId:"PR-2026-0001", type:"Incarico compagnia", date:"12/09/2026"},
  {name:"Foto_sopralluogo_45687322.zip", caseId:"PR-2026-0001", type:"Fotografie", date:"14/09/2026"}
];

const deadlines = [
  {caseId:"PR-2026-0001", text:"Documentazione cliente mancante", due:"Oggi", severity:"red"},
  {caseId:"PR-2026-0005", text:"Cliente non ancora contattato", due:"Oggi", severity:"orange"},
  {caseId:"PR-2026-0002", text:"Relazione da completare", due:"Domani", severity:"orange"},
  {caseId:"PR-2026-0007", text:"Perizia pronta da inviare", due:"Oggi", severity:"blue"}
];

const payments = [
  {expert:"Luca Bianchi", cases:12, amount:1680, invoice:"FT 88/2026", due:"30/09/2026", status:"Da pagare"},
  {expert:"Marco Riva", cases:16, amount:2340, invoice:"FT 41/2026", due:"02/10/2026", status:"Approvato"},
  {expert:"Sara Villa", cases:8, amount:1920, invoice:"FT 57/2026", due:"05/10/2026", status:"Da verificare"},
  {expert:"Davide Neri", cases:10, amount:1490, invoice:"FT 102/2026", due:"30/09/2026", status:"Pagamento predisposto"}
];

let cases = JSON.parse(localStorage.getItem("pf_cases") || "null") || seedCases;

const titles = {
  dashboard:["Dashboard","Panoramica operativa dell'agenzia"],
  pratiche:["Pratiche","Ricerca, filtri e gestione delle pratiche"],
  incarichi:["Nuovi incarichi","Incarichi estratti automaticamente da email o portali"],
  email:["Email","Classificazione e collegamento alle pratiche"],
  periti:["Periti","Carico di lavoro, zone e disponibilità"],
  documenti:["Documenti","Archivio documentale centralizzato"],
  scadenze:["Scadenze","Solleciti, ritardi e attività da completare"],
  compensi:["Compensi","Compensi fiduciari e stato pagamenti"],
  report:["Report","Indicatori operativi e amministrativi"]
};

function euro(v){ return new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR"}).format(v); }
function statusClass(s){
  if(["Chiusa","Pagato","Pagamento predisposto"].includes(s)) return "green";
  if(["Da assegnare","Da verificare","Da pagare"].includes(s)) return "red";
  if(["Cliente da contattare","In attesa documentazione","Approvato"].includes(s)) return "orange";
  return "blue";
}
function save(){ localStorage.setItem("pf_cases", JSON.stringify(cases)); }

function renderKPIs(){
  const open = cases.filter(c=>c.status!=="Chiusa").length;
  const unassigned = cases.filter(c=>c.status==="Da assegnare").length;
  const stalled = cases.filter(c=>c.days>7 && c.status!=="Chiusa").length;
  const toBill = cases.filter(c=>c.status==="Chiusa").length;
  const items = [
    ["Pratiche aperte",open,"Totale attualmente in lavorazione"],
    ["Da assegnare",unassigned,"Richiedono un perito"],
    ["Ferme > 7 giorni",stalled,"Da verificare con priorità"],
    ["Chiuse da fatturare",toBill,"Demo V1"]
  ];
  document.querySelector("#kpiCards").innerHTML = items.map(x=>`
    <div class="card"><div class="label">${x[0]}</div><div class="value">${x[1]}</div><div class="sub">${x[2]}</div></div>
  `).join("");

  document.querySelector("#todoList").innerHTML = deadlines.slice(0,4).map(d=>`
    <div class="list-row">
      <div><strong>${d.caseId}</strong><div class="meta">${d.text}</div></div>
      <span class="status ${d.severity}">${d.due}</span>
    </div>
  `).join("");

  document.querySelector("#criticalCases").innerHTML = cases
    .filter(c=>c.days>=6 && c.status!=="Chiusa")
    .sort((a,b)=>b.days-a.days)
    .slice(0,5)
    .map(c=>`
      <div class="list-row">
        <div><strong>${c.id}</strong> · ${c.insured}<div class="meta">${c.company} · ${c.status}</div></div>
        <span class="status ${c.days>7?'red':'orange'}">${c.days} gg</span>
      </div>
    `).join("");

  const activities = [
    "Perizia caricata su PR-2026-0003",
    "Email collegata automaticamente a PR-2026-0001",
    "Nuovo incarico rilevato: sinistro 78564521",
    "Pagamento predisposto per Davide Neri"
  ];
  document.querySelector("#activityFeed").innerHTML = activities.map((a,i)=>`
    <div class="list-row"><div>${a}<div class="meta">${["11:04","10:42","09:21","08:35"][i]}</div></div></div>
  `).join("");
}

function populateFilters(){
  const fill = (id, values) => {
    const el = document.querySelector(id);
    const first = el.options[0].outerHTML;
    el.innerHTML = first + [...new Set(values)].filter(Boolean).sort().map(v=>`<option>${v}</option>`).join("");
  };
  fill("#filterCompany", cases.map(c=>c.company));
  fill("#filterStatus", cases.map(c=>c.status));
  fill("#filterExpert", cases.map(c=>c.expert));
}

function renderCases(){
  const q = document.querySelector("#globalSearch").value.toLowerCase().trim();
  const fc = document.querySelector("#filterCompany").value;
  const fs = document.querySelector("#filterStatus").value;
  const fe = document.querySelector("#filterExpert").value;
  const rows = cases.filter(c=>{
    const blob = [c.id,c.claim,c.company,c.insured,c.type,c.expert,c.status].join(" ").toLowerCase();
    return (!q || blob.includes(q)) && (!fc || c.company===fc) && (!fs || c.status===fs) && (!fe || c.expert===fe);
  });
  document.querySelector("#casesTable").innerHTML = rows.map(c=>`
    <tr>
      <td><strong>${c.id}</strong></td>
      <td>${c.claim}</td>
      <td>${c.company}</td>
      <td>${c.insured}</td>
      <td>${c.type}</td>
      <td>${c.expert || "—"}</td>
      <td><span class="status ${statusClass(c.status)}">${c.status}</span></td>
      <td>${c.days}</td>
      <td><button class="link-btn" onclick="openCase('${c.id}')">Apri</button></td>
    </tr>
  `).join("") || `<tr><td colspan="9">Nessun risultato.</td></tr>`;
}

function renderAssignments(){
  document.querySelector("#assignmentsList").innerHTML = assignments.map((a,i)=>`
    <div class="assignment" id="assign-${i}">
      <strong>Nuovo incarico rilevato</strong>
      <div class="meta">Confidenza estrazione dati: ${a.confidence}%</div>
      <div class="assignment-grid">
        <div><span>Compagnia</span><strong>${a.company}</strong></div>
        <div><span>Sinistro</span><strong>${a.claim}</strong></div>
        <div><span>Assicurato</span><strong>${a.insured}</strong></div>
        <div><span>Comune</span><strong>${a.city}</strong></div>
        <div><span>Evento</span><strong>${a.type}</strong></div>
      </div>
      <div class="assignment-actions">
        <button class="primary" onclick="createFromAssignment(${i})">Crea pratica</button>
        <button class="secondary">Rivedi dati</button>
      </div>
    </div>
  `).join("");
}

function renderEmails(){
  document.querySelector("#emailList").innerHTML = emails.map(e=>`
    <div class="list-row">
      <div>
        <strong>${e.subject}</strong>
        <div class="meta">${e.from} · ${e.time}${e.caseId ? " · "+e.caseId : ""}</div>
      </div>
      <span class="status blue">${e.class}</span>
    </div>
  `).join("");
}

function renderExperts(){
  document.querySelector("#expertsTable").innerHTML = experts.map(e=>`
    <tr>
      <td><strong>${e.name}</strong></td>
      <td>${e.zone}</td>
      <td>${e.spec}</td>
      <td>${e.open}</td>
      <td>${e.avg}</td>
      <td><span class="status ${e.availability==="Alta"?"green":"orange"}">${e.availability}</span></td>
    </tr>
  `).join("");
}

function renderDocuments(){
  document.querySelector("#documentsList").innerHTML = documents.map(d=>`
    <div class="list-row">
      <div><strong>${d.name}</strong><div class="meta">${d.caseId} · ${d.date}</div></div>
      <span class="status gray">${d.type}</span>
    </div>
  `).join("");
}

function renderDeadlines(){
  document.querySelector("#deadlinesList").innerHTML = deadlines.map(d=>`
    <div class="list-row">
      <div><strong>${d.caseId}</strong><div class="meta">${d.text}</div></div>
      <span class="status ${d.severity}">${d.due}</span>
    </div>
  `).join("");
}

function renderFinance(){
  const total = payments.reduce((s,p)=>s+p.amount,0);
  const due = payments.filter(p=>p.status==="Da pagare").reduce((s,p)=>s+p.amount,0);
  document.querySelector("#financeCards").innerHTML = [
    ["Compensi mese",euro(total),"Totale registrato"],
    ["Da pagare",euro(due),"In attesa disposizione"],
    ["Fatture ricevute",payments.length,"Periti/fiduciari"],
    ["Pratiche collegate",payments.reduce((s,p)=>s+p.cases,0),"Totale competenze"]
  ].map(x=>`<div class="card"><div class="label">${x[0]}</div><div class="value">${x[1]}</div><div class="sub">${x[2]}</div></div>`).join("");

  document.querySelector("#paymentsTable").innerHTML = payments.map(p=>`
    <tr>
      <td><strong>${p.expert}</strong></td>
      <td>${p.cases}</td>
      <td>${euro(p.amount)}</td>
      <td>${p.invoice}</td>
      <td>${p.due}</td>
      <td><span class="status ${statusClass(p.status)}">${p.status}</span></td>
    </tr>
  `).join("");
}

function renderReports(){
  const open = cases.filter(c=>c.status!=="Chiusa").length;
  const closed = cases.filter(c=>c.status==="Chiusa").length;
  const avg = (cases.reduce((s,c)=>s+c.days,0)/cases.length).toFixed(1);
  const value = cases.reduce((s,c)=>s+(c.amount||0),0);
  document.querySelector("#reportCards").innerHTML = [
    ["Pratiche totali",cases.length,"Dataset demo"],
    ["Aperte",open,"In lavorazione"],
    ["Chiuse",closed,"Completate"],
    ["Valore danni",euro(value),"Somma stime demo"]
  ].map(x=>`<div class="card"><div class="label">${x[0]}</div><div class="value">${x[1]}</div><div class="sub">${x[2]}</div></div>`).join("");

  renderBars("#companyBars", groupCount(cases,"company"));
  renderBars("#statusBars", groupCount(cases,"status"));
}

function groupCount(arr,key){
  return arr.reduce((m,x)=>(m[x[key]]=(m[x[key]]||0)+1,m),{});
}
function renderBars(sel,obj){
  const max = Math.max(...Object.values(obj),1);
  document.querySelector(sel).innerHTML = Object.entries(obj).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`
    <div class="bar-row">
      <div class="line"><span>${k}</span><strong>${v}</strong></div>
      <div class="progress"><div style="width:${(v/max)*100}%"></div></div>
    </div>
  `).join("");
}

window.openCase = function(id){
  const c = cases.find(x=>x.id===id);
  if(!c) return;
  if(!Array.isArray(c.notes)) c.notes = [];

  const linkedDocs = documents.filter(d=>d.caseId===id);
  const linkedEmails = emails.filter(e=>e.caseId===id);

  const docsHtml = linkedDocs.length ? linkedDocs.map((d,idx)=>`
    <div class="doc-item">
      <div>
        <strong>${d.name}</strong>
        <div class="meta">${d.type} · ${d.date}</div>
      </div>
      <button class="link-btn" type="button" onclick="openDocument('${id}', ${idx})">Apri</button>
    </div>
  `).join("") : `<div class="empty-state">Nessun documento collegato.</div>`;

  const emailsHtml = linkedEmails.length ? linkedEmails.map(e=>`
    <div class="doc-item">
      <div>
        <strong>${e.subject}</strong>
        <div class="meta">${e.from} · ${e.time} · ${e.class}</div>
      </div>
      <button class="link-btn" type="button" onclick="openLinkedEmail('${e.subject.replace(/'/g,"\'")}')">Apri</button>
    </div>
  `).join("") : `<div class="empty-state">Nessuna email collegata.</div>`;

  const notesHtml = c.notes.length ? c.notes.slice().reverse().map(n=>`
    <div class="note-item">
      <div>${n.text}</div>
      <div class="meta">${n.date}</div>
    </div>
  `).join("") : `<div class="empty-state">Nessuna nota interna.</div>`;

  document.querySelector("#caseModalTitle").textContent = `${c.id} · ${c.insured}`;
  document.querySelector("#caseModalBody").innerHTML = `
    <div class="quick-actions">
      <button class="action-btn" type="button" onclick="editCase('${id}')">✏️ Modifica pratica</button>
      <button class="action-btn" type="button" onclick="assignExpert('${id}')">👤 Assegna perito</button>
      <button class="action-btn" type="button" onclick="addNote('${id}')">📝 Aggiungi nota</button>
      <button class="action-btn" type="button" onclick="changeStatus('${id}')">🔄 Cambia stato</button>
      <button class="action-btn" type="button" onclick="goToDocuments('${id}')">📎 Documenti</button>
      <button class="action-btn" type="button" onclick="goToEmails('${id}')">✉️ Email</button>
    </div>

    <div class="detail-grid">
      <div class="detail-box"><span>Numero sinistro</span><strong>${c.claim}</strong></div>
      <div class="detail-box"><span>Compagnia</span><strong>${c.company}</strong></div>
      <div class="detail-box"><span>Assicurato</span><strong>${c.insured}</strong></div>
      <div class="detail-box"><span>Tipologia</span><strong>${c.type}</strong></div>
      <div class="detail-box"><span>Perito</span><strong>${c.expert || "Non assegnato"}</strong></div>
      <div class="detail-box"><span>Stato</span><strong>${c.status}</strong></div>
      <div class="detail-box"><span>Data incarico</span><strong>${c.created}</strong></div>
      <div class="detail-box"><span>Giorni aperta</span><strong>${c.days}</strong></div>
      <div class="detail-box"><span>Importo stimato</span><strong>${euro(c.amount || 0)}</strong></div>
    </div>

    <div class="case-tabs">
      <div class="section-card">
        <div class="section-head">
          <div>
            <h4>Note interne</h4>
            <div class="meta">${c.notes.length} note presenti</div>
          </div>
          <button class="secondary" type="button" onclick="addNote('${id}')">+ Nota</button>
        </div>
        <div class="notes-list">${notesHtml}</div>
      </div>

      <div class="section-card">
        <div class="section-head">
          <div>
            <h4>Documentazione pratica</h4>
            <div class="meta">${linkedDocs.length} documenti collegati</div>
          </div>
          <button class="secondary" type="button" onclick="goToDocuments('${id}')">Vedi tutti</button>
        </div>
        <div class="docs-list">${docsHtml}</div>
        <div class="upload-row">
          <input id="upload-${id}" type="file" />
          <button class="primary" type="button" onclick="uploadDocument('${id}')">Carica documento</button>
        </div>
      </div>

      <div class="section-card">
        <div class="section-head">
          <div>
            <h4>Email collegate</h4>
            <div class="meta">${linkedEmails.length} email associate alla pratica</div>
          </div>
          <button class="secondary" type="button" onclick="goToEmails('${id}')">Vedi tutte</button>
        </div>
        <div class="docs-list">${emailsHtml}</div>
      </div>
    </div>
  `;
  document.querySelector("#caseDialog").showModal();
};

window.editCase = function(id){
  const c = cases.find(x=>x.id===id);
  if(!c) return;
  const insured = prompt("Assicurato", c.insured); if(insured===null) return;
  const type = prompt("Tipologia sinistro", c.type); if(type===null) return;
  const company = prompt("Compagnia", c.company); if(company===null) return;
  c.insured = insured.trim() || c.insured;
  c.type = type.trim() || c.type;
  c.company = company.trim() || c.company;
  save(); populateFilters(); renderAll(); openCase(id);
};

window.assignExpert = function(id){
  const c = cases.find(x=>x.id===id); if(!c) return;
  const names = experts.map((e,i)=>`${i+1}. ${e.name} — ${e.zone} — ${e.open} aperte`).join("\n");
  const raw = prompt(`Seleziona il perito inserendo il numero:\n\n${names}`, "");
  if(raw===null) return;
  const idx = Number(raw)-1;
  if(!Number.isInteger(idx) || !experts[idx]){ alert("Selezione non valida."); return; }
  c.expert = experts[idx].name;
  if(c.status==="Da assegnare") c.status="Assegnata";
  save(); populateFilters(); renderAll(); openCase(id);
};

window.addNote = function(id){
  const c = cases.find(x=>x.id===id); if(!c) return;
  if(!Array.isArray(c.notes)) c.notes=[];
  const text = prompt("Inserisci una nota interna:");
  if(text===null || !text.trim()) return;
  c.notes.push({text:text.trim(), date:new Date().toLocaleString("it-IT")});
  save(); openCase(id);
};

window.changeStatus = function(id){
  const c = cases.find(x=>x.id===id); if(!c) return;
  const statuses=["Da assegnare","Assegnata","Cliente da contattare","Sopralluogo fissato","Sopralluogo effettuato","In attesa documentazione","Perizia in lavorazione","Da verificare","Perizia da inviare","Chiusa"];
  const menu=statuses.map((s,i)=>`${i+1}. ${s}${s===c.status?" (attuale)":""}`).join("\n");
  const raw=prompt(`Cambia stato pratica:\n\n${menu}`,"");
  if(raw===null) return;
  const idx=Number(raw)-1;
  if(!Number.isInteger(idx)||!statuses[idx]){ alert("Selezione non valida."); return; }
  c.status=statuses[idx];
  save(); populateFilters(); renderAll(); openCase(id);
};

window.openDocument = function(caseId, idx){
  const linkedDocs = documents.filter(d=>d.caseId===caseId);
  const d = linkedDocs[idx];
  if(!d) return;

  const html = `
    <!DOCTYPE html>
    <html lang="it">
    <head>
      <meta charset="UTF-8">
      <title>${d.name}</title>
      <style>
        body{font-family:Arial,sans-serif;background:#f4f7fb;color:#172033;margin:0;padding:40px}
        .box{max-width:800px;margin:auto;background:white;border:1px solid #e5e7eb;border-radius:14px;padding:28px;box-shadow:0 8px 30px rgba(15,23,42,.08)}
        h1{font-size:24px;margin-top:0}
        .meta{color:#6b7280;margin:6px 0}
        .notice{margin-top:24px;padding:16px;border-radius:10px;background:#eff6ff;color:#1d4ed8}
      </style>
    </head>
    <body>
      <div class="box">
        <h1>${d.name}</h1>
        <div class="meta"><strong>Pratica:</strong> ${caseId}</div>
        <div class="meta"><strong>Tipo:</strong> ${d.type}</div>
        <div class="meta"><strong>Data:</strong> ${d.date}</div>
        <div class="notice">
          Demo V1: nella versione operativa qui verrà aperto il documento reale.
          Questa pagina è stata aperta in una nuova scheda per non perdere la pratica.
        </div>
      </div>
    </body>
    </html>
  `;
  const blob = new Blob([html], {type:"text/html"});
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener");
};

window.openLinkedEmail = function(subject){
  const e = emails.find(x=>x.subject===subject);
  if(!e) return;

  const html = `
    <!DOCTYPE html>
    <html lang="it">
    <head>
      <meta charset="UTF-8">
      <title>${e.subject}</title>
      <style>
        body{font-family:Arial,sans-serif;background:#f4f7fb;color:#172033;margin:0;padding:40px}
        .box{max-width:850px;margin:auto;background:white;border:1px solid #e5e7eb;border-radius:14px;padding:28px;box-shadow:0 8px 30px rgba(15,23,42,.08)}
        h1{font-size:22px;margin-top:0}
        .meta{color:#6b7280;margin:6px 0}
        .body{margin-top:24px;padding:18px;background:#fafafa;border-radius:10px;line-height:1.5}
      </style>
    </head>
    <body>
      <div class="box">
        <h1>${e.subject}</h1>
        <div class="meta"><strong>Da:</strong> ${e.from}</div>
        <div class="meta"><strong>Classificazione:</strong> ${e.class}</div>
        <div class="meta"><strong>Pratica:</strong> ${e.caseId || "Non collegata"}</div>
        <div class="body">
          Demo V1: nella versione operativa qui verrà visualizzato il messaggio originale.
          L'email è aperta in una nuova scheda per lasciare intatta la pratica.
        </div>
      </div>
    </body>
    </html>
  `;
  const blob = new Blob([html], {type:"text/html"});
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener");
};

window.uploadDocument = function(caseId){
  const input = document.querySelector(`#upload-${caseId}`);
  if(!input || !input.files.length){
    alert("Seleziona prima un file da caricare.");
    return;
  }
  const file = input.files[0];
  documents.unshift({
    name:file.name,
    caseId:caseId,
    type:"Documento caricato",
    date:"24/09/2026"
  });
  renderDocuments();
  openCase(caseId);
};

window.goToDocuments = function(caseId){
  document.querySelector("#caseDialog").close();
  document.querySelectorAll(".nav-item").forEach(x=>x.classList.remove("active"));
  document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));
  document.querySelector('[data-view="documenti"]').classList.add("active");
  document.querySelector("#documenti").classList.add("active");
  document.querySelector("#pageTitle").textContent = titles.documenti[0];
  document.querySelector("#pageSubtitle").textContent = `Documenti collegati a ${caseId}`;

  const rows = documents.filter(d=>d.caseId===caseId);
  document.querySelector("#documentsList").innerHTML = `
    <div class="back-strip">
      <button class="secondary" type="button" onclick="backToCase('${caseId}')">← Torna alla pratica</button>
    </div>
    ${rows.length ? rows.map((d,idx)=>`
      <div class="list-row">
        <div><strong>${d.name}</strong><div class="meta">${d.caseId} · ${d.date}</div></div>
        <div class="row-actions">
          <span class="status gray">${d.type}</span>
          <button class="link-btn" type="button" onclick="openDocument('${caseId}', ${idx})">Apri</button>
        </div>
      </div>
    `).join("") : `<div class="empty-state">Nessun documento collegato.</div>`}
  `;
};

window.goToEmails = function(caseId){
  document.querySelector("#caseDialog").close();
  document.querySelectorAll(".nav-item").forEach(x=>x.classList.remove("active"));
  document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));
  document.querySelector('[data-view="email"]').classList.add("active");
  document.querySelector("#email").classList.add("active");
  document.querySelector("#pageTitle").textContent = titles.email[0];
  document.querySelector("#pageSubtitle").textContent = `Email collegate a ${caseId}`;

  const rows = emails.filter(e=>e.caseId===caseId);
  document.querySelector("#emailList").innerHTML = `
    <div class="back-strip">
      <button class="secondary" type="button" onclick="backToCase('${caseId}')">← Torna alla pratica</button>
    </div>
    ${rows.length ? rows.map(e=>`
      <div class="list-row">
        <div>
          <strong>${e.subject}</strong>
          <div class="meta">${e.from} · ${e.time} · ${e.caseId}</div>
        </div>
        <div class="row-actions">
          <span class="status blue">${e.class}</span>
          <button class="link-btn" type="button" onclick="openLinkedEmail('${e.subject.replace(/'/g,"\'")}')">Apri</button>
        </div>
      </div>
    `).join("") : `<div class="empty-state">Nessuna email collegata.</div>`}
  `;
};

window.backToCase = function(caseId){
  document.querySelectorAll(".nav-item").forEach(x=>x.classList.remove("active"));
  document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));
  document.querySelector('[data-view="pratiche"]').classList.add("active");
  document.querySelector("#pratiche").classList.add("active");
  document.querySelector("#pageTitle").textContent = titles.pratiche[0];
  document.querySelector("#pageSubtitle").textContent = titles.pratiche[1];
  renderCases();
  setTimeout(()=>openCase(caseId), 50);
};

window.createFromAssignment = function(i){
  const a = assignments[i];
  const next = String(cases.length+1).padStart(4,"0");
  cases.push({
    id:`PR-2026-${next}`, claim:a.claim, company:a.company, insured:a.insured,
    type:a.type, expert:"", status:"Da assegnare", days:0, amount:0, created:"24/09/2026"
  });
  save(); populateFilters(); renderAll();
  document.querySelector(`#assign-${i}`).innerHTML = `<strong>Pratica creata correttamente</strong><div class="meta">Sinistro ${a.claim} inserito in PeriziaFlow.</div>`;
};

function addNewCase(ev){
  ev.preventDefault();
  const fd = new FormData(document.querySelector("#newCaseForm"));
  const next = String(cases.length+1).padStart(4,"0");
  cases.push({
    id:`PR-2026-${next}`,
    claim:fd.get("claim"),
    company:fd.get("company"),
    insured:fd.get("insured"),
    type:fd.get("type"),
    expert:fd.get("expert"),
    status:fd.get("status"),
    days:0,
    amount:0,
    created:"24/09/2026"
  });
  save();
  document.querySelector("#newCaseDialog").close();
  document.querySelector("#newCaseForm").reset();
  populateFilters(); renderAll();
}

function renderAll(){
  renderKPIs(); renderCases(); renderAssignments(); renderEmails(); renderExperts();
  renderDocuments(); renderDeadlines(); renderFinance(); renderReports();
}

document.querySelectorAll(".nav-item").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".nav-item").forEach(x=>x.classList.remove("active"));
    document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    const view = btn.dataset.view;
    document.querySelector("#"+view).classList.add("active");
    document.querySelector("#pageTitle").textContent = titles[view][0];
    document.querySelector("#pageSubtitle").textContent = titles[view][1];
  });
});

document.querySelector("#globalSearch").addEventListener("input",renderCases);
["#filterCompany","#filterStatus","#filterExpert"].forEach(id=>document.querySelector(id).addEventListener("change",renderCases));
document.querySelector("#resetFilters").addEventListener("click",()=>{
  ["#filterCompany","#filterStatus","#filterExpert"].forEach(id=>document.querySelector(id).value="");
  renderCases();
});
document.querySelector("#newCaseBtn").addEventListener("click",()=>document.querySelector("#newCaseDialog").showModal());
document.querySelector("#saveNewCase").addEventListener("click",addNewCase);

populateFilters();
renderAll();
