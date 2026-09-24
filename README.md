# PeriziaFlow AI — sito demo

Pacchetto statico pronto per GitHub Pages, Netlify o hosting equivalente.

## Struttura
- `index.html` — landing page pubblica
- `site.css` — stile landing page
- `site.js` — interazione richiesta pilota
- `demo/` — prototipo V1 completo

## Pubblicazione su GitHub Pages
1. Crea un repository, ad esempio `periziaflow-ai`.
2. Carica **il contenuto** di questa cartella nella root del repository.
3. In GitHub vai in `Settings > Pages`.
4. In `Build and deployment`, scegli `Deploy from a branch`.
5. Seleziona branch `main` e cartella `/ (root)`.
6. Salva. GitHub fornirà l'URL pubblico.

## Nota sulla richiesta progetto pilota
Il form non invia dati a un server. Il pulsante `Copia richiesta` copia il testo negli appunti, così non servono backend o servizi esterni nella prima pubblicazione.

## Prima di un utilizzo reale
Il prototipo non deve essere usato con dati personali o pratiche assicurative reali. Per una versione operativa servono almeno autenticazione, database, storage documentale, controllo accessi, audit log, sicurezza e valutazione privacy/GDPR.
