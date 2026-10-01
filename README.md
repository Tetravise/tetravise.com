# Tetravise

Sito statico: aprire `index.html` nel browser, senza server o installazione di pacchetti.

## GitHub Pages

1. In **Settings > Pages > Build and deployment**, scegliere **GitHub Actions**.
2. Consentire le action ufficiali GitHub in **Settings > Actions > General**.
3. Pubblicare i file sul branch `main`, oppure aggiornare il branch nel workflow.

La Action verifica e prepara `_site`, includendo gli asset e i metadati SEO.
Canonical, Open Graph, dati strutturati, sitemap e robots usano l'URL effettivo
restituito da GitHub Pages. Non servono secret o token personali.

Per un dominio personalizzato, configurare **Settings > Pages > Custom domain**,
i record DNS richiesti da GitHub e **Enforce HTTPS**, poi rieseguire il deploy.
Non impostare un canonical verso un dominio ancora da collegare.

## Verifiche e preparazione locale

Richiede Node.js 24, come nel workflow. Nessuna dipendenza npm.

```powershell
node --test scripts/build-pages.test.mjs
$env:SITE_URL = 'https://ACCOUNT.github.io/REPOSITORY/'
node scripts/build-pages.mjs
```

Usare il proprio URL pubblico. `_site` contiene il sito finale e non va committato.
Il template SEO in `index.html` viene completato prima del deploy, non nel browser.

## Contenuti da completare

- Sostituire i tre segnaposto rimanenti con foto, nomi e ruoli reali. Il profilo
  di Alex Mengoli e gia inserito; le altre descrizioni restano provvisorie.
- Aggiungere gli URL LinkedIn degli altri tre membri: i relativi pulsanti
  restano disabilitati finche non viene inserito un collegamento reale.
- I quattro profili sono presenti nell'HTML anche senza JavaScript, che ne
  mescola soltanto l'ordine a ogni caricamento.
- Inserire solo dati aziendali, recapiti e indirizzi verificati.
- Rigenerare `assets/images/social-preview.png` se cambia il posizionamento del marchio.

## Dopo la pubblicazione

- Verificare la proprieta del sito in Google Search Console e inviare `sitemap.xml`.
- Controllare l'indicizzazione, i dati strutturati e i Core Web Vitals sull'URL pubblico.
- Nelle Pages di progetto, `robots.txt` nella sottocartella non controlla il dominio
  `ACCOUNT.github.io`: i crawler consultano quello alla radice dell'host.
- Ranking, indicizzazione e risultati locali dipendono anche da contenuti reali,
  autorevolezza e concorrenza; non sono garantiti da un punteggio tecnico.

Le icone Lucide sono incluse localmente; la licenza si trova in `assets/lucide-LICENSE.txt`.