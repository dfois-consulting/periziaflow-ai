const copyButton = document.querySelector('#copyRequest');
const note = document.querySelector('#formNote');
copyButton.addEventListener('click', async () => {
  const agency = document.querySelector('#agency').value.trim() || '[Nome agenzia]';
  const contact = document.querySelector('#contact').value.trim() || '[Referente]';
  const email = document.querySelector('#email').value.trim() || '[Email]';
  const message = document.querySelector('#message').value.trim();
  const text = `Richiesta progetto pilota PeriziaFlow AI\n\nAgenzia: ${agency}\nReferente: ${contact}\nEmail: ${email}\n\n${message}`;
  try {
    await navigator.clipboard.writeText(text);
    copyButton.textContent = 'Richiesta copiata ✓';
    note.textContent = 'Ora puoi incollarla in una email, LinkedIn o altro canale di contatto.';
  } catch (e) {
    window.prompt('Copia questo testo:', text);
  }
});
