// An inline piece of text: plain, or a link (internal "#id", mailto: or external).
export type Segment = string | { text: string; href: string };

export type PrivacyBlock =
  | { type: "p"; segments: readonly Segment[] }
  | { type: "ul"; items: readonly (readonly Segment[])[] }
  | {
      type: "purposes";
      items: readonly { lead: string; segments: readonly Segment[] }[];
    };

export interface PrivacySection {
  id: string;
  title: string;
  blocks: readonly PrivacyBlock[];
}

const MAIL = "mailto:privacy@partitelle.com";
const mail: Segment = { text: "privacy@partitelle.com", href: MAIL };
const point12: Segment = { text: "punto 12", href: "#i-tuoi-diritti" };
const point7: Segment = { text: "punto 7", href: "#perche-li-usiamo" };
const point7d: Segment = { text: "punto 7 d)", href: "#perche-li-usiamo" };
const bot: Segment = {
  text: "@PartitelleBot",
  href: "https://t.me/PartitelleBot",
};

const privacy: {
  meta: { title: string; description: string };
  title: string;
  lead: string;
  updatedLabel: string;
  updated: { iso: string; text: string };
  indexLabel: string;
  sections: readonly PrivacySection[];
} = {
  meta: {
    title: "informativa privacy · partitelle",
    description:
      "quali dati salva il bot di partitelle, perché, per quanto tempo e come chiederci di vederli o cancellarli.",
  },
  title: "informativa privacy",
  lead: "quali dati salva il bot, perché, e come chiederci di vederli o cancellarli.",
  updatedLabel: "ultimo aggiornamento:",
  updated: { iso: "2026-11-01", text: "1 novembre 2026" },
  indexLabel: "indice",
  sections: [
    {
      id: "chi-siamo",
      title: "chi siamo",
      blocks: [
        {
          type: "p",
          segments: [
            "partitelle è un progetto per organizzare partite tra amici: un bot Telegram (",
            bot,
            ") e il sito partitelle.com.",
          ],
        },
        {
          type: "p",
          segments: [
            "il titolare del trattamento dei dati è Giovanni Laganà, la persona che gestisce partitelle, come privato: partitelle non è una società.",
          ],
        },
        {
          type: "p",
          segments: [
            "per qualsiasi domanda o richiesta sui tuoi dati, scrivi a ",
            mail,
            ".",
          ],
        },
      ],
    },
    {
      id: "di-cosa-parla",
      title: "di cosa parla questa informativa",
      blocks: [
        {
          type: "p",
          segments: [
            "questa informativa spiega quali dati tratta il bot ",
            bot,
            " quando lo usi su Telegram, in un gruppo o in una chat privata, e quali dati tratta il sito partitelle.com.",
          ],
        },
        {
          type: "p",
          segments: [
            "Telegram è un servizio separato: per i dati che Telegram tratta come piattaforma vale l'informativa di Telegram (",
            {
              text: "telegram.org/privacy",
              href: "https://telegram.org/privacy",
            },
            ").",
          ],
        },
      ],
    },
    {
      id: "dati-salvati",
      title: "quali dati salviamo",
      blocks: [
        {
          type: "p",
          segments: [
            "il bot salva in un database solo quello che serve per organizzare la partita:",
          ],
        },
        {
          type: "ul",
          items: [
            [
              "l'identificativo della chat Telegram in cui viene usato (un gruppo o una chat privata);",
            ],
            [
              "i dati della partita: giorno e ora, quanti giocatori sono previsti, il campo e la descrizione scritti con /setpitch e /setdescription, gli identificativi dei messaggi di riepilogo inviati dal bot, e le date in cui la partita è stata creata, modificata e chiusa;",
            ],
            [
              "la lista dei partecipanti: per ogni persona, il nome con cui compare in lista, lo stato (confermato o in forse), la posizione in lista e la squadra (nera o bianca);",
            ],
            ["alcune impostazioni del gruppo, come il campo predefinito."],
          ],
        },
        { type: "p", segments: ["il nome con cui compari in lista è:"] },
        {
          type: "ul",
          items: [
            [
              "il tuo username Telegram (per esempio @mario), se ti aggiungi da solo e hai uno username;",
            ],
            [
              "il nome e cognome del tuo profilo Telegram, se ti aggiungi da solo e non hai uno username;",
            ],
            [
              'il testo scritto da chi ti aggiunge (per esempio "aggiungi luca").',
            ],
          ],
        },
        {
          type: "p",
          segments: [
            "campo e descrizione sono testo libero: contengono quello che ci scrive il gruppo. ti chiediamo di non scriverci dati personali che non servono (numeri di telefono, indirizzi di casa, coordinate bancarie e simili).",
          ],
        },
        {
          type: "p",
          segments: [
            "conserviamo anche i dati raccolti dalle versioni precedenti del bot, che sono dello stesso tipo.",
          ],
        },
      ],
    },
    {
      id: "cosa-leggiamo",
      title: "cosa leggiamo ma non salviamo",
      blocks: [
        {
          type: "p",
          segments: [
            'per riconoscere le parole chiave (come "aggiungimi", "toglimi", "aggiungi <nome>"), il bot riceve da Telegram i messaggi di testo scritti nel gruppo. il bot controlla solo se il messaggio inizia con una parola chiave: il testo dei messaggi non viene salvato. dai messaggi con una parola chiave salviamo solo il dato che serve al comando (per esempio il nome da aggiungere).',
          ],
        },
        {
          type: "p",
          segments: [
            "quando il bot incontra un errore tecnico, il server registra un messaggio di errore (log) che a volte può contenere un nome in lista o l'identificativo della chat. i log servono solo a correggere i malfunzionamenti. li conserva il fornitore di hosting per un periodo limitato (al massimo 30 giorni), secondo le sue regole.",
          ],
        },
      ],
    },
    {
      id: "cosa-non-raccogliamo",
      title: "cosa non raccogliamo",
      blocks: [
        {
          type: "p",
          segments: [
            "il bot non salva il tuo ID utente Telegram, il tuo numero di telefono, la tua foto profilo, la tua posizione, né il contenuto dei messaggi del gruppo.",
          ],
        },
        {
          type: "p",
          segments: [
            "non chiede dati di pagamento: il promemoria dopo la partita è solo un messaggio nel gruppo.",
          ],
        },
      ],
    },
    {
      id: "da-dove-arrivano",
      title: "da dove arrivano i dati",
      blocks: [
        {
          type: "ul",
          items: [
            ["da te, quando usi un comando o una parola chiave."],
            [
              'da altri membri del gruppo, quando scrivono il tuo nome (per esempio "aggiungi luca"), impostano campo e descrizione o fanno le squadre.',
            ],
            [
              "da Telegram, che ci invia l'identificativo della chat e, quando ti aggiungi da solo, il tuo username o il nome del tuo profilo.",
            ],
          ],
        },
      ],
    },
    {
      id: "perche-li-usiamo",
      title: "perché li usiamo e su quale base",
      blocks: [
        { type: "p", segments: ["usiamo i dati solo per questi scopi:"] },
        {
          type: "purposes",
          items: [
            {
              lead: "a) far funzionare il servizio:",
              segments: [
                " creare la partita, tenere aggiornata la lista, fare le squadre, mandare riepiloghi e promemoria nel gruppo e conservare lo storico delle partite.",
              ],
            },
            {
              lead: "b) migliorare il prodotto:",
              segments: [
                " capire come viene usato il bot, trovare e correggere errori, sviluppare nuove funzioni.",
              ],
            },
            {
              lead: "c) statistiche aggregate e anonime:",
              segments: [
                " per esempio quante partite si organizzano, in quali giorni e a che ora, con quanti giocatori. le statistiche non contengono nomi, identificativi di chat o testi scritti dagli utenti, e non permettono di risalire a una persona o a un gruppo.",
              ],
            },
            {
              lead: "d) possibili servizi futuri per aziende",
              segments: [
                " (per esempio centri sportivi), basati solo su statistiche aggregate e anonime come quelle del punto c). oggi non lo facciamo. se lo faremo, non condivideremo mai dati su persone o su singoli gruppi.",
              ],
            },
          ],
        },
        {
          type: "p",
          segments: [
            "la base giuridica di tutti questi scopi è il nostro legittimo interesse (art. 6, par. 1, lett. f del GDPR): offrire un servizio gratuito che funzioni, migliorarlo e capire come viene usato, in forma anonima. puoi opporti in qualsiasi momento (vedi il ",
            point12,
            ").",
          ],
        },
      ],
    },
    {
      id: "cosa-non-facciamo-mai",
      title: "cosa non facciamo mai",
      blocks: [
        {
          type: "ul",
          items: [
            [
              "non vendiamo e non condividiamo con nessuno dati personali o dati sulle singole chat.",
            ],
            [
              "non profiliamo le persone: nessun punteggio o classifica individuale (presenze, affidabilità, pagamenti) mostrato o ceduto a terzi.",
            ],
            [
              "non ricaviamo dai messaggi la tua posizione o altre informazioni su di te.",
            ],
            [
              "non usiamo i dati per la pubblicità e non mandiamo messaggi promozionali nei gruppi.",
            ],
            [
              "non usiamo i messaggi o i dati delle chat per addestrare modelli di intelligenza artificiale.",
            ],
          ],
        },
      ],
    },
    {
      id: "chi-altro-tratta-i-dati",
      title: "chi altro tratta i dati",
      blocks: [
        {
          type: "p",
          segments: [
            "per far funzionare il servizio usiamo questi fornitori, che trattano i dati per conto nostro:",
          ],
        },
        {
          type: "ul",
          items: [
            [
              "Render (Render Services, Inc., USA): ospita il server del bot e i suoi log.",
            ],
            [
              "Neon (Neon, LLC, del gruppo Databricks, USA): ospita il database, su server Amazon Web Services a Francoforte (Germania).",
            ],
            ["GitHub (GitHub, Inc., USA): ospita il sito partitelle.com."],
          ],
        },
        {
          type: "p",
          segments: [
            "Telegram tratta i dati come titolare autonomo per il funzionamento della propria piattaforma, secondo la propria informativa.",
          ],
        },
        {
          type: "p",
          segments: [
            "non diamo i dati a nessun altro, salvo quando la legge ci obbliga.",
          ],
        },
      ],
    },
    {
      id: "trasferimenti",
      title: "trasferimenti fuori dall'Unione europea",
      blocks: [
        {
          type: "p",
          segments: [
            "Render, Neon e GitHub sono società con sede negli Stati Uniti.",
          ],
        },
        {
          type: "p",
          segments: [
            "tutti e tre aderiscono all'EU-U.S. Data Privacy Framework, che la Commissione europea riconosce come adeguato. i trasferimenti dei dati negli Stati Uniti si basano su questa adesione (per Neon aderisce Databricks, Inc., il gruppo di cui fa parte). i loro termini sulla protezione dei dati prevedono anche le clausole contrattuali standard della Commissione europea.",
          ],
        },
      ],
    },
    {
      id: "per-quanto-tempo",
      title: "per quanto tempo conserviamo i dati",
      blocks: [
        {
          type: "p",
          segments: [
            "oggi non cancelliamo i dati in automatico: li conserviamo finché il servizio è attivo, perché lo storico delle partite fa parte del servizio e serve alle statistiche anonime.",
          ],
        },
        {
          type: "p",
          segments: [
            'con /stop la partita si chiude, ma resta salvata nello storico. quando scrivi "toglimi", o qualcuno scrive "togli <nome>", il nome viene cancellato dalla lista della partita in corso; resta nelle partite già chiuse.',
          ],
        },
        {
          type: "p",
          segments: [
            "rivedremo questa scelta quando partitelle avrà una struttura stabile, e comunque prima di usare i dati per i servizi del ",
            point7d,
            ". se la scelta cambia, aggiorneremo questa informativa.",
          ],
        },
        { type: "p", segments: ["se il servizio chiude, cancelliamo i dati."] },
        {
          type: "p",
          segments: [
            "in qualsiasi momento puoi chiederci di cancellare i tuoi dati (vedi il ",
            point12,
            ").",
          ],
        },
      ],
    },
    {
      id: "i-tuoi-diritti",
      title: "i tuoi diritti",
      blocks: [
        { type: "p", segments: ["puoi chiederci in qualsiasi momento di:"] },
        {
          type: "ul",
          items: [
            [
              "sapere quali dati abbiamo su di te e averne una copia (accesso);",
            ],
            ["correggerli (rettifica);"],
            ["cancellarli (cancellazione);"],
            ["limitarne l'uso (limitazione);"],
            [
              "non usarli più per uno o più degli scopi del ",
              point7,
              " (opposizione).",
            ],
          ],
        },
        {
          type: "p",
          segments: ["scrivi a ", mail, ". ti rispondiamo entro un mese."],
        },
        {
          type: "p",
          segments: [
            "per trovarti nei nostri dati ci serve sapere come compari nelle liste (username o nome) e in quale gruppo giochi. il bot non salva il tuo ID Telegram, quindi potremmo chiederti qualche informazione in più per essere sicuri di trovare i dati giusti. se non riusciamo a identificarti, te lo diciamo.",
          ],
        },
        {
          type: "p",
          segments: [
            "hai anche il diritto di presentare reclamo al Garante per la protezione dei dati personali (",
            {
              text: "garanteprivacy.it",
              href: "https://www.garanteprivacy.it",
            },
            ").",
          ],
        },
      ],
    },
    {
      id: "nomi-aggiunti-da-altri",
      title: "nomi aggiunti da altri e minori",
      blocks: [
        {
          type: "p",
          segments: [
            "se qualcuno del tuo gruppo ti ha aggiunto alla lista scrivendo il tuo nome, questa informativa vale anche per te, anche se non hai mai usato il bot. puoi chiedere di cancellare il tuo nome come spiegato al ",
            point12,
            ', o chiedere al gruppo di toglierti con "togli <nome>".',
          ],
        },
        {
          type: "p",
          segments: [
            "il bot non chiede l'età. se un nome in lista è di un minore, un genitore può chiederne la cancellazione allo stesso indirizzo.",
          ],
        },
      ],
    },
    {
      id: "il-sito",
      title: "il sito partitelle.com",
      blocks: [
        {
          type: "p",
          segments: [
            "il sito non usa cookie, non usa strumenti di analisi o di tracciamento e non carica risorse da altri siti (i caratteri sono ospitati sul sito stesso).",
          ],
        },
        {
          type: "p",
          segments: [
            "GitHub, che ospita il sito, registra l'indirizzo IP di chi lo visita per motivi di sicurezza, secondo la propria informativa (",
            {
              text: "docs.github.com/site-policy/privacy-policies",
              href: "https://docs.github.com/site-policy/privacy-policies",
            },
            ").",
          ],
        },
        {
          type: "p",
          segments: [
            "il sito contiene link a Telegram e a GitHub: se li apri, valgono le informative di quei servizi.",
          ],
        },
      ],
    },
    {
      id: "decisioni-automatizzate",
      title: "decisioni automatizzate",
      blocks: [
        {
          type: "p",
          segments: [
            "il bot non prende decisioni automatizzate che abbiano effetti giuridici o simili su di te. le squadre sono sorteggiate.",
          ],
        },
      ],
    },
    {
      id: "modifiche",
      title: "modifiche",
      blocks: [
        {
          type: "p",
          segments: [
            "se cambiamo questa informativa, pubblichiamo la nuova versione su questa pagina, con la data di aggiornamento.",
          ],
        },
      ],
    },
  ],
};

export const it = {
  site: {
    name: "partitelle",
    title: "partitelle: la partita del mercoledì, senza il caos nel gruppo",
    description:
      "partitelle raccoglie chi c'è, tiene la lista aggiornata e fa le squadre. tu pensa solo a giocare.",
    locale: "it_IT",
    markLabel: "partitelle",
    ogImageAlt:
      "logo di partitelle: fischietto nero e scritta partitelle su fondo giallo",
  },
  hero: {
    title: "la partita del mercoledì, senza il caos nel gruppo.",
    subtitle:
      "partitelle raccoglie chi c'è, tiene la lista aggiornata e fa le squadre. tu pensa solo a giocare.",
    ctaPrimary: "Aggiungi il bot al gruppo",
    ctaSmall: "Aggiungi il bot",
    availability: "disponibile su Telegram",
    sectionLabel: "partitelle",
  },
  problem: {
    title: "il problema",
    items: [
      {
        line: "chi c'è mercoledì?",
        detail: "messaggi su messaggi per contare dieci persone.",
      },
      {
        line: "copia la lista, aggiungi il tuo nome, incolla.",
        detail: "e se due rispondono insieme, qualcuno sparisce.",
      },
      {
        line: "squadre fatte a occhio.",
        detail: "e finisce sempre con la stessa discussione.",
      },
    ],
  },
  how: {
    title: "come funziona",
    steps: [
      {
        title: "aggiungi il bot al gruppo",
        body: "avvii la partita e il bot apre la lista: mercoledì alle 20:00, dieci posti. giorno, ora e campo li cambi quando vuoi.",
        panelLabel:
          "esempio di riepilogo appena aperto: mercoledì alle 20:00, 1 posto preso su 10.",
      },
      {
        title: "ognuno si segna con una parola",
        body: "niente moduli e niente app da scaricare: si scrive nel gruppo e la lista si aggiorna da sola.",
        panelLabel:
          "esempio di riepilogo: 9 posti presi su 10, di cui 2 in forse.",
      },
      {
        title: "squadre sorteggiate",
        body: "quando tutti e dieci hanno confermato, il bot sorteggia le squadre: nera e bianca, cinque contro cinque.",
        panelLabel:
          "esempio di squadre: squadra nera e squadra bianca, cinque contro cinque.",
      },
    ],
    keywordsLabel: "le parole da scrivere",
    keywords: [
      { word: "aggiungimi", meaning: "ci sei" },
      { word: "proponimi", meaning: "sei in forse, e il posto resta tuo" },
      { word: "toglimi", meaning: "liberi il posto" },
      {
        word: "scambia luca con sara",
        meaning: "cambi due nomi tra le squadre",
      },
    ],
  },
  demo: {
    title: "provalo",
    line: "manca solo uno. sei tu?",
    intro:
      "tocca una parola come se la scrivessi nel gruppo: la lista si aggiorna da sola. con dieci conferme, fai le squadre.",
    note: "è una prova: non parte nessun messaggio.",
    you: "tu",
    summaryLabel: "riepilogo di prova: si aggiorna a ogni parola che tocchi.",
    keywordsLabel: "scrivi nel gruppo",
    keywords: ["aggiungimi", "proponimi", "toglimi"],
    makeTeams: "fai le squadre",
    hintMissingOne: "manca 1 conferma",
    hintMissing: "mancano {n} conferme",
    hintReady: "sorteggio, cinque contro cinque",
    teamsPlaceholder: "qui escono le squadre sorteggiate.",
    teamsLabel: "squadre di prova, sorteggiate: squadra nera e squadra bianca.",
    reset: "ricomincia",
    status: {
      initial: "nove posti presi, manca il tuo.",
      added: "ci sei: posto {slot}.",
      confirmed: "ora ci sei, non più in forse: posto {slot}.",
      proposed:
        "sei in forse: il posto {slot} resta tuo, ma non conti per le squadre.",
      movedToMaybe:
        "ora sei in forse: il posto {slot} resta tuo, ma non conti per le squadre.",
      alreadyIn: "ci sei già: posto {slot}.",
      alreadyMaybe: "sei già in forse: posto {slot}.",
      full: "la lista è piena: {target} posti su {target}.",
      removed: "fatto: il tuo posto ora è libero.",
      notIn: "non sei in lista: non c'è niente da togliere.",
      teamsMadeBlack: "squadre sorteggiate: sei nella squadra nera.",
      teamsMadeWhite: "squadre sorteggiate: sei nella squadra bianca.",
      teamsShownBlack: "le squadre ci sono già: sei nella squadra nera.",
      teamsShownWhite: "le squadre ci sono già: sei nella squadra bianca.",
      teamsLockedOne: "per le squadre servono dieci conferme: ne manca 1.",
      teamsLocked: "per le squadre servono dieci conferme: ne mancano {n}.",
      revokedSuffix: " squadre annullate, servono di nuovo dieci conferme.",
      reachedSuffix: " dieci conferme, ora puoi fare le squadre.",
    },
  },
  panels: {
    day: "mercoledì",
    time: "20:00",
    place: "campo 2 · centro sportivo",
    listLabel: "giocatori",
    maybe: "forse",
    emptySlot: "posto libero",
    more: "e altri {n} posti",
    counterSrOne: "1 posto preso su {target}",
    moreOne: "e altro 1 posto",
    counterSr: "{n} posti presi su {target}",
    teamBlack: "squadra nera",
    teamWhite: "squadra bianca",
    names: [
      "luca",
      "sara",
      "marco",
      "chiara",
      "andrea",
      "elena",
      "paolo",
      "marta",
      "davide",
      "irene",
    ],
  },
  features: {
    title: "cosa fa",
    line: "meno messaggi, più partita.",
    summaryLabel:
      "esempio di riepilogo: mercoledì alle 20:00, campo 2, 6 posti presi su 10, di cui 1 in forse.",
    items: [
      {
        title: "una lista sola, sempre aggiornata",
        body: "il bot scrive il riepilogo una volta e poi lo aggiorna nello stesso messaggio. giorno, ora, posti e campo li cambi quando vuoi.",
      },
      {
        title: "in forse? il posto resta tuo",
        body: "nel dubbio ti segni in forse: tieni il posto, ma per le squadre contano solo le conferme.",
        keyword: "proponimi",
      },
      {
        title: "squadre sorteggiate, ritocchi con una riga",
        body: "con tutte le conferme chiedi le squadre: nera e bianca, sorteggiate. per cambiare due nomi basta scriverlo.",
        keyword: "scambia luca con sara",
      },
    ],
  },
  finalCta: {
    title: ["mercoledì si gioca.", "al resto pensa il bot."],
    availability: "oggi su Telegram, domani non solo",
  },
  footer: {
    tagline: "fatto da chi organizza la partita del mercoledì",
    github: "partitelle su GitHub",
    githubLabel: "github",
    rights: "tutti i diritti riservati",
    logoAlt: "partitelle",
    privacyLabel: "privacy",
    privacy: "informativa privacy",
  },
  links: {
    bot: "https://t.me/PartitelleBot?startgroup=true",
    github: "https://github.com/partitelle",
    privacy: "/privacy",
  },
  privacy,
} as const;
