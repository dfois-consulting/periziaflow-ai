/* XLSX import, local only. No external service or dependency. */
const importFields=[
 ['claim','Numero sinistro',true,['sinistro','numero sinistro','n sinistro','claim']],
 ['company','Compagnia',true,['compagnia','mandante','company']],
 ['insured','Assicurato',true,['assicurato','danneggiato','insured']],
 ['category','Categoria',false,['categoria','garanzia','ramo']],
 ['type','Tipo di danno',false,['tipo di danno','tipologia','tipo danno']],
 ['expert','Perito',false,['perito','fiduciario']],
 ['status','Stato pratica',false,['stato pratica','stato']],
 ['openedAt','Data apertura incarico',true,['data apertura incarico','data apertura','data incarico']],
 ['closedAt','Data chiusura perizia',false,['data chiusura perizia','data chiusura']],
 ['amount','Stima danno EUR',false,['stima danno eur','stima danno','importo stimato']],
 ['requestedAmount','Importo richiesto EUR',false,['importo richiesto eur','importo richiesto']],
 ['assessedAmount','Importo periziato EUR',false,['importo periziato eur','importo periziato']],
 ['liquidationStatus','Stato liquidazione',false,['stato liquidazione']],
 ['liquidatedAmount','Totale liquidato EUR',false,['totale liquidato eur','totale liquidato','importo liquidato']],
 ['liquidatedAt','Data liquidazione definitiva',false,['data liquidazione definitiva','data liquidazione']]
];
const normImport=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const importKey=c=>`${normImport(c.company)}|${String(c.claim).normalize('NFC').trim().toLowerCase()}`;
function parseXML(text){const xml=new DOMParser().parseFromString(text,'application/xml');if(xml.getElementsByTagName('parsererror').length)throw Error('Il file contiene XML non valido.');return xml;}
const xmlTags=(root,tag)=>[...root.getElementsByTagNameNS('*',tag)];
function excelColumnIndex(ref){let n=0;for(const x of ref.match(/^[A-Z]+/i)?.[0].toUpperCase()||'')n=n*26+x.charCodeAt(0)-64;return n-1;}
async function readXlsx(buffer){
 const bytes=new Uint8Array(buffer),view=new DataView(buffer);if(bytes.length<22)throw Error('Il file non è un foglio XLSX valido.');
 let end=-1;for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(view.getUint32(i,true)===0x06054b50){end=i;break;}
 if(end<0)throw Error('Formato non riconosciuto. Usa un file .xlsx, non .xls o .xlsm.');
 const count=view.getUint16(end+10,true);let pos=view.getUint32(end+16,true),entries=new Map();if(count>2000)throw Error('Il file contiene troppi elementi.');let total=0;
 for(let i=0;i<count;i++){
  if(pos+46>bytes.length||view.getUint32(pos,true)!==0x02014b50)throw Error('Archivio XLSX danneggiato.');
  const flags=view.getUint16(pos+8,true),method=view.getUint16(pos+10,true),compressed=view.getUint32(pos+20,true),size=view.getUint32(pos+24,true),nl=view.getUint16(pos+28,true),el=view.getUint16(pos+30,true),cl=view.getUint16(pos+32,true),offset=view.getUint32(pos+42,true);
  total+=size;if(total>60*1024*1024||size>25*1024*1024)throw Error('Il file è troppo grande una volta estratto.');if(flags&1)throw Error('I file protetti da password non sono supportati.');
  const name=new TextDecoder().decode(bytes.slice(pos+46,pos+46+nl));entries.set(name,{method,compressed,size,offset});pos+=46+nl+el+cl;
 }
 async function entry(name,optional=false){const e=entries.get(name);if(!e){if(optional)return '';throw Error('Parte del foglio mancante: '+name);}
  const p=e.offset;if(p+30>bytes.length||view.getUint32(p,true)!==0x04034b50)throw Error('Archivio XLSX danneggiato.');const start=p+30+view.getUint16(p+26,true)+view.getUint16(p+28,true);if(start+e.compressed>bytes.length)throw Error('Archivio incompleto.');
  let data=bytes.slice(start,start+e.compressed);if(e.method===8){let stream;try{stream=new DecompressionStream('deflate-raw');}catch{throw Error('Per importare XLSX usa una versione aggiornata di Chrome o Edge.');}const reader=new Blob([data]).stream().pipeThrough(stream).getReader(),chunks=[];let length=0;
   try{while(true){const part=await reader.read();if(part.done)break;length+=part.value.length;if(length>e.size||length>25*1024*1024){await reader.cancel();throw Error('Dimensione estratta eccessiva.');}chunks.push(part.value);}}finally{reader.releaseLock();}
   data=new Uint8Array(length);let at=0;for(const chunk of chunks){data.set(chunk,at);at+=chunk.length;}}else if(e.method!==0)throw Error('Compressione XLSX non supportata.');
  if(data.length!==e.size)throw Error('Dimensione XLSX non valida.');return new TextDecoder().decode(data);
 }
 const workbook=parseXML(await entry('xl/workbook.xml')),rels=parseXML(await entry('xl/_rels/workbook.xml.rels'));
 const relationships=new Map(xmlTags(rels,'Relationship').filter(r=>r.getAttribute('TargetMode')!=='External').map(r=>[r.getAttribute('Id'),r.getAttribute('Target')]));
 const stringsText=await entry('xl/sharedStrings.xml',true);const shared=stringsText?xmlTags(parseXML(stringsText),'si').map(si=>xmlTags(si,'t').map(t=>t.textContent).join('')):[];
 const date1904=['1','true'].includes(xmlTags(workbook,'workbookPr')[0]?.getAttribute('date1904'));
 const sheets=xmlTags(workbook,'sheet').map(s=>{const rid=s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id')||s.getAttribute('r:id');const target=relationships.get(rid);if(!target)throw Error('Foglio senza dati.');const parts=(target.startsWith('/')?target.slice(1):'xl/'+target).split('/'),clean=[];for(const part of parts){if(part==='..')clean.pop();else if(part!=='.')clean.push(part);}return {name:s.getAttribute('name'),path:clean.join('/')};});
 return {sheets,date1904,async rows(index){const root=parseXML(await entry(sheets[index].path));const rows=[];for(const row of xmlTags(root,'row')){const cells=[];for(const cell of xmlTags(row,'c')){const idx=excelColumnIndex(cell.getAttribute('r')||'');if(idx<0||idx>255)throw Error('Sono supportate al massimo 256 colonne.');let value='';const t=cell.getAttribute('t'),v=xmlTags(cell,'v')[0]?.textContent??'';if(xmlTags(cell,'f').length)value={error:'Formula non supportata: sostituiscila con il valore.'};else if(t==='s')value=shared[Number(v)]??'';else if(t==='inlineStr')value=xmlTags(cell,'t').map(x=>x.textContent).join('');else if(t==='e')value={error:'La cella contiene un errore Excel.'};else if(t==='str'||t==='d')value=v;else if(v!=='')value=Number(v);cells[idx]=value;}
  if(cells.some(v=>v!==''&&v!=null))rows.push({line:Number(row.getAttribute('r')),cells});if(rows.length>10001)throw Error('Limite: 10.000 pratiche per importazione.');}return rows;}};
}
function importDate(v,date1904){if(v===''||v==null)return '';let s;
 if(typeof v==='number'){if(!Number.isInteger(v)||v<0||(!date1904&&v===60))throw Error('data Excel non valida');const base=date1904?Date.UTC(1904,0,1):v<60?Date.UTC(1899,11,31):Date.UTC(1899,11,30);s=new Date(base+v*86400000).toISOString().slice(0,10);}else{const text=String(v).trim();if(/^\d{4}-\d{2}-\d{2}$/.test(text))s=text;else{const m=text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);if(!m)throw Error('usa date gg/mm/aaaa oppure aaaa-mm-gg');s=`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;}}
 const d=new Date(s+'T00:00:00Z');if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==s)throw Error('data inesistente');return s;
}
function importAmount(v){if(v===''||v==null)return null;if(typeof v==='number'){if(!Number.isFinite(v)||v<0)throw Error('importo non valido');return v;}let s=String(v).trim().replace(/€/g,'').replace(/\s/g,'');if(s.includes(',')){if(!/^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$/.test(s))throw Error('importo non valido');s=s.replace(/\./g,'').replace(',','.');}else if(!/^\d+(?:\.\d{1,2})?$/.test(s))throw Error('usa numeri Excel o importi come 1.234,56');const n=Number(s);if(!Number.isFinite(n)||n<0)throw Error('importo non valido');return n;}
function canonicalImport(v,list,label,fallback){if(v===''||v==null)return fallback;const found=list.find(x=>normImport(x)===normImport(v));if(!found)throw Error(`${label}: valore non previsto "${String(v)}"`);return found;}
function validateImportRows(rows,mapping,date1904,existing=cases){
 const seen=new Set(existing.map(importKey)),results=[];
 for(const row of rows){const c={},errors=[];for(const [key,label] of importFields){const col=mapping[key],v=col==null||col<0?'':row.cells[col]??'';try{if(v&&typeof v==='object')throw Error(v.error);
  if(['openedAt','closedAt','liquidatedAt'].includes(key))c[key]=importDate(v,date1904);
  else if(['amount','requestedAmount','assessedAmount','liquidatedAmount'].includes(key))c[key]=importAmount(v);
  else c[key]=String(v).trim();
 }catch(e){errors.push(label+': '+e.message);}}
 for(const key of ['claim','company','insured','openedAt'])if(!c[key])errors.push(importFields.find(f=>f[0]===key)[1]+': obbligatorio');
 try{c.category=canonicalImport(c.category,categories,'Categoria','Da classificare');c.type=canonicalImport(c.type,damageTypes,'Tipo di danno','Da classificare');c.status=canonicalImport(c.status,states,'Stato pratica','Da assegnare');c.liquidationStatus=canonicalImport(c.liquidationStatus,['Non liquidato','Parziale','Definitiva'],'Stato liquidazione','Non liquidato');}catch(e){errors.push(e.message);}
 if(c.closedAt&&c.openedAt&&c.closedAt<c.openedAt)errors.push('Chiusura precedente all’apertura');
 if(c.status==='Chiusa'&&!c.closedAt)errors.push('Pratica chiusa senza data chiusura perizia');
 if(c.liquidatedAt&&c.openedAt&&c.liquidatedAt<c.openedAt)errors.push('Liquidazione precedente all’apertura');
 if(c.liquidationStatus==='Definitiva'&&(c.liquidatedAmount==null||!c.liquidatedAt))errors.push('Liquidazione definitiva: importo e data obbligatori');
 if(c.liquidationStatus==='Non liquidato'&&(c.liquidatedAmount!=null||c.liquidatedAt))errors.push('Non liquidato: importo liquidato e data devono essere vuoti');
 if(c.liquidationStatus==='Parziale'&&(c.liquidatedAmount==null||c.liquidatedAt))errors.push('Parziale: indica il totale e lascia vuota la data definitiva');
 const duplicate=c.company&&c.claim&&seen.has(importKey(c));if(!errors.length&&!duplicate)seen.add(importKey(c));
 results.push({line:row.line,c,errors,status:errors.length?'Errore':duplicate?'Duplicato':'Valida'});
 }return results;
}

const importDialog=document.createElement('dialog');importDialog.id='importDialog';document.body.append(importDialog);
const importBtn=document.createElement('button');importBtn.className='secondary';importBtn.textContent='Importa Excel';document.querySelector('#pratiche .toolbar').prepend(importBtn);
let importBook=null,importRows=[],importMapping={},importResults=[],importBusy=false;
importBtn.onclick=()=>{
 importBook=null;importRows=[];importResults=[];importBusy=false;
 importDialog.innerHTML=`<div class="modal"><div class="panel-head"><h3>Importa pratiche da Excel</h3><button class="icon-btn" id="closeImport">✕</button></div><p>Seleziona un file .xlsx (massimo 15 MB). La prima riga non vuota deve contenere le intestazioni. Il file viene letto in questo browser.</p><input id="xlsxFile" type="file" accept=".xlsx"><label id="sheetLabel" hidden>Foglio<select id="xlsxSheet"></select></label><p id="importMessage" role="status"></p><div id="columnMapping"></div><div id="importPreview"></div><div class="modal-actions"><button id="previewExcel" disabled>Controlla e mostra anteprima</button><button id="commitExcel" class="primary" disabled>Importa righe valide</button></div></div>`;
 importDialog.showModal();importDialog.oncancel=ev=>{if(importBusy)ev.preventDefault();};document.querySelector('#closeImport').onclick=()=>{if(!importBusy)importDialog.close();};
 document.querySelector('#xlsxFile').onchange=async ev=>{const file=ev.target.files[0];if(!file)return;importBook=null;clearPreview();document.querySelector('#previewExcel').disabled=true;document.querySelector('#columnMapping').innerHTML='';document.querySelector('#sheetLabel').hidden=true;
 if(!/\.xlsx$/i.test(file.name)){importMessage('Usa un file .xlsx. I formati .xls e .xlsm non sono supportati.');return;}if(file.size>15*1024*1024){importMessage('Limite file: 15 MB.');return;}
 importMessage('Lettura del file…');importBusy=true;document.querySelector('#xlsxFile').disabled=true;
 try{importBook=await readXlsx(await file.arrayBuffer());const select=document.querySelector('#xlsxSheet');select.innerHTML=importBook.sheets.map((s,i)=>`<option value="${i}">${esc(s.name)}</option>`).join('');const best=importBook.sheets.findIndex(s=>normImport(s.name)==='pratiche');select.value=String(best>=0?best:0);document.querySelector('#sheetLabel').hidden=false;await prepareImportSheet();}catch(e){importMessage('File non letto: '+e.message);}finally{importBusy=false;document.querySelector('#xlsxFile').disabled=false;}
 };
 document.querySelector('#xlsxSheet').onchange=async()=>{importBusy=true;document.querySelector('#xlsxSheet').disabled=true;try{await prepareImportSheet();}catch(e){importMessage(e.message);document.querySelector('#previewExcel').disabled=true;}finally{importBusy=false;document.querySelector('#xlsxSheet').disabled=false;}};
 document.querySelector('#previewExcel').onclick=previewImport;
 document.querySelector('#commitExcel').onclick=commitImport;
};
function importMessage(msg){document.querySelector('#importMessage').textContent=msg;}
function clearPreview(){importResults=[];document.querySelector('#importPreview').innerHTML='';document.querySelector('#commitExcel').disabled=true;}
async function prepareImportSheet(){clearPreview();importRows=await importBook.rows(Number(document.querySelector('#xlsxSheet').value));if(importRows.length<2){document.querySelector('#columnMapping').innerHTML='';document.querySelector('#previewExcel').disabled=true;importMessage('Il foglio deve contenere intestazioni e almeno una pratica.');return;}
 const headers=importRows[0].cells;importMapping={};document.querySelector('#columnMapping').innerHTML='<h4>Associa le colonne (* obbligatorie)</h4><div class="form-grid">'+importFields.map(([key,label,required,aliases])=>{const match=headers.findIndex(h=>aliases.includes(normImport(h)));importMapping[key]=match;return `<label>${label}${required?' *':''}<select data-import-field="${key}"><option value="-1">Non importare</option>${Array.from({length:headers.length},(_,i)=>`<option value="${i}" ${i===match?'selected':''}>${i+1} · ${esc(typeof headers[i]==='object'?'Intestazione non valida':headers[i]||'Senza nome')}</option>`).join('')}</select></label>`;}).join('')+'</div>';
 document.querySelectorAll('[data-import-field]').forEach(el=>el.onchange=()=>{importMapping[el.dataset.importField]=Number(el.value);clearPreview();});document.querySelector('#previewExcel').disabled=false;importMessage(`${importRows.length-1} righe nel foglio selezionato. Verifica l’associazione e apri l’anteprima.`);
}
function previewImport(){if(importBusy||!importBook)return;const missing=importFields.filter(([k,l,required])=>required&&importMapping[k]<0);if(missing.length){importMessage('Associa le colonne obbligatorie: '+missing.map(x=>x[1]).join(', '));return;}
 const assigned=Object.values(importMapping).filter(v=>v>=0);if(new Set(assigned).size!==assigned.length){importMessage('Una colonna Excel non può essere associata a più campi.');return;}
 importResults=validateImportRows(importRows.slice(1),importMapping,importBook.date1904);const valid=importResults.filter(r=>r.status==='Valida').length,duplicates=importResults.filter(r=>r.status==='Duplicato').length;
 importMessage(`${valid} righe valide, ${duplicates} duplicati, ${importResults.length-valid-duplicates} righe con errori. Verranno importate soltanto le righe valide; le pratiche esistenti non vengono modificate.`);
 document.querySelector('#importPreview').innerHTML=`<div class="table-wrap"><table><thead><tr><th>Riga Excel</th><th>Sinistro</th><th>Compagnia</th><th>Assicurato</th><th>Categoria</th><th>Liquidazione</th><th>Esito</th></tr></thead><tbody>${importResults.slice(0,200).map(r=>`<tr><td>${r.line}</td><td>${esc(r.c.claim)}</td><td>${esc(r.c.company)}</td><td>${esc(r.c.insured)}</td><td>${esc(r.c.category)}</td><td>${esc(r.c.liquidationStatus)} · ${r.c.liquidatedAmount==null?'—':euro(r.c.liquidatedAmount)}</td><td>${esc(r.status)}<div class="meta">${esc(r.errors.join('; '))}</div></td></tr>`).join('')}</tbody></table></div>${importResults.length>200?'<p>Anteprima limitata alle prime 200 righe. I conteggi e i controlli comprendono tutte le righe.</p>':''}`;document.querySelector('#commitExcel').disabled=!valid;
}
function commitImport(){if(importBusy||!importResults.length)return;
 const results=validateImportRows(importRows.slice(1),importMapping,importBook.date1904);const valid=results.filter(r=>r.status==='Valida');if(!valid.length){previewImport();return;}
 if(!confirm(`Importare ${valid.length} nuove pratiche? I duplicati e le righe con errori saranno esclusi. Le pratiche esistenti resteranno invariate.`))return;
 importBusy=true;document.querySelector('#commitExcel').disabled=true;
 try{const newCases=valid.map(({c})=>({...c,id:`PR-${new Date().getFullYear()}-${crypto.randomUUID().slice(0,8)}`,created:showDate(c.openedAt),days:Math.max(0,dayDiff(c.openedAt,c.closedAt||today())),notes:[]}));
  localStorage.setItem('pf_cases',JSON.stringify([...cases,...newCases]));cases.push(...newCases);populateFilters();refreshReportFilters();renderAll();document.querySelector('[data-view="pratiche"]').click();document.querySelector('#globalSearch').value='';renderCases();
  importMessage(`Importazione completata: ${newCases.length} pratiche create. Puoi chiudere questa finestra e consultare Pratiche, Documenti e Report.`);document.querySelector('#previewExcel').disabled=true;document.querySelector('#xlsxFile').disabled=true;document.querySelector('#xlsxSheet').disabled=true;document.querySelectorAll('[data-import-field]').forEach(el=>el.disabled=true);importResults=[];
 }catch(e){importMessage('Importazione non completata: '+e.message);document.querySelector('#commitExcel').disabled=false;}finally{importBusy=false;}
}
