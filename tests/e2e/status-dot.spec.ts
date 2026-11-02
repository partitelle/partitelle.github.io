import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import {
  CLOCK_START,
  DOT_STATES,
  type DotState,
  dot,
  dotLink,
  HEALTH,
  LABELS,
  mockBot,
  openInState,
  SITE,
  serveAsProduction,
  VERSION,
} from "./production-origin";

const GLYPHS: Record<DotState, string> = {
  pending: "muted ring",
  ok: "solid disc",
  degraded: "ring, left half filled",
  asleep: "ring with a center dot",
  unknown: "ring with a slash",
};

async function expectDot(page: Parameters<typeof dot>[0], state: DotState) {
  await expect(dot(page)).toHaveAttribute("data-state", state);
  await expect(dotLink(page)).toHaveAttribute("aria-label", LABELS[state]);
  await expect(dotLink(page)).toHaveAttribute("title", LABELS[state]);
}

// Which of the five groups the browser draws, from the computed style.
async function drawn(page: Parameters<typeof dot>[0]) {
  return dot(page).evaluate((el) =>
    [...el.querySelectorAll("g")]
      .filter((g) => getComputedStyle(g).display !== "none")
      .map((g) => g.querySelectorAll("circle, path").length),
  );
}

test.describe("the dot in the HTML", () => {
  test("ships pending, with its box and gap, before any script", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(`${baseURL}/`);
    const link = dotLink(page);
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute("aria-label", "stato del bot");
    await expect(link).toHaveAttribute("title", "stato del bot");
    await expect(link).toHaveClass(/gap-2/);
    await expect(link).toHaveText("stato");
    await expect(dot(page)).toHaveAttribute("data-state", "pending");
    const box = await dot(page).boundingBox();
    expect(box?.width).toBe(12);
    expect(box?.height).toBe(12);
    const svg = dot(page).locator("svg");
    await expect(svg).toHaveAttribute("viewBox", "0 0 12 12");
    await expect(svg).toHaveAttribute("aria-hidden", "true");
    await expect(svg).toHaveAttribute("focusable", "false");
    await expect(dot(page)).toHaveAttribute("aria-hidden", "true");
    expect(await drawn(page)).toEqual([1]);
    await context.close();
  });

  test("sits in the header link only, not in the footer", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-health-dot]")).toHaveCount(1);
    await expect(page.locator("[data-health-link]")).toHaveCount(1);
    await expect(page.locator("footer [data-health-dot]")).toHaveCount(0);
  });
});

test.describe("other pages", () => {
  for (const path of ["/", "/privacy/"]) {
    test(`${path}: one request after idle, none for 10 minutes, one again after`, async ({
      page,
      baseURL,
    }) => {
      await serveAsProduction(page, baseURL as string);
      await page.clock.install({ time: CLOCK_START });
      const bot = await mockBot(page, "ok");
      await page.goto(`${SITE}${path}`);
      await page.clock.fastForward(3_500);
      await expect.poll(bot.count).toBe(1);
      await expectDot(page, "ok");
      expect(bot.urls).toEqual([HEALTH]);

      // The next page, within 10 minutes: the result is shown, no request.
      await page.clock.fastForward(9 * 60_000);
      await page.goto(`${SITE}${path === "/" ? "/privacy/" : "/"}`);
      await expectDot(page, "ok");
      await page.clock.fastForward(5_000);
      expect(bot.count()).toBe(1);

      // After 10 minutes the next page asks again.
      await page.clock.fastForward(61_000);
      await page.goto(`${SITE}${path}`);
      await page.clock.fastForward(3_500);
      await expect.poll(bot.count).toBe(2);
      await expect(dot(page)).toHaveAttribute("data-state", "ok");
    });
  }

  test("makes no request with the data saver on", async ({ page, baseURL }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "connection", {
        value: { saveData: true },
      });
    });
    await serveAsProduction(page, baseURL as string);
    await page.clock.install({ time: CLOCK_START });
    const bot = await mockBot(page, "ok");
    await page.goto(`${SITE}/`);
    await page.clock.fastForward(10_000);
    await page.waitForLoadState("networkidle");
    expect(bot.count()).toBe(0);
    await expectDot(page, "pending");
  });

  test("makes no request outside partitelle.com", async ({ page }) => {
    await page.clock.install({ time: CLOCK_START });
    const bot = await mockBot(page, "ok");
    for (const path of ["/", "/privacy/", "/novita/"]) {
      await page.goto(path);
      await page.clock.fastForward(10_000);
      await page.waitForLoadState("networkidle");
    }
    expect(bot.count()).toBe(0);
    await expectDot(page, "pending");
  });

  test("waits for the tab to be visible", async ({ page, baseURL }) => {
    await serveAsProduction(page, baseURL as string);
    await page.clock.install({ time: CLOCK_START });
    const bot = await mockBot(page, "ok");
    await page.addInitScript(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => "hidden",
      });
    });
    await page.goto(`${SITE}/`);
    await page.clock.fastForward(10_000);
    expect(bot.count()).toBe(0);
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => "visible",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.clock.fastForward(3_500);
    await expect.poll(bot.count).toBe(1);
    await expectDot(page, "ok");
  });

  test("a failed check is kept for 10 minutes too, and never retried", async ({
    page,
    baseURL,
  }) => {
    await serveAsProduction(page, baseURL as string);
    await page.clock.install({ time: CLOCK_START });
    const bot = await mockBot(page, "unknown");
    await page.goto(`${SITE}/`);
    await page.clock.fastForward(3_500);
    await expectDot(page, "unknown");
    await page.clock.fastForward(5 * 60_000);
    await page.goto(`${SITE}/privacy/`);
    await expectDot(page, "unknown");
    await page.clock.fastForward(10_000);
    expect(bot.count()).toBe(1);
  });
});

test.describe("every state, on other pages", () => {
  for (const state of DOT_STATES) {
    test(`${state}: ${GLYPHS[state]}, label and title word for word`, async ({
      page,
      baseURL,
    }) => {
      await openInState(page, baseURL as string, "/privacy/", state);
      await expectDot(page, state);
      expect(await drawn(page)).toHaveLength(1);
      const link = dotLink(page);
      expect(await link.getAttribute("aria-label")).toBe(
        await link.getAttribute("title"),
      );
      await expect(link).toHaveAccessibleName(LABELS[state]);
      expect(LABELS[state].startsWith("stato")).toBe(true);
    });

    test(`${state}: no running animation, no axe violation`, async ({
      page,
      baseURL,
    }) => {
      await openInState(page, baseURL as string, "/privacy/", state);
      await expectDot(page, state);
      expect(await page.evaluate(() => document.getAnimations().length)).toBe(
        0,
      );
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test("the glyphs are the five shapes, one at a time", async ({
    page,
    baseURL,
  }) => {
    await openInState(page, baseURL as string, "/privacy/", "pending");
    // ring (1), disc (1), ring + half (2), ring + dot (2), ring + slash (2)
    const counts: Record<string, number> = {};
    for (const state of DOT_STATES) {
      await dot(page).evaluate(
        (el, s) => el.setAttribute("data-state", s),
        state,
      );
      counts[state] = (await drawn(page))[0] ?? 0;
    }
    expect(counts).toEqual({
      pending: 1,
      ok: 1,
      degraded: 2,
      asleep: 2,
      unknown: 2,
    });
  });

  test("the header does not move between the five states", async ({
    page,
    baseURL,
  }) => {
    const seen = new Map<string, unknown>();
    for (const state of DOT_STATES) {
      await page.unrouteAll();
      await openInState(page, baseURL as string, "/privacy/", state);
      await expectDot(page, state);
      for (const width of [320, 390, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        seen.set(
          `${state}:${width}`,
          await page.evaluate(() => {
            const box = (el: Element | null) => {
              const r = el?.getBoundingClientRect();
              return r && [r.x, r.y, r.width, r.height];
            };
            return {
              header: box(document.querySelector("header")),
              link: box(document.querySelector("[data-health-link]")),
              dot: box(document.querySelector("[data-health-dot]")),
              nav: box(document.querySelector("header nav")),
              scroll:
                document.documentElement.scrollWidth - window.innerWidth <= 0,
            };
          }),
        );
      }
    }
    for (const width of [320, 390, 768, 1024, 1440]) {
      for (const state of DOT_STATES) {
        expect(seen.get(`${state}:${width}`), `${state} at ${width}`).toEqual(
          seen.get(`pending:${width}`),
        );
      }
      expect(
        (seen.get(`pending:${width}`) as { scroll: boolean }).scroll,
        `no sideways scroll at ${width}`,
      ).toBe(true);
    }
  });
});

test.describe("what the check sends and stores", () => {
  test("one plain request, no cookies, referrer, query or headers", async ({
    page,
    baseURL,
  }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __fetches: unknown[] };
      w.__fetches = [];
      const original = window.fetch.bind(window);
      window.fetch = (input, init) => {
        w.__fetches.push({ input: String(input), init: { ...init } });
        return original(input, init);
      };
    });
    await serveAsProduction(page, baseURL as string);
    await page.clock.install({ time: CLOCK_START });
    const bot = await mockBot(page, "ok");
    await page.goto(`${SITE}/`);
    await page.clock.fastForward(3_500);
    await expectDot(page, "ok");
    expect(bot.urls).toEqual([HEALTH]);
    expect(new URL(bot.urls[0] ?? "").search).toBe("");
    expect(bot.headers[0]?.cookie).toBeUndefined();
    expect(bot.headers[0]?.referer).toBeUndefined();
    const fetches = await page.evaluate(
      () => (window as unknown as { __fetches: unknown[] }).__fetches,
    );
    expect(fetches).toEqual([
      {
        input: HEALTH,
        init: {
          method: "GET",
          cache: "no-store",
          credentials: "omit",
          mode: "cors",
          referrerPolicy: "no-referrer",
          signal: expect.anything(),
        },
      },
    ]);
  });

  test("the response never reaches the page or the label", async ({
    page,
    baseURL,
  }) => {
    for (const state of ["ok", "degraded"] as const) {
      await page.unrouteAll();
      await openInState(page, baseURL as string, "/privacy/", state);
      await expectDot(page, state);
      const html = await page.content();
      expect(html).not.toContain(VERSION);
      expect(html).not.toContain("9.9.9");
      const text = (await page.locator("body").textContent()) ?? "";
      expect(text).not.toContain(VERSION);
      expect(await dotLink(page).getAttribute("aria-label")).not.toContain(
        VERSION,
      );
    }
  });

  test("no cookies, local storage untouched, session storage holds one key", async ({
    page,
    baseURL,
  }) => {
    await openInState(page, baseURL as string, "/", "ok");
    await expectDot(page, "ok");
    expect(await page.context().cookies()).toEqual([]);
    const storage = await page.evaluate(() => ({
      local: localStorage.length,
      session: Object.keys(sessionStorage),
      value: sessionStorage.getItem("partitelle.health"),
    }));
    expect(storage.local).toBe(0);
    expect(storage.session).toEqual(["partitelle.health"]);
    expect(JSON.parse(storage.value as string)).toEqual({
      state: "ok",
      at: expect.any(Number),
    });
    expect(Object.keys(JSON.parse(storage.value as string))).toEqual([
      "state",
      "at",
    ]);
  });

  test("keeps working, without a cache, when session storage throws", async ({
    page,
    baseURL,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "sessionStorage", {
        get() {
          throw new DOMException("denied", "SecurityError");
        },
      });
    });
    await serveAsProduction(page, baseURL as string);
    await page.clock.install({ time: CLOCK_START });
    const bot = await mockBot(page, "ok");
    await page.goto(`${SITE}/`);
    await page.clock.fastForward(3_500);
    await expectDot(page, "ok");
    await page.goto(`${SITE}/privacy/`);
    await page.clock.fastForward(3_500);
    await expect.poll(bot.count).toBe(2);
    await expect(page.locator("[data-health-dot]")).toHaveAttribute(
      "data-state",
      "ok",
    );
  });

  test("ignores a malformed cached value", async ({ page, baseURL }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem(
        "partitelle.health",
        '{"state":"up","at":9999999999999}',
      );
    });
    await serveAsProduction(page, baseURL as string);
    await page.clock.install({ time: CLOCK_START });
    const bot = await mockBot(page, "ok");
    await page.goto(`${SITE}/`);
    await page.clock.fastForward(3_500);
    await expect.poll(bot.count).toBe(1);
  });
});

test.describe("on /status", () => {
  for (const state of DOT_STATES) {
    test(`${state}: one request, the dot mirrors the panel`, async ({
      page,
      baseURL,
    }) => {
      const bot = await openInState(page, baseURL as string, "/status/", state);
      await expectDot(page, state);
      await page.clock.fastForward(10_000);
      expect(bot.count()).toBe(1);
      expect(bot.urls).toEqual([HEALTH]);
    });
  }

  test("follows the panel through a retry, one request per click", async ({
    page,
    baseURL,
  }) => {
    await serveAsProduction(page, baseURL as string);
    await page.clock.install({ time: CLOCK_START });
    const bot = await mockBot(page, (n) => (n === 1 ? "ok" : "hang"));
    await page.goto(`${SITE}/status/`);
    await expectDot(page, "ok");
    expect(bot.count()).toBe(1);

    const retry = page.getByRole("button", { name: "controlla di nuovo" });
    await retry.click();
    await expect.poll(bot.count).toBe(2);
    await expectDot(page, "pending");
    await page.clock.fastForward(5_500);
    await expect(page.locator("[data-status-panel]")).toHaveAttribute(
      "data-state",
      "waking",
    );
    await expectDot(page, "asleep");
    await page.clock.fastForward(60_000);
    await expect(page.locator("[data-status-panel]")).toHaveAttribute(
      "data-state",
      "unknown",
    );
    await expect(dot(page)).toHaveAttribute("data-state", "unknown");
    await expect(dotLink(page)).toHaveAttribute(
      "aria-label",
      LABELS.unknown.replace("21:04", "21:05"),
    );
    expect(bot.count()).toBe(2);

    await retry.click();
    await expect.poll(bot.count).toBe(3);
    await expectDot(page, "pending");
  });

  test("a fresh result from another page is shown, then the panel checks once", async ({
    page,
    baseURL,
  }) => {
    await serveAsProduction(page, baseURL as string);
    await page.clock.install({ time: CLOCK_START });
    const bot = await mockBot(page, (n) => (n === 1 ? "ok" : "degraded"));
    await page.goto(`${SITE}/`);
    await page.clock.fastForward(3_500);
    await expectDot(page, "ok");
    await page.goto(`${SITE}/status/`);
    await expect(page.locator("[data-status-panel]")).toHaveAttribute(
      "data-state",
      "degraded",
    );
    expect(bot.count()).toBe(2);
    await expectDot(page, "degraded");
    // Leaving with a fresh result: the next page shows it, no request.
    await page.goto(`${SITE}/privacy/`);
    await expectDot(page, "degraded");
    await page.clock.fastForward(5_000);
    expect(bot.count()).toBe(2);
  });

  test("local storage untouched, session storage holds only the result", async ({
    page,
    baseURL,
  }) => {
    await openInState(page, baseURL as string, "/status/", "degraded");
    await expectDot(page, "degraded");
    expect(await page.context().cookies()).toEqual([]);
    const storage = await page.evaluate(() => ({
      local: localStorage.length,
      session: Object.keys(sessionStorage),
    }));
    expect(storage).toEqual({ local: 0, session: ["partitelle.health"] });
  });

  test("the header does not move between the five states", async ({
    page,
    baseURL,
  }) => {
    const seen = new Map<string, unknown>();
    for (const state of DOT_STATES) {
      await page.unrouteAll();
      await openInState(page, baseURL as string, "/status/", state);
      await expectDot(page, state);
      for (const width of [320, 390, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        seen.set(
          `${state}:${width}`,
          await page.evaluate(() => {
            const box = (el: Element | null) => {
              const r = el?.getBoundingClientRect();
              return r && [r.x, r.y, r.width, r.height];
            };
            return {
              header: box(document.querySelector("header")),
              link: box(document.querySelector("[data-health-link]")),
            };
          }),
        );
      }
    }
    for (const width of [320, 390, 768, 1024, 1440]) {
      for (const state of DOT_STATES) {
        expect(seen.get(`${state}:${width}`), `${state} at ${width}`).toEqual(
          seen.get(`pending:${width}`),
        );
      }
    }
  });
});
