import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const HEALTH = "https://partitelle-bot.onrender.com/health";
const STATUS_URL = "https://partitelle.com/status/";
const VERSION = "9.9.9-abc1234";
const cors = { "access-control-allow-origin": "*" };

type Mock = "up" | "degraded";

function json(status: number, body: unknown) {
  return {
    status,
    contentType: "application/json",
    headers: cors,
    body: JSON.stringify(body),
  };
}

const responses = {
  up: () => json(200, { status: "ok", version: VERSION, database: "ok" }),
  degraded: () =>
    json(503, { status: "degraded", version: VERSION, database: "error" }),
} satisfies Record<Mock, () => object>;

// Counts the requests that reach the (mocked) health endpoint.
async function mockHealth(
  page: Page,
  respond: Parameters<Page["route"]>[1],
): Promise<{ count: () => number; urls: string[] }> {
  const urls: string[] = [];
  await page.route(HEALTH, (route, request) => {
    urls.push(request.url());
    return respond(route, request);
  });
  return { count: () => urls.length, urls };
}

const panel = (page: Page) => page.locator("[data-status-panel]");
const region = (page: Page) => page.getByRole("status");
const retry = (page: Page) =>
  page.getByRole("button", { name: "controlla di nuovo" });

test.describe("final states", () => {
  test("up: the bot answers 200 and status ok", async ({ page }) => {
    await mockHealth(page, (route) => route.fulfill(responses.up()));
    await page.goto("/status/");
    await expect(region(page)).toContainText("il bot è attivo");
    await expect(region(page)).toContainText(
      "risponde e riesce a leggere e salvare le partite.",
    );
    await expect(panel(page)).toHaveAttribute("data-state", "up");
    await expect(panel(page)).toHaveClass(/bg-yellow/);
    await expect(page.locator("main")).toContainText("controllato alle");
    await expect(page.locator("[data-time]")).toHaveText(/^\d{2}:\d{2}$/);
    await expect(page.locator("[data-time]")).toHaveAttribute(
      "datetime",
      /^\d{4}-\d{2}-\d{2}T/,
    );
    await expect(retry(page)).toBeVisible();
    await expect(retry(page)).toHaveAttribute("aria-disabled", "false");
  });

  test("degraded: status degraded on a 503, on the dark panel", async ({
    page,
  }) => {
    await mockHealth(page, (route) => route.fulfill(responses.degraded()));
    await page.goto("/status/");
    await expect(region(page)).toContainText("il bot ha un problema");
    await expect(panel(page)).toHaveAttribute("data-state", "degraded");
    await expect(panel(page)).toHaveClass(/on-dark/);
    await expect(panel(page)).toHaveClass(/bg-black/);
    await expect(retry(page)).toHaveClass(/bg-yellow/);
    await expect(retry(page)).toBeVisible();
  });

  test("degraded is accepted with any status code", async ({ page }) => {
    await mockHealth(page, (route) =>
      route.fulfill(json(200, { status: "degraded" })),
    );
    await page.goto("/status/");
    await expect(region(page)).toContainText("il bot ha un problema");
  });

  const unknownCases: [string, Parameters<Page["route"]>[1]][] = [
    ["a network or CORS error", (route) => route.abort()],
    [
      "a 500 with an HTML body",
      (route) =>
        route.fulfill({
          status: 500,
          contentType: "text/html",
          headers: cors,
          body: "<html><body>Bad gateway</body></html>",
        }),
    ],
    [
      "a 200 with an HTML body",
      (route) =>
        route.fulfill({
          status: 200,
          contentType: "text/html",
          headers: cors,
          body: "<html><body>hello</body></html>",
        }),
    ],
    [
      "malformed JSON",
      (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: cors,
          body: '{"status": "ok"',
        }),
    ],
    [
      "an unexpected status value",
      (route) => route.fulfill(json(200, { status: "weird" })),
    ],
    [
      "a status ok with a non-200 code",
      (route) => route.fulfill(json(500, { status: "ok" })),
    ],
    ["a JSON null body", (route) => route.fulfill(json(200, null))],
  ];
  for (const [name, respond] of unknownCases) {
    test(`unknown: ${name}`, async ({ page }) => {
      await mockHealth(page, respond);
      await page.goto("/status/");
      await expect(region(page)).toContainText("nessuna risposta dal bot");
      await expect(panel(page)).toHaveAttribute("data-state", "unknown");
      await expect(panel(page)).toHaveClass(/bg-paper/);
      await expect(page.locator("main")).toContainText("controllato alle");
      await expect(retry(page)).toBeVisible();
    });
  }
});

test.describe("waiting", () => {
  test("checking, then waking at 5 s, then unknown at the 60 s timeout", async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2026-11-01T21:04:00") });
    // The request never answers: only the client timeout ends it.
    const health = await mockHealth(page, () => new Promise(() => {}));
    await page.goto("/status/");
    await expect(region(page)).toContainText("controllo in corso");
    await expect(panel(page)).toHaveAttribute("data-state", "checking");
    await expect(retry(page)).toBeHidden();
    await expect(page.locator("[data-checked]")).toBeHidden();

    await page.clock.fastForward(4_000);
    await expect(region(page)).toContainText("controllo in corso");
    await page.clock.fastForward(1_500);
    await expect(region(page)).toContainText("ancora un attimo");
    await expect(region(page)).toContainText("non serve ricaricare la pagina");
    await expect(panel(page)).toHaveAttribute("data-state", "waking");

    await page.clock.fastForward(50_000);
    await expect(region(page)).toContainText("ancora un attimo");
    await page.clock.fastForward(5_000);
    await expect(region(page)).toContainText("nessuna risposta dal bot");
    await expect(page.locator("[data-time]")).toHaveText("21:05");
    expect(health.count()).toBe(1);
  });

  test("a slow answer after the wake-up message still shows the result", async ({
    page,
  }) => {
    await page.clock.install();
    await mockHealth(
      page,
      (route) =>
        new Promise<void>((resolve) => {
          // Answer on the page's clock, not the real one.
          page
            .evaluate(
              () =>
                new Promise<void>((done) => {
                  setTimeout(done, 8_000);
                }),
            )
            .then(() => route.fulfill(responses.up()))
            .then(resolve);
        }),
    );
    await page.goto("/status/");
    await page.clock.fastForward(5_500);
    await expect(region(page)).toContainText("ancora un attimo");
    await page.clock.fastForward(3_000);
    await expect(region(page)).toContainText("il bot è attivo");
  });
});

test.describe("retry", () => {
  test("one request per click, none while one is pending, focus stays", async ({
    page,
  }) => {
    let release: (() => void) | undefined;
    let n = 0;
    const health = await mockHealth(page, async (route) => {
      n += 1;
      if (n === 2) await new Promise<void>((r) => (release = r));
      await route.fulfill(n === 1 ? responses.degraded() : responses.up());
    });
    await page.goto("/status/");
    await expect(region(page)).toContainText("il bot ha un problema");
    expect(health.count()).toBe(1);

    await retry(page).focus();
    await retry(page).click();
    await expect(region(page)).toContainText("controllo in corso");
    await expect(retry(page)).toHaveAttribute("aria-disabled", "true");
    await expect(retry(page)).not.toHaveAttribute("disabled", /.*/);
    await expect(retry(page)).toBeFocused();
    await expect(retry(page)).toBeVisible();
    await expect(page.locator("[data-checked]")).toBeHidden();

    // Clicks and keyboard activations while pending do nothing.
    await retry(page).click({ force: true });
    await page.keyboard.press("Enter");
    await page.keyboard.press("Space");
    await expect.poll(() => health.count()).toBe(2);
    await page.waitForTimeout(200);
    expect(health.count()).toBe(2);

    release?.();
    await expect(region(page)).toContainText("il bot è attivo");
    await expect(retry(page)).toHaveAttribute("aria-disabled", "false");
    await expect(retry(page)).toBeFocused();
    await expect(panel(page)).toHaveAttribute("data-state", "up");

    await retry(page).click();
    await expect(region(page)).toContainText("il bot è attivo");
    expect(health.count()).toBe(3);
  });

  test("keeps 'controllo in corso' for at least 500 ms on a retry", async ({
    page,
  }) => {
    await mockHealth(page, (route) => route.fulfill(responses.up()));
    await page.goto("/status/");
    await expect(region(page)).toContainText("il bot è attivo");
    await page.evaluate(() => {
      const log: string[] = [];
      const r = document.querySelector('[role="status"]') as Element;
      new MutationObserver(() => {
        log.push(`${Math.round(performance.now())}:${r.textContent}`);
      }).observe(r, { childList: true, subtree: true, characterData: true });
      (window as unknown as { __log: string[] }).__log = log;
    });
    await retry(page).click();
    await expect(retry(page)).toHaveAttribute("aria-disabled", "false");
    const log = await page.evaluate(
      () => (window as unknown as { __log: string[] }).__log,
    );
    const at = (needle: string) =>
      Number(log.find((l) => l.includes(needle))?.split(":")[0]);
    expect(at("il bot è attivo") - at("controllo in corso")).toBeGreaterThan(
      450,
    );
  });
});

test.describe("what the page does and does not do", () => {
  test("one request on load, no params, no cookies or storage, no polling", async ({
    page,
  }) => {
    const health = await mockHealth(page, (route) =>
      route.fulfill(responses.up()),
    );
    await page.goto("/status/");
    await expect(region(page)).toContainText("il bot è attivo");
    await page.waitForTimeout(1_000);
    expect(health.urls).toEqual([HEALTH]);
    expect(await page.context().cookies()).toEqual([]);
    const storage = await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
    }));
    expect(storage).toEqual({ local: 0, session: 0 });
  });

  test("sends the request without cookies, referrer or cache", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __fetches: unknown[] };
      w.__fetches = [];
      const original = window.fetch.bind(window);
      window.fetch = (input, init) => {
        w.__fetches.push({ input: String(input), init });
        return original(input, init);
      };
    });
    let headers: Record<string, string> = {};
    await mockHealth(page, (route, request) => {
      headers = request.headers();
      return route.fulfill(responses.up());
    });
    await page.goto("/status/");
    await expect(region(page)).toContainText("il bot è attivo");
    expect(headers.cookie).toBeUndefined();
    expect(headers.referer).toBeUndefined();
    const fetches = await page.evaluate(
      () => (window as unknown as { __fetches: unknown[] }).__fetches,
    );
    expect(fetches).toEqual([
      {
        input: HEALTH,
        init: expect.objectContaining({
          cache: "no-store",
          credentials: "omit",
          referrerPolicy: "no-referrer",
        }),
      },
    ]);
  });

  test("never puts the response in the page", async ({ page }) => {
    await mockHealth(page, (route) => route.fulfill(responses.up()));
    await page.goto("/status/");
    await expect(region(page)).toContainText("il bot è attivo");
    const html = await page.content();
    expect(html).not.toContain(VERSION);
    const text = (await page.locator("body").textContent()) ?? "";
    expect(text).not.toContain(VERSION);
    expect(text).not.toContain("onrender.com");
  });

  test("makes no request to the bot on other pages", async ({ page }) => {
    const health = await mockHealth(page, (route) =>
      route.fulfill(responses.up()),
    );
    for (const path of ["/", "/privacy/"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
    }
    expect(health.count()).toBe(0);
  });

  test("without JavaScript it says it needs JavaScript", async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("http://localhost:4321/status/");
    await expect(
      page.getByText(
        "per controllare lo stato del bot, questa pagina ha bisogno di JavaScript.",
      ),
    ).toBeVisible();
    await expect(page.getByText("controllo in corso")).toBeHidden();
    await context.close();
  });
});

test.describe("accessibility and structure", () => {
  test("one h1, one live region with only title and text, no focus move", async ({
    page,
  }) => {
    await mockHealth(page, (route) => route.fulfill(responses.up()));
    await page.goto("/status/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "stato del bot",
    );
    await expect(page.getByRole("heading", { level: 2 })).toHaveText([
      "il bot è attivo",
      "come funziona questa pagina",
    ]);
    await expect(page.locator('[role="status"]')).toHaveCount(1);
    await expect(page.locator('[role="status"] > *')).toHaveCount(2);
    await expect(
      page.locator('[role="status"] button, [role="status"] a'),
    ).toHaveCount(0);
    await expect(page.locator('[role="status"]')).not.toHaveAttribute(
      "aria-busy",
      /.*/,
    );
    expect(
      await page.evaluate(() => document.activeElement === document.body),
    ).toBe(true);
  });

  for (const mock of ["up", "degraded", "unknown", "waiting"] as const) {
    test(`axe: no violations (${mock})`, async ({ page }) => {
      if (mock === "waiting")
        await mockHealth(page, () => new Promise(() => {}));
      else if (mock === "unknown") await mockHealth(page, (r) => r.abort());
      else await mockHealth(page, (r) => r.fulfill(responses[mock]()));
      await page.goto("/status/");
      if (mock !== "waiting") {
        await expect(panel(page)).not.toHaveAttribute("data-state", "checking");
      }
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test("the section below the panel keeps its y in all five states", async ({
    page,
  }) => {
    const states = ["checking", "waking", "up", "degraded", "unknown"] as const;
    for (const width of [360, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const tops: Record<string, number> = {};
      for (const state of states) {
        await page.unroute(HEALTH);
        await page.clock.install({ time: new Date("2026-11-01T21:04:00") });
        if (state === "checking" || state === "waking")
          await mockHealth(page, () => new Promise(() => {}));
        else if (state === "unknown") await mockHealth(page, (r) => r.abort());
        else await mockHealth(page, (r) => r.fulfill(responses[state]()));
        await page.goto("/status/");
        if (state === "waking") await page.clock.fastForward(5_500);
        await expect(panel(page)).toHaveAttribute("data-state", state);
        tops[state] = await page
          .getByRole("heading", { name: "come funziona questa pagina" })
          .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
      }
      for (const state of states) {
        expect(tops[state], `${state} at ${width}`).toBe(tops.checking);
      }
    }
  });

  test("does not scroll sideways", async ({ page }) => {
    await mockHealth(page, (route) => route.fulfill(responses.degraded()));
    for (const width of [360, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/status/");
      await expect(region(page)).toContainText("il bot ha un problema");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, `width ${width}`).toBeLessThanOrEqual(0);
      const box = await retry(page).boundingBox();
      const frame = await panel(page).boundingBox();
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(
        (frame?.x ?? 0) + (frame?.width ?? 0),
      );
    }
  });

  test("reduced motion: no running animation on the page", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await mockHealth(page, () => new Promise(() => {}));
    await page.goto("/status/");
    await retry(page)
      .click({ timeout: 500 })
      .catch(() => {});
    const running = await page.evaluate(
      () =>
        document.getAnimations().filter((a) => a.playState === "running")
          .length,
    );
    expect(running).toBe(0);
  });

  test("the mark is decorative and plays the whistle again on a retry", async ({
    page,
  }) => {
    await mockHealth(page, (route) => route.fulfill(responses.up()));
    await page.goto("/status/");
    const mark = page.locator("[data-status-panel] [data-whistle]");
    await expect(mark).toHaveAttribute("aria-hidden", "true");
    await expect(mark).not.toHaveAttribute("role", /.*/);
    // Wait for the load whistle to finish.
    await expect
      .poll(() =>
        mark.evaluate(
          (el) =>
            (el as unknown as SVGSVGElement)
              .getAnimations({ subtree: true })
              .filter((a) => a.playState === "running").length,
        ),
      )
      .toBe(0);
    await retry(page).click();
    const blowing = await mark.evaluate(
      (el) =>
        (el as unknown as SVGSVGElement)
          .getAnimations({ subtree: true })
          .filter((a) => a.playState === "running").length,
    );
    expect(blowing).toBeGreaterThan(0);
  });
});

test.describe("head and footer", () => {
  test("title, description and canonical", async ({ page }) => {
    await mockHealth(page, (route) => route.fulfill(responses.up()));
    await page.goto("/status/");
    await expect(page).toHaveTitle("stato del bot · partitelle");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      "controlla se il bot di partitelle risponde in questo momento.",
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      STATUS_URL,
    );
    const response = await page.goto("/status");
    expect(response?.status()).toBe(200);
  });

  test("the sitemap lists the page", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap-0.xml")).text();
    expect(sitemap).toContain(`<loc>${STATUS_URL}</loc>`);
  });

  for (const [path, current] of [
    ["/", false],
    ["/privacy/", false],
    ["/status/", true],
  ] as const) {
    test(`footer link "stato" on ${path}`, async ({ page }) => {
      await mockHealth(page, (route) => route.fulfill(responses.up()));
      await page.goto(path);
      const footer = page.getByRole("contentinfo");
      const link = footer.getByRole("link", { name: "stato del bot" });
      await expect(link).toHaveAttribute("href", "/status");
      await expect(link).toHaveText("stato");
      if (current) await expect(link).toHaveAttribute("aria-current", "page");
      else await expect(link).not.toHaveAttribute("aria-current", /.*/);
      // aria-current stays exclusive to the current page.
      await expect(footer.locator('[aria-current="page"]')).toHaveCount(
        current ? 1 : path === "/privacy/" ? 1 : 0,
      );
      const order = await footer
        .locator("a")
        .evaluateAll((els) => els.map((el) => el.textContent?.trim()));
      expect(order.slice(0, 3)).toEqual(["github", "privacy", "stato"]);
    });
  }

  test("the 'how it works' text links to the privacy section", async ({
    page,
  }) => {
    await mockHealth(page, (route) => route.fulfill(responses.up()));
    await page.goto("/status/");
    const link = page.getByRole("link", { name: "l'informativa privacy" });
    await expect(link).toHaveAttribute("href", "/privacy#il-sito");
    await link.click();
    await expect(page).toHaveURL(/\/privacy\/?#il-sito$/);
  });

  test("ships no internal word", async ({ page }) => {
    await mockHealth(page, (route) => route.fulfill(responses.up()));
    await page.goto("/status/");
    const html = await page.content();
    expect(html).not.toContain("CEO");
    expect(html).not.toContain("Telegram");
  });
});
