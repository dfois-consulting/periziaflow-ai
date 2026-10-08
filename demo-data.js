/* Dataset dimostrativo coerente; mai applicato automaticamente ai dati esistenti. */
function buildCleanDemo(reference){
 const base=reference||(()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;})();
 const shift=n=>{const d=new Date(base+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
 const timestamp=n=>shift(n)+'T09:00:00.000Z',display=s=>s.split('-').reverse().join('/');
 const rows=[
 ['Mario Rossi','Compagnia Demo B','RCT','Danni da acqua','Luca Bianchi','In attesa documentazione',-12,3850],
 ['Laura Esposito','Compagnia Demo C','Multirischi property','Evento atmosferico','Marco Riva','Perizia in lavorazione',-7,6200],
 ['Paolo Conti','Compagnia Demo C','Incendio','Incendio','Sara Villa','Da verificare',-4,14200],
 ['Anna Colombo','Compagnia Demo A','RCA','Danni a cose','','Da assegnare',-1,null],
 ['Enrico Sala','Compagnia Demo C','Furto','Furto','Davide Neri','Cliente da contattare',-3,5300],
 ['Chiara Romano','Compagnia Demo A','RCA','Danni a cose','Luca Bianchi','Chiusa',-22,2800,3200,2800,2600],
 ['Stefano Greco','Compagnia Demo A','RCA','Danni a cose','Luca Bianchi','Chiusa',-20,4500,5100,4500,4200],
 ['Marta Ferri','Compagnia Demo B','RCT','Danni a cose','Sara Villa','Chiusa',-18,1800,2100,1800,1500],
 ['Roberto Riva','Compagnia Demo B','RCT','Danni a cose','Sara Villa','Chiusa',-16,0,900,0,0]
 ];
 const cases=rows.map((r,i)=>{const closed=r[5]==='Chiusa',id='PR-2026-'+String(i+1).padStart(4,'0'),openedAt=shift(r[6]);return {id,claim:'DEMO-'+String(i+1).padStart(3,'0'),insured:r[0],company:r[1],category:r[2],type:r[3],expert:r[4],status:r[5],openedAt,created:display(openedAt),closedAt:closed?shift(-5):'',days:closed?-5-r[6]:-r[6],amount:r[7],requestedAmount:r[8]??null,assessedAmount:r[9]??null,liquidatedAmount:r[10]??null,liquidationStatus:closed?'Definitiva':'Non liquidato',liquidatedAt:closed?shift(-2):'',notes:[{text:'Pratica fittizia per presentazione. Tutti i dati sono dimostrativi.',date:display(openedAt)+' 09:00'}],deadlines:[],reminders:[]};});
 const deadline=(i,type,offset,text,status='Aperta')=>cases[i].deadlines.push({id:'DEMO-SCAD-'+(i+1),type,dueDate:shift(offset),text,status,completedAt:status==='Completata'?shift(-1):''});
 deadline(0,'Documenti da ricevere',-1,'Ricevere preventivo aggiornato e fotografie del danno.');
 deadline(1,'Consegna perizia',2,'Completare relazione e verificare gli importi.');
 deadline(3,'Sopralluogo',0,'Assegnare il perito e concordare il sopralluogo.');
 deadline(4,'Altro',3,'Contattare l’assicurato per verificare la documentazione sul furto.');
 deadline(2,'Sopralluogo',-2,'Sopralluogo dimostrativo completato.','Completata');
 cases[0].reminders.push({id:'DEMO-SOLL-001',deadlineId:'DEMO-SCAD-1',type:'Documentazione',recipientName:'Ufficio documentazione (demo)',recipientEmail:'',subject:'Sollecito documentazione – Sinistro DEMO-001',body:'Buongiorno,\n\nin riferimento al sinistro DEMO-001, Compagnia Demo B, assicurato Mario Rossi, chiediamo il preventivo aggiornato e le fotografie del danno.\n\nVi chiediamo di indicarci le tempistiche previste.\n\nCordiali saluti,\nUfficio perizie\n\n[Esempio dimostrativo: inserire e verificare il destinatario prima di utilizzare il testo.]',status:'Bozza',createdAt:timestamp(-1),updatedAt:timestamp(-1),sentAt:''});
 const folders=['01-Incarico e polizza','02-Documenti ricevuti','03-Foto e sopralluogo','04-Preventivi e fatture','05-Perizia','06-Corrispondenza','07-Liquidazione'];
 const documents=[];
 function doc(i,label,type,folder,date){documents.push({id:'DEMO-DOC-'+String(documents.length+1).padStart(3,'0'),caseId:cases[i].id,name:label+'_'+cases[i].claim+'.pdf',type,date:date||cases[i].openedAt,folder:folders[folder]});}
 for(let i=0;i<cases.length;i++)doc(i,'Incarico_dimostrativo','Incarico compagnia',0);
 doc(0,'Preventivo_dimostrativo','Preventivo',3,shift(-4));doc(1,'Rilievi_dimostrativi','Fotografie',2,shift(-3));doc(2,'Relazione_dimostrativa','Relazione',4,shift(-1));
 for(let i=5;i<9;i++)doc(i,'Conferma_liquidazione_dimostrativa','Liquidazione',6,shift(-2));
 const assignments=[{company:'Compagnia Demo C',claim:'DEMO-010',insured:'Franco Sala',city:'Monza',type:'Danni da acqua',category:'Multirischi property',confidence:98},{company:'Compagnia Demo A',claim:'DEMO-011',insured:'Gianni Moretti',city:'Desio',type:'Danni a cose',category:'RCA',confidence:95}];
 const emails=[{subject:'Sinistro DEMO-001 - richiesta documentazione',from:'documentazione@example.invalid',class:'Richiesta integrazione',caseId:cases[0].id,time:'10:42'},{subject:'Sinistro DEMO-003 - relazione da verificare',from:'perito@example.invalid',class:'Relazione peritale',caseId:cases[2].id,time:'09:55'},{subject:'Nuovo incarico peritale DEMO-010',from:'incarichi@example.invalid',class:'Nuovo incarico',caseId:'',time:'09:21'}];
 const payments=[{expert:'Luca Bianchi',cases:2,amount:280,invoice:'DEMO-FT-01',due:display(shift(5)),status:'Da pagare'},{expert:'Sara Villa',cases:2,amount:300,invoice:'DEMO-FT-02',due:display(shift(7)),status:'Da verificare'}];
 return {format:'PeriziaFlowBackup',version:3,appVersion:'2.0',createdAt:base+'T12:00:00.000Z',cases,documents,files:[],assignments,emails,payments};
}
window.demoTemplate=buildCleanDemo();
