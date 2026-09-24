const contactButton = document.querySelector('#contactPilot');
const note = document.querySelector('#formNote');

contactButton.addEventListener('click', () => {
  const agency = document.querySelector('#agency').value.trim() || '[Nome agenzia]';
  const contact = document.querySelector('#contact').value.trim() || '[Referente]';
  const email = document.querySelector('#email').value.trim() || '[Email]';
  const message = document.querySelector('#message').value.trim();

  const subject = `Richiesta progetto pilota PeriziaFlow AI - ${agency}`;
  const body = `Buongiorno,\n\nvorrei valutare il progetto pilota PeriziaFlow AI.\n\nAgenzia: ${agency}\nReferente: ${contact}\nEmail: ${email}\n\n${message}\n\nCordiali saluti`;
  const mailto = `mailto:dfois.consulting@outlook.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;
  note.textContent = 'Se il programma email non si apre, scrivi a dfois.consulting@outlook.com.';
});
