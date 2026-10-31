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
        title: "squadre a sorte",
        body: "quando tutti e dieci hanno confermato, il bot fa le squadre a sorte: nera e bianca, cinque contro cinque.",
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
    hintReady: "a sorte, cinque contro cinque",
    teamsPlaceholder: "qui escono le squadre, a sorte.",
    teamsLabel:
      "squadre di prova, fatte a sorte: squadra nera e squadra bianca.",
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
      teamsMadeBlack: "squadre fatte a sorte: sei nella squadra nera.",
      teamsMadeWhite: "squadre fatte a sorte: sei nella squadra bianca.",
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
        title: "forse? il posto resta tuo",
        body: "nel dubbio ti segni in forse: tieni il posto, ma per le squadre contano solo le conferme.",
        keyword: "proponimi",
      },
      {
        title: "squadre a sorte, ritocchi con una riga",
        body: "con tutte le conferme chiedi le squadre: nera e bianca, fatte a sorte. per cambiare due nomi basta scriverlo.",
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
  },
  links: {
    bot: "https://t.me/PartitelleBot?startgroup=true",
    github: "https://github.com/partitelle",
  },
} as const;
