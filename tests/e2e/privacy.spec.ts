import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const SITE_URL = "https://partitelle.com/";
const PRIVACY_URL = "https://partitelle.com/privacy/";

const HEADINGS = [
  "1. chi siamo",
  "2. di cosa parla questa informativa",
  "3. quali dati salviamo",
  "4. cosa leggiamo ma non salviamo",
  "5. cosa non raccogliamo",
  "6. da dove arrivano i dati",
  "7. perché li usiamo e su quale base",
  "8. cosa non facciamo",
  "9. chi altro tratta i dati",
  "10. trasferimenti fuori dall'Unione europea",
  "11. per quanto tempo conserviamo i dati",
  "12. i tuoi diritti",
  "13. nomi aggiunti da altri e minori",
  "14. il sito partitelle.com",
  "15. decisioni automatizzate",
  "16. modifiche",
];

for (const path of ["/privacy/", "/privacy"]) {
  test(`${path} serves the privacy notice`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "informativa privacy",
    );
  });
}

test("has the 16 sections in order, with the update date", async ({ page }) => {
  await page.goto("/privacy/");
  await expect(page.getByRole("heading", { level: 2 })).toHaveText(HEADINGS);
  await expect(page.locator("main")).toContainText(
    "ultimo aggiornamento: 1 novembre 2026",
  );
  await expect(page.locator("time")).toHaveAttribute("datetime", "2026-11-01");
  await expect(page.locator("time")).toHaveAttribute(
    "datetime",
    /^\d{4}-\d{2}-\d{2}$/,
  );
  await expect(page).toHaveTitle("informativa privacy · partitelle");
});

test("every index link targets an existing section", async ({ page }) => {
  await page.goto("/privacy/");
  const hrefs = await page
    .getByRole("navigation", { name: "indice" })
    .getByRole("link")
    .evaluateAll((els) => els.map((el) => el.getAttribute("href")));
  expect(hrefs).toHaveLength(16);
  for (const href of hrefs) {
    await expect(page.locator(href as string)).toHaveCount(1);
    await expect(page.locator(href as string)).toHaveRole("heading");
  }
});

test("links go where the notice says", async ({ page }) => {
  await page.goto("/privacy/");
  const mails = page.locator('a[href^="mailto:"]');
  expect(await mails.count()).toBeGreaterThanOrEqual(2);
  const mailHrefs = await mails.evaluateAll((els) =>
    els.map((el) => el.getAttribute("href")),
  );
  for (const href of mailHrefs)
    expect(href).toBe("mailto:privacy@partitelle.com");
  const article = page.locator("article");
  await expect(
    article.getByRole("link", { name: "telegram.org/privacy" }),
  ).toHaveAttribute("href", "https://telegram.org/privacy");
  await expect(
    article.getByRole("link", { name: "garanteprivacy.it" }),
  ).toHaveAttribute("href", "https://www.garanteprivacy.it");
  await expect(
    article.getByRole("link", {
      name: "docs.github.com/site-policy/privacy-policies",
    }),
  ).toHaveAttribute(
    "href",
    "https://docs.github.com/site-policy/privacy-policies",
  );
  await expect(
    article.getByRole("link", { name: "punto 7 d)" }),
  ).toHaveAttribute("href", "#perche-li-usiamo");
  await expect(
    article.getByRole("link", { name: "punto 12" }).first(),
  ).toHaveAttribute("href", "#i-tuoi-diritti");
  await expect(page.locator("#cosa-non-facciamo")).toHaveCount(1);
  await expect(
    page
      .locator('section[aria-labelledby="cosa-non-facciamo"]')
      .getByRole("link", { name: "punto 9" }),
  ).toHaveAttribute("href", "#chi-altro-tratta-i-dati");
  await expect(
    page
      .locator('section[aria-labelledby="chi-altro-tratta-i-dati"]')
      .getByRole("link", { name: "punto 8" }),
  ).toHaveAttribute("href", "#cosa-non-facciamo");
});

test("names the controller", async ({ page }) => {
  await page.goto("/privacy/");
  await expect(
    page.locator('section[aria-labelledby="chi-siamo"]'),
  ).toContainText(
    "il titolare del trattamento dei dati è Giovanni Laganà, la persona che gestisce partitelle, come privato: partitelle non è una società.",
  );
});

test("carries the agreed wording of the final copy", async ({ page }) => {
  await page.goto("/privacy/");
  await expect(
    page.locator('section[aria-labelledby="cosa-leggiamo"]'),
  ).toContainText(
    "per un periodo limitato (al massimo 30 giorni), secondo le sue regole.",
  );
  await expect(
    page.locator('section[aria-labelledby="chi-altro-tratta-i-dati"]'),
  ).toContainText("Neon (Neon, LLC, del gruppo Databricks, USA)");
  await expect(
    page.locator('section[aria-labelledby="trasferimenti"]'),
  ).toContainText("tutti e tre aderiscono all'EU-U.S. Data Privacy Framework");
  await expect(
    page.getByText(
      "se partitelle passa a un'altra persona o società, i dati passano con il servizio e questa informativa continua a valere.",
    ),
  ).toBeVisible();
  await expect(
    page.getByText(
      '1 novembre 2026: aggiunto l\'ID utente Telegram tra i dati salvati; riscritti "cosa non facciamo" e il punto 7 d); aggiunto cosa succede ai dati se partitelle passa ad altri; descritti meglio i messaggi che il bot legge, i dati salvati, quelli delle versioni precedenti e i log.',
    ),
  ).toBeVisible();
});

test("declares the /status exception and the Render role", async ({ page }) => {
  await page.goto("/privacy/");
  await expect(
    page.locator('section[aria-labelledby="il-sito"]'),
  ).toContainText(
    "il sito non usa cookie, non usa strumenti di analisi o di tracciamento e non carica risorse da altri siti (i caratteri sono ospitati sul sito stesso). unica eccezione: quando apri la pagina /status, il tuo browser chiede al server del bot, ospitato da Render, se è attivo. come per qualsiasi richiesta, Render riceve l'indirizzo IP e il tipo di browser e può tenerli nei suoi log per un periodo limitato. la risposta non contiene dati personali e la pagina non salva nulla sul tuo dispositivo.",
  );
  await expect(
    page.locator('section[aria-labelledby="chi-altro-tratta-i-dati"]'),
  ).toContainText(
    "Render (Render Services, Inc., USA): ospita il server del bot e i suoi log, e risponde alla pagina /status del sito.",
  );
  await expect(
    page.getByText(
      "1 novembre 2026: aggiunta la pagina /status, che chiede al server del bot se è attivo.",
    ),
  ).toBeVisible();
});

test("ships no placeholder or internal word", async ({ page }) => {
  await page.goto("/privacy/");
  const text = (await page.locator("body").textContent()) ?? "";
  const html = await page.content();
  for (const haystack of [text, html]) {
    expect(haystack).not.toContain("{{");
    expect(haystack).not.toMatch(/\[(RENDER|TRANSFER|DATA_|CONTROLLER|SCELTA)/);
    expect(haystack).not.toMatch(/LAWYER/i);
    expect(haystack).not.toContain("CEO");
  }
  // A placeholder date ("XX novembre", "2026-11-XX") must never ship.
  // Checked on the visible text only: hashed asset names in the html could contain "XX".
  expect(text).not.toMatch(/\bXX\b/);
  await expect(page.locator("time")).not.toContainText("XX");
});

test("loads no external resource", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.hostname !== "localhost") external.push(request.url());
  });
  await page.goto("/privacy/");
  await page.waitForLoadState("networkidle");
  expect(external).toEqual([]);
});

test("declares its own canonical, and the home keeps the site root", async ({
  page,
}) => {
  await page.goto("/privacy/");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    PRIVACY_URL,
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    PRIVACY_URL,
  );
  const jsonLd = JSON.parse(
    (await page
      .locator('script[type="application/ld+json"]')
      .textContent()) as string,
  );
  expect(jsonLd.url).toBe(SITE_URL);

  await page.goto("/");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    SITE_URL,
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    SITE_URL,
  );
});

test("the home footer links to the notice", async ({ page }) => {
  await page.goto("/");
  const link = page
    .getByRole("contentinfo")
    .getByRole("link", { name: "informativa privacy" });
  await expect(link).toHaveAttribute("href", "/privacy");
  await expect(link).not.toHaveAttribute("aria-current", /.*/);
  await link.click();
  await expect(page).toHaveURL(/\/privacy\/?$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "informativa privacy" }),
  ).toBeVisible();
});

test("on the notice the footer link is the current page", async ({ page }) => {
  await page.goto("/privacy/");
  await expect(
    page
      .getByRole("contentinfo")
      .getByRole("link", { name: "informativa privacy" }),
  ).toHaveAttribute("aria-current", "page");
});

test("the privacy link is not a paragraph and sits before the copyright", async ({
  page,
}) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  expect(await footer.locator("p a").count()).toBe(0);
  const privacy = footer.getByRole("link", { name: "informativa privacy" });
  const rights = footer.locator("p").last();
  const privacyBeforeRights = await privacy.evaluate(
    (el, next) =>
      Boolean(
        el.compareDocumentPosition(next as Node) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    await rights.elementHandle(),
  );
  expect(privacyBeforeRights).toBe(true);
});

test("the sitemap lists the notice", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap-0.xml")).text();
  expect(sitemap).toContain(`<loc>${PRIVACY_URL}</loc>`);
  expect(sitemap).toContain(`<loc>${SITE_URL}</loc>`);
});

test("has no axe violations", async ({ page }) => {
  await page.goto("/privacy/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("does not scroll sideways", async ({ page }) => {
  for (const width of [360, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/privacy/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow, `width ${width}`).toBeLessThanOrEqual(0);
  }
});
