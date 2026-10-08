/* Replaces local data only on explicit operator action; exports the previous state first. */
const demoResetPanel=document.createElement('div');demoResetPanel.className='panel';demoResetPanel.innerHTML=`<div class="panel-head"><h3>Demo pulita per presentazione</h3></div><p>Carica 9 pratiche fittizie senza duplicati, 16 documenti dimostrativi, 5 scadenze e 1 bozza di sollecito. Le date sono riferite a oggi. Quattro liquidazioni definitive permettono di provare i report RCA/RCT.</p><p>Questo comando sostituisce le pratiche, i documenti e gli allegati presenti nel browser. Prima viene scaricato un backup completo dei dati attuali.</p><button type="button" class="danger-btn" id="loadCleanDemo">Carica demo pulita</button><p id="demoResetMessage" role="status" aria-live="polite"></p>`;backupSection.append(demoResetPanel);
const demoMessage=s=>document.querySelector('#demoResetMessage').textContent=s;
function downloadDemoSafetyBackup(backup){const url=URL.createObjectURL(new Blob([JSON.stringify(backup)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`PeriziaFlow_PRIMA_PULIZIA_${today()}.pfbackup.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
document.querySelector('#loadCleanDemo').onclick=async()=>{
 if(backupBusy)return;
 if(!confirm('Caricare la demo pulita?\n\nSaranno sostituiti i dati locali con 9 pratiche fittizie. Prima verrà scaricato un backup completo dei dati attuali.'))return;
 lockBackup(true);document.querySelector('#loadCleanDemo').disabled=true;demoMessage('Preparazione del backup prima della pulizia…');
 try{const backup=await buildFullBackup();const raw=buildCleanDemo(today()),candidate=await validateFullBackup(raw);downloadDemoSafetyBackup(backup);
  if(!confirm('Backup preparato: PeriziaFlow_PRIMA_PULIZIA_'+today()+'.pfbackup.json.\n\nVerifica di averlo conservato prima di continuare. Confermare la sostituzione con la demo pulita?')){demoMessage('Pulizia annullata. I dati attuali sono invariati.');return;}
  await applyFullBackup(candidate);assignments.splice(0,assignments.length,...raw.assignments);emails.splice(0,emails.length,...raw.emails);payments.splice(0,payments.length,...raw.payments);renderAll();
  backupCandidate=null;document.querySelector('#backupPreview').innerHTML='';document.querySelector('#backupFile').value='';demoMessage('Demo pulita caricata: 9 pratiche, 16 documenti dimostrativi, 5 scadenze e 1 bozza. Il backup precedente è nei download.');backupStatus('Demo pulita pronta. Esporta un nuovo backup per conservare questa configurazione.');
 }catch(e){demoMessage('Pulizia non completata: '+e.message);}finally{lockBackup(false);document.querySelector('#loadCleanDemo').disabled=false;}
};
