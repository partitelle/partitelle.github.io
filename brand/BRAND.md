# Brand e design system

Questo documento descrive l'identità visiva dell'ecosistema per organizzare partite amatoriali nato da PartitelleBot. Va letto prima di costruire qualunque superficie con questo marchio, a partire dalla landing page.

## Il prodotto

È un ecosistema di strumenti per organizzare partite tra amici: raccogliere i partecipanti, fissare giorno, ora e campo, formare le squadre. Oggi esiste come bot Telegram (PartitelleBot). In seguito arriveranno una versione WhatsApp, un sito web e un'app. Il marchio non deve richiamare né Telegram né WhatsApp e non deve essere legato a uno sport specifico: oggi si parla soprattutto di calcetto, ma lo strumento vale per qualunque sport di squadra.

Il nome "partitelle" è provvisorio e potrebbe cambiare per una versione internazionale. Per questo il segno grafico non contiene lettere e funziona da solo. Il logotipo è l'unico elemento che dipende dal nome.

## Il concetto

Il marchio è un fischietto da arbitro, disegnato con poche forme geometriche e tre raggi di suono che escono dalla fessura. L'arbitro è la figura presente in tutti gli sport, ed è anche il ruolo del prodotto: non gioca, ma chiama la partita, mette insieme le squadre e tiene l'ordine. I raggi trasformano l'oggetto in un'azione: il fischio d'inizio, cioè "si gioca".

La palette è giallo arbitro e nero, come il cartellino e la divisa.

## File inclusi

| File | Uso |
|---|---|
| `logo-mark.svg` | Segno nero, fondo trasparente. Su fondi chiari o gialli. |
| `logo-mark-yellow.svg` | Segno giallo, fondo trasparente. Solo su fondi scuri. |
| `logo-mark-currentcolor.svg` | Segno che eredita il colore dal CSS (`color`). Da usare inline nell'HTML. |
| `logo-lockup.svg` | Segno e nome affiancati, tutto nero. Su fondi chiari o gialli. |
| `logo-lockup-on-dark.svg` | Segno giallo e nome bianco. Su fondi scuri. |
| `app-icon.svg` | Icona di produzione: segno nero su giallo, quadrata 512×512, senza angoli arrotondati (li applica il sistema operativo). |
| `app-icon-dark.svg` | Variante scura: segno giallo su nero. |
| `app-icon-staging.svg` | Icona dell'ambiente di staging: segno nero su arancione. |
| `favicon.svg` | Icona con angoli arrotondati, per la scheda del browser. |
| `og-image.svg` | Immagine 1200×630 per l'anteprima social (Open Graph). Va esportata in PNG prima della pubblicazione, perché le piattaforme social non leggono gli SVG. |

Tutti i file sono vettoriali puri, senza font esterni né immagini incorporate: il nome nel logotipo è già convertito in tracciati.

## Colori

| Token | Hex | Ruolo |
|---|---|---|
| `--brand-yellow` | `#FFD21F` | Giallo arbitro. Colore primario del marchio e superficie principale. |
| `--brand-black` | `#111111` | Nero arbitro. Segno, testo, superfici scure. |
| `--brand-white` | `#FFFFFF` | Fondo neutro e testo su nero. |
| `--brand-paper` | `#F4F2EC` | Fondo neutro caldo per sezioni alternate. Uso secondario. |
| `--text-muted` | `#4A4D55` | Testo secondario. |
| `--staging-orange` | `#FF6A13` | Riservato agli ambienti non di produzione. Non va usato nell'interfaccia di produzione. |

I rapporti di contrasto WCAG verificati sono: nero su giallo 13,0:1, nero su bianco 18,9:1, nero su carta 16,9:1, testo secondario su bianco 8,5:1, testo secondario su giallo 5,8:1, nero su arancione 6,6:1. Sono tutti sopra la soglia AA per il testo normale.

Il giallo non va mai usato come colore del testo o di icone su fondo bianco o carta: il contrasto è 1,45:1, illeggibile. Il giallo è una superficie, non un colore di testo, salvo su fondo nero. Allo stesso modo il testo bianco su arancione non passa (2,9:1): sull'arancione si usa il nero.

Non si usano sfumature, gradienti o ombre colorate. I colori sono pieni.

## Tipografia

Il carattere del marchio è **Outfit** (Google Fonts, licenza SIL Open Font License). È un sans geometrico, coerente con le forme circolari del segno.

Il peso 700 è per titoli e logotipo, il 500 per testo corrente ed etichette. Fallback consigliato: `'Outfit', system-ui, -apple-system, 'Segoe UI', sans-serif`.

Il logotipo usa Outfit 700 con una spaziatura stretta di −30 unità su 1000 (circa `letter-spacing: -0.03em`), tutto minuscolo. I titoli della landing possono riprendere la stessa spaziatura negativa dalle dimensioni grandi in su. Il testo corrente resta con spaziatura normale.

Scala consigliata per il web, in rem su base 16 px: 4 / 3 / 2,25 / 1,5 / 1,25 / 1 / 0,875. L'interlinea è 1,05–1,15 per i titoli grandi e 1,5–1,6 per il testo corrente. Le righe di testo non superano i 70 caratteri circa.

Non scrivere titoli o etichette tutto in maiuscolo. Il marchio parla in minuscolo.

## Il segno

### Costruzione

Il segno è disegnato in un sistema di coordinate 512×512 ed è fatto di quattro parti:

1. Una camera circolare, centro (300, 300), raggio 112.
2. Un bocchino rettangolare, da x 100 a x 300 e da y 188 a y 276, con gli angoli esterni arrotondati a 22. Il lato superiore è allineato alla sommità della camera.
3. Una fessura, cioè una tacca vuota di 46×30 nel lato superiore del bocchino, da x 198 a x 244.
4. Un anello per il cordino, centro (394, 206), raggio 24, spessore 18.

A queste si aggiungono tre raggi di suono di spessore 22 con estremità arrotondate, disposti a ventaglio sopra la fessura.

Il riquadro del segno nella viewBox è `100 89 327 323`, con un rapporto di circa 1:1. Nelle icone 512×512 il segno è spostato di (−8, +6) per il centraggio ottico.

### Area di rispetto e dimensioni minime

Intorno al segno va lasciato uno spazio libero pari almeno all'altezza del bocchino (88 unità, circa il 27% dell'altezza del segno). Lo stesso vale attorno al logotipo.

Il segno da solo resta leggibile fino a 16 px di altezza, l'icona su fondo giallo fino a 24 px. Il logotipo non va usato sotto i 120 px di larghezza: sotto quella soglia si usa solo il segno.

### Cosa non fare

Il segno non va ruotato, deformato, contornato, ombreggiato o riempito con sfumature. Non si cambiano le proporzioni tra camera e bocchino e non si tolgono i raggi o l'anello. Non si ricolora con colori fuori palette e non si posiziona su fotografie o fondi a basso contrasto. Non gli si aggiungono volti, mani, persone o altri elementi illustrativi: il marchio è un segno, non un'illustrazione. Il segno non va usato come lettera all'interno di una parola.

## Varianti e quando usarle

La variante principale è il segno nero su giallo. È quella di default per l'icona, la favicon e l'apertura della landing.

La variante scura, segno giallo su nero, serve per superfici scure come footer, modalità scura e merchandising.

L'icona di staging, nera su arancione, serve solo per distinguere build e ambienti di test e non compare mai in comunicazione pubblica.

## Indicazioni per la landing page

**Tono.** Diretto, amichevole, concreto, come un amico che organizza la partita del mercoledì. Si parla dei problemi reali: trovare chi manca, smettere di copiare e incollare la lista nel gruppo, fare squadre equilibrate. Frasi brevi, verbi attivi, niente gergo tecnico. Le call to action dicono esattamente cosa succede, per esempio "Aggiungi il bot al gruppo" e non "Inizia ora".

**Struttura.** Il giallo pieno è la superficie della sezione d'apertura, con titolo nero grande in Outfit 700 e il segno ben visibile. Il resto della pagina alterna sezioni bianche o carta, e il giallo torna come superficie nei momenti chiave, come la call to action finale. Il footer è nero con il logotipo per fondi scuri. L'allineamento del testo è a sinistra. Si evitano griglie di card tutte uguali.

**Componenti.** I pulsanti primari sono neri con testo bianco su fondo giallo o bianco, e diventano gialli con testo nero su fondo nero. Hanno altezza minima 48 px e angoli molto arrotondati, a pillola. I raggi degli angoli seguono le forme morbide del segno: pillola per pulsanti e chip, 16–24 px per pannelli e immagini. Bordi e divisori sono neri al 12% di opacità o in `--brand-paper`, senza ombre diffuse.

**Contenuti visivi.** Il prodotto vive nei gruppi di chat, quindi le immagini più efficaci sono riproduzioni pulite dei messaggi del bot: il riepilogo della partita con giorno, orario, lista dei partecipanti e campo, oppure le squadre generate. Vanno ridisegnate come componenti dell'interfaccia, non come screenshot di Telegram o WhatsApp, così restano neutre rispetto alla piattaforma. Niente foto stock di calciatori professionisti: il pubblico gioca il calcetto del mercoledì sera.

**Movimento.** Un solo momento animato è sufficiente: all'apertura i tre raggi del segno possono "fischiare", cioè comparire uno dopo l'altro dalla fessura. Va rispettato `prefers-reduced-motion`.

**Accessibilità.** Tutte le coppie di colori della tabella rispettano almeno il livello AA. Il focus da tastiera è visibile, con un contorno nero di 3 px e scostamento di 2 px sul giallo, giallo sul nero. Il segno inline ha `role="img"` e `aria-label` con il nome del prodotto.

## Codice pronto

```css
:root {
  --brand-yellow: #FFD21F;
  --brand-black: #111111;
  --brand-white: #FFFFFF;
  --brand-paper: #F4F2EC;
  --text-muted: #4A4D55;
  --font-brand: 'Outfit', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --radius-pill: 999px;
  --radius-panel: 20px;
  --space: 8px; /* griglia di base: multipli di 8 */
}
```

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;700&display=swap" rel="stylesheet">

<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta name="theme-color" content="#FFD21F">
<meta property="og:image" content="https://<dominio>/og-image.png">
```

Per usare il segno inline con il colore del contesto, si copia il contenuto di `logo-mark-currentcolor.svg` nell'HTML e si imposta `color` sul contenitore, per esempio `color: var(--brand-black)`.

## Se il nome cambia

Il segno e i colori restano invariati. Vanno rigenerati soltanto `logo-lockup.svg`, `logo-lockup-on-dark.svg` e `og-image.svg`, componendo il nuovo nome in Outfit 700, tutto minuscolo, con spaziatura −30/1000, convertito in tracciati. L'altezza del segno nel logotipo è circa 1,3 volte la dimensione del carattere, con uno spazio di 0,27 em tra segno e nome, centrati verticalmente.
