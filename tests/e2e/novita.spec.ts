import { readdirSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const SITE_URL = "https://partitelle.com";
const BOT_HOST = /partitelle-bot\.onrender\.com/;
const SLUGS = readdirSync("src/content/novita")
  .filter((f) => f.endsWith(".md"))
  .map((f) => f.replace(/\.md$/, ""));
const MINI_APP = "arriva-la-mini-app";
const REMINDER = "il-promemoria-non-si-perde";
const OLDEST = "nasce-il-bot";
const SAMPLE = [`/novita/`, `/novita/${MINI_APP}/`, `/novita/${REMINDER}/`];

// Records every request to the bot host (and blocks it, so tests stay offline).
async function watchBot(page: Page) {
  const hits: string[] = [];
  await page.route(BOT_HOST, (route) => {
    hits.push(route.request().url());
    return route.abort();
  });
  return hits;
}

test("the collection holds the 11 posts", () => {
  expect(SLUGS).toHaveLength(11);
});

test.describe("index", () => {
  test("title, canonical, heading and years", async ({ page }) => {
    const response = await page.goto("/novita/");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle("novità · partitelle");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${SITE_URL}/novita/`,
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("novità");
    await expect(page.getByRole("heading", { level: 2 })).toHaveText([
      "2026",
      "2024",
      "2022",
    ]);
    await expect(page.getByRole("heading", { level: 3 })).toHaveCount(11);
    await expect(page.locator("main")).toContainText(
      "abbiamo aperto questa pagina a novembre 2026.",
    );
  });

  test("lists posts newest first with the same-day order", async ({ page }) => {
    await page.goto("/novita/");
    const hrefs = await page
      .locator("main h3 a")
      .evaluateAll((els) => els.map((el) => el.getAttribute("href")));
    expect(hrefs.slice(0, 4)).toEqual([
      `/novita/${MINI_APP}/`,
      "/novita/il-bot-risponde/",
      `/novita/${REMINDER}/`,
      "/novita/come-usiamo-i-tuoi-dati/",
    ]);
    expect(hrefs.at(-1)).toBe(`/novita/${OLDEST}/`);
  });

  test("dates are formatted in Italian from the stored day", async ({
    page,
  }) => {
    await page.goto("/novita/");
    const first = page.locator("main article time").first();
    await expect(first).toHaveAttribute("datetime", "2026-11-02");
    await expect(first).toHaveText("2 novembre 2026");
    const last = page.locator("main article time").last();
    await expect(last).toHaveAttribute("datetime", "2022-04-16");
    await expect(last).toHaveText("16 aprile 2022");
  });
});

test.describe("post", () => {
  test("every post has its canonical and article metadata", async ({
    page,
  }) => {
    for (const slug of SLUGS) {
      const response = await page.goto(`/novita/${slug}/`);
      expect(response?.status()).toBe(200);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        `${SITE_URL}/novita/${slug}/`,
      );
      await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
        "content",
        "article",
      );
      // Posts written after the fact never claim the old date as published time.
      await expect(
        page.locator('meta[property="article:published_time"]'),
      ).toHaveCount(0);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(
        page.getByRole("heading", { level: 2, name: "cosa cambia per te" }),
      ).toBeVisible();
      await expect(page.locator("main")).toContainText(
        "questa novità l'abbiamo scritta a novembre 2026, ripercorrendo la storia del bot.",
      );
    }
  });

  test("the mini app post: band, changes, closing line, others", async ({
    page,
  }) => {
    await page.goto(`/novita/${MINI_APP}/`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "la partita in un tocco: arriva la mini app",
    );
    await expect(
      page.getByRole("link", { name: "← tutte le novità" }),
    ).toHaveAttribute("href", "/novita/");
    await expect(
      page.locator("[aria-labelledby=post-title] time"),
    ).toHaveAttribute("datetime", "2026-11-02");
    await expect(
      page.locator("[aria-labelledby=post-title] ul li"),
    ).toHaveCount(5);
    await expect(page.locator("[aria-labelledby=post-title]")).toContainText(
      "versione del bot: 1.10.0",
    );
    const others = page.getByRole("navigation", { name: "altre novità" });
    // The newest post only has an older neighbour.
    await expect(others.locator("article")).toHaveCount(1);
    await expect(others.getByRole("heading", { level: 2 })).toHaveText([
      "il bot risponde? ora puoi controllarlo",
    ]);
    await expect(page.locator("#gioca")).toBeVisible();
  });

  test("the mini app post links the privacy notice, underlined", async ({
    page,
  }) => {
    await page.goto(`/novita/${MINI_APP}/`);
    const link = page.locator("main a[href^='/privacy']");
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute("href", "/privacy#mini-app");
    await expect(link).toHaveCSS("text-decoration-line", "underline");
    await expect(link.locator("xpath=..")).toHaveText(
      "l’informativa privacy ora spiega anche la mini app.",
    );
  });

  test("the closing divider and the other posts share one width", async ({
    page,
  }) => {
    for (const slug of [MINI_APP, REMINDER, OLDEST]) {
      await page.goto(`/novita/${slug}/`);
      const closing = page.locator("[aria-labelledby=post-title] .border-t");
      const rows = page
        .getByRole("navigation", { name: "altre novità" })
        .locator("article");
      const ref = await closing.boundingBox();
      expect(ref).not.toBeNull();
      expect(await rows.count()).toBeGreaterThan(0);
      for (const row of await rows.all()) {
        const box = await row.boundingBox();
        expect(box?.x).toBeCloseTo(ref?.x ?? -1, 1);
        expect(box?.width).toBeCloseTo(ref?.width ?? -1, 1);
      }
    }
  });

  test("a middle post links to the newer and the older one", async ({
    page,
  }) => {
    await page.goto(`/novita/${REMINDER}/`);
    const others = page.getByRole("navigation", { name: "altre novità" });
    await expect(others.getByRole("heading", { level: 2 })).toHaveText([
      "il bot risponde? ora puoi controllarlo",
      "come usiamo i tuoi dati, scritto chiaro",
    ]);
  });

  test("a post without a version has no version line", async ({ page }) => {
    await page.goto("/novita/il-bot-risponde/");
    await expect(
      page.locator("[aria-labelledby=post-title]"),
    ).not.toContainText("versione del");
  });

  test("the oldest post has only a newer neighbour", async ({ page }) => {
    await page.goto(`/novita/${OLDEST}/`);
    const others = page.getByRole("navigation", { name: "altre novità" });
    await expect(others.locator("article")).toHaveCount(1);
  });
});

test.describe("home teaser", () => {
  test("shows the 3 latest posts between features and the final call", async ({
    page,
  }) => {
    await page.goto("/");
    const section = page.locator("#novita");
    await expect(
      section.getByRole("heading", { level: 2, name: "novità" }),
    ).toBeVisible();
    await expect(section).toContainText("il bot cresce. ecco cosa è cambiato.");
    await expect(section.getByRole("heading", { level: 3 })).toHaveText([
      "la partita in un tocco: arriva la mini app",
      "il bot risponde? ora puoi controllarlo",
      "il promemoria per la quota non si perde più al riavvio",
    ]);
    await expect(
      section.getByRole("link", { name: "tutte le novità" }),
    ).toHaveAttribute("href", "/novita/");
    const ids = await page
      .locator("main > section")
      .evaluateAll((els) => els.map((el) => el.id));
    expect(ids.slice(-2)).toEqual(["novita", "gioca"]);
  });
});

test.describe("header and footer navigation", () => {
  const cases: [string, string | null, string | null][] = [
    ["/", null, null],
    ["/privacy/", null, null],
    ["/status/", null, "page"],
    ["/novita/", "page", null],
    [`/novita/${MINI_APP}/`, "true", null],
  ];
  for (const [path, news, status] of cases) {
    test(`two links and the right aria-current on ${path}`, async ({
      page,
    }) => {
      await watchBot(page);
      await page.goto(path);
      const nav = page.getByRole("navigation", { name: "sezioni" });
      await expect(nav.getByRole("link")).toHaveText(["novità", "stato"]);
      const novita = nav.getByRole("link", { name: "novità" });
      const stato = nav.getByRole("link", { name: "stato" });
      await expect(novita).toHaveAttribute("href", "/novita/");
      await expect(stato).toHaveAttribute("href", "/status/");
      for (const [link, value] of [
        [novita, news],
        [stato, status],
      ] as const) {
        if (value) await expect(link).toHaveAttribute("aria-current", value);
        else await expect(link).not.toHaveAttribute("aria-current", /.*/);
      }
    });
  }

  test("the header sits on one row from 640 px and on two below", async ({
    page,
  }) => {
    const tops = async () =>
      page.evaluate(() => {
        const top = (s: string) =>
          document.querySelector(s)?.getBoundingClientRect().top ?? -1;
        return {
          logo: top("header > a"),
          nav: top("header nav li a"),
          pill: top("header > a:last-child"),
        };
      });
    await page.setViewportSize({ width: 640, height: 800 });
    await page.goto("/novita/");
    const wide = await tops();
    expect(Math.abs(wide.nav - wide.pill)).toBeLessThan(24);
    await page.setViewportSize({ width: 390, height: 800 });
    const narrow = await tops();
    expect(narrow.nav).toBeGreaterThan(narrow.pill + 24);
  });

  test("the footer order is novità, stato, privacy, github", async ({
    page,
  }) => {
    await page.goto("/novita/");
    const footer = page.getByRole("contentinfo");
    const order = await footer
      .locator("a")
      .evaluateAll((els) => els.map((el) => el.textContent?.trim()));
    expect(order.slice(0, 4)).toEqual(["novità", "stato", "privacy", "github"]);
    await expect(footer.getByRole("link", { name: "novità" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(footer.locator('[aria-current="page"]')).toHaveCount(1);
  });
});

test.describe("quality", () => {
  for (const path of [...SAMPLE, "/"]) {
    test(`no axe violations on ${path}`, async ({ page }) => {
      await page.goto(path);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    });
  }

  test("the badges are decorative and show the right icon", async ({
    page,
  }) => {
    await page.goto("/novita/");
    const badges = page.locator("main article > span[aria-hidden='true']");
    await expect(badges).toHaveCount(11);
    await expect(badges.first().locator("svg")).toHaveCount(1);
    const size = await badges
      .first()
      .evaluate((el) => el.getBoundingClientRect().width);
    expect(size).toBe(48);
  });

  for (const path of [...SAMPLE, "/privacy/"]) {
    test(`at most one whistle mark on ${path}`, async ({ page }) => {
      await page.goto(path);
      expect(await page.locator("[data-whistle]").count()).toBeLessThanOrEqual(
        1,
      );
    });
  }

  test("pages load nothing from other origins and no script", async ({
    page,
    baseURL,
  }) => {
    for (const path of SAMPLE) {
      const origins = new Set<string>();
      const onRequest = (r: { url(): string }) => {
        const url = new URL(r.url());
        if (url.protocol === "http:" || url.protocol === "https:")
          origins.add(url.origin);
      };
      page.on("request", onRequest);
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      page.off("request", onRequest);
      expect([...origins], path).toEqual([new URL(baseURL as string).origin]);
      await expect(
        page.locator('script:not([type="application/ld+json"])'),
      ).toHaveCount(0);
    }
  });

  test("home, novità, a post and privacy never contact the bot", async ({
    page,
  }) => {
    const hits = await watchBot(page);
    for (const path of ["/", "/novita/", `/novita/${MINI_APP}/`, "/privacy/"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
    }
    expect(hits).toEqual([]);
  });

  test("no post body names a sport", async ({ page }) => {
    for (const slug of SLUGS) {
      await page.goto(`/novita/${slug}/`);
      const text = await page
        .locator("[aria-labelledby=post-title]")
        .textContent();
      expect(text ?? "", slug).not.toMatch(
        /calcio|calcetto|calciatori|pallone|football|soccer|basket|tennis|padel|equilibrat|a sorte/i,
      );
    }
  });

  test("the sitemap lists the index and every post", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap-0.xml")).text();
    expect(sitemap).toContain(`<loc>${SITE_URL}/novita/</loc>`);
    for (const slug of SLUGS)
      expect(sitemap).toContain(`<loc>${SITE_URL}/novita/${slug}/</loc>`);
  });

  test.describe("narrow viewport", () => {
    test.use({ viewport: { width: 320, height: 800 } });

    for (const path of [...SAMPLE, "/", "/status/", "/privacy/"]) {
      test(`no horizontal scroll at 320 on ${path}`, async ({ page }) => {
        await watchBot(page);
        await page.goto(path);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);
      });
    }
  });
});
