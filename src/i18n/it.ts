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
        title: "squadre a sorte e promemoria",
        body: "quando tutti e dieci hanno confermato, il bot fa le squadre a sorte. dopo la partita ricorda a chi non ha ancora pagato la quota.",
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
  footer: {
    tagline: "fatto da chi organizza la partita del mercoledì",
    github: "partitelle su GitHub",
    githubLabel: "github",
    logoAlt: "partitelle",
  },
  links: {
    bot: "https://t.me/PartitelleBot?startgroup=true",
    github: "https://github.com/partitelle",
  },
} as const;
