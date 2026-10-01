# Tetravise

Sito statico: aprire `index.html` nel browser, senza server o installazione di pacchetti.

## Indirizzi

- Sito ufficiale e URL canonico: https://tetravise.com/
- Indirizzo tecnico GitHub Pages: https://tetravise.github.io/tetravise.com/
- Repository: https://github.com/tetravise/tetravise.com

Immagini, favicon e collegamenti interni mantengono percorsi relativi: funzionano
sia alla radice del dominio ufficiale sia nella sottocartella di GitHub Pages.
Canonical, Open Graph, JSON-LD, sitemap e robots usano invece il dominio ufficiale.

## GitHub Pages

1. In **Settings > Pages > Build and deployment**, scegliere **GitHub Actions**.
2. Consentire le action ufficiali GitHub in **Settings > Actions > General**.
3. Pubblicare su `main` anche `.github/workflows/deploy-pages.yml`, `scripts` e `assets`,
  non soltanto `index.html`.
4. Eseguire **Actions > Deploy site to GitHub Pages > Run workflow** e verificare
  che il job esegua i test e `node scripts/build-pages.mjs` prima dell'upload.

La Action verifica e prepara `_site`, includendo gli asset e i metadati SEO.
`SITE_URL` e impostato a `https://tetravise.com/`, indipendentemente dall'indirizzo
tecnico restituito da GitHub Pages. Non servono secret o token personali.

Un workflow che esegue solo `cp index.html _site/` pubblica l'HTML senza immagini
e lascia incompleti i metadati SEO. Va sostituito con il workflow incluso qui.

## Dominio e DNS

1. Verificare il dominio nelle impostazioni Pages dell'organizzazione `tetravise`.
2. Nella repository impostare **Settings > Pages > Custom domain** a `tetravise.com`.
3. Configurare i record web presso il provider DNS, senza modificare MX e TXT della posta:

| Tipo | Nome | Valore |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | tetravise.github.io |

4. Attendere la verifica DNS e il certificato, quindi abilitare **Enforce HTTPS**.
5. Rieseguire il deploy e controllare `https://tetravise.com/assets/images/alex-mengoli.jpg`
  e `https://tetravise.com/assets/images/social-preview.png`.

Il CNAME DNS di `www` non deve contenere `https://` o `/tetravise.com/`.
Con entrambi i nomi configurati e `tetravise.com` scelto come dominio principale,
GitHub Pages gestisce il redirect di `www` verso il dominio ufficiale.
Se sono presenti record AAAA, devono puntare anch'essi a GitHub Pages.
Con questo workflow Actions non serve un file `CNAME`: il dominio si configura
nelle impostazioni della repository. La propagazione DNS puo richiedere 24 ore.

Riferimento: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site

## Verifiche e preparazione locale

Richiede Node.js 24, come nel workflow. Nessuna dipendenza npm.

```powershell
node --test scripts/build-pages.test.mjs
$env:SITE_URL = 'https://tetravise.com/'
node scripts/build-pages.mjs
```

Senza `SITE_URL`, il generatore usa comunque `https://tetravise.com/`.
Non usare l'URL tecnico come canonical del deploy di produzione.
`_site` contiene il sito finale e non va committato.
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

- Verificare `tetravise.com` in Google Search Console e inviare
  `https://tetravise.com/sitemap.xml`.
- Controllare l'indicizzazione, i dati strutturati e i Core Web Vitals sull'URL pubblico.
- Nelle Pages di progetto, `robots.txt` nella sottocartella non controlla il dominio
  `tetravise.github.io`: i crawler consultano quello alla radice dell'host.
- Ranking, indicizzazione e risultati locali dipendono anche da contenuti reali,
  autorevolezza e concorrenza; non sono garantiti da un punteggio tecnico.

Le icone Lucide sono incluse localmente; la licenza si trova in `assets/lucide-LICENSE.txt`.