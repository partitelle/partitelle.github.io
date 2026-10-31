import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const BOT_URL = "https://t.me/PartitelleBot?startgroup=true";
const SITE_URL = "https://partitelle.com/";

test("renders the h1", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "la partita del mercoledì, senza il caos nel gruppo.",
  );
});

test("primary CTA points to the bot", async ({ page }) => {
  await page.goto("/");
  const cta = page.getByRole("link", { name: "Aggiungi il bot al gruppo" });
  await expect(cta).toHaveAttribute("href", BOT_URL);
});

test("declares a valid social preview image", async ({ page, request }) => {
  await page.goto("/");
  const meta = (selector: string) =>
    page.locator(selector).getAttribute("content");
  const ogImage = await meta('meta[property="og:image"]');
  const twitterImage = await meta('meta[name="twitter:image"]');
  expect(ogImage).not.toBeNull();
  expect(twitterImage).toBe(ogImage);
  expect(ogImage).toBe(`${SITE_URL}og-image.png`);
  expect(await meta('meta[property="og:image:width"]')).toBe("1200");
  expect(await meta('meta[property="og:image:height"]')).toBe("630");
  expect(await meta('meta[property="og:image:type"]')).toBe("image/png");
  expect(await meta('meta[property="og:image:alt"]')).toBeTruthy();
  expect(await meta('meta[name="twitter:image:alt"]')).toBeTruthy();

  // Prod does not serve the image yet, so fetch the same path from the local server.
  const response = await request.get(new URL(ogImage as string).pathname);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/png");
  const body = await response.body();
  expect(body.readUInt32BE(16)).toBe(1200);
  expect(body.readUInt32BE(20)).toBe(630);
  expect(body.length).toBeLessThan(300 * 1024);
});

test("every absolute URL uses the custom domain", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    SITE_URL,
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    SITE_URL,
  );
  const jsonLd = JSON.parse(
    (await page
      .locator('script[type="application/ld+json"]')
      .textContent()) as string,
  );
  expect(jsonLd.url).toBe(SITE_URL);
  expect(await page.content()).not.toContain("github.io");

  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain(`Sitemap: ${SITE_URL}sitemap-index.xml`);
  const index = await (await request.get("/sitemap-index.xml")).text();
  expect(index).toContain(`<loc>${SITE_URL}sitemap-0.xml</loc>`);
  const sitemap = await (await request.get("/sitemap-0.xml")).text();
  expect(sitemap).toContain(`<loc>${SITE_URL}</loc>`);
  expect(sitemap).not.toContain("github.io");
});

test("has no axe violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

const MARK = "[data-whistle]";

// Snapshot of every animation on the mark: name, state, and how long it still
// runs from now (end time minus current time, in ms).
async function markAnimations(page: Page) {
  return page.locator(MARK).evaluate((mark) =>
    mark.getAnimations({ subtree: true }).map((a) => ({
      name: (a as CSSAnimation).animationName,
      state: a.playState,
      remaining:
        Number(a.effect?.getComputedTiming().endTime ?? 0) -
        Number(a.currentTime ?? 0),
    })),
  );
}

// Fast-forwards the load motion (intro plus the automatic whistle).
async function finishLoadMotion(page: Page) {
  return page.locator(MARK).evaluate((mark) => {
    const animations = mark.getAnimations({ subtree: true });
    for (const a of animations) a.finish();
    return animations.length;
  });
}

test.describe("default motion", () => {
  test("rays run the intro then one whistle, all within 5s, and the svg does not clip", async ({
    page,
  }) => {
    await page.goto("/");
    const rays = page.locator(".whistle-ray");
    await expect(rays).toHaveCount(3);
    const styles = await rays.evaluateAll((els) =>
      els.map((el) => {
        const cs = getComputedStyle(el);
        return {
          name: cs.animationName,
          count: cs.animationIterationCount,
        };
      }),
    );
    for (const style of styles) {
      expect(style.name).toBe("whistle-ray, whistle-blow");
      expect(style.count).toBe("1, 1");
    }
    // Total automatic motion, measured from page load: the latest end time.
    const ends = await page
      .locator(MARK)
      .evaluate((mark) =>
        mark
          .getAnimations({ subtree: true })
          .map((a) => Number(a.effect?.getComputedTiming().endTime ?? 0)),
      );
    expect(ends).toHaveLength(6);
    expect(Math.max(...ends)).toBeLessThanOrEqual(5000);
    const overflow = await page
      .getByRole("img", { name: "partitelle" })
      .first()
      .evaluate((el) => getComputedStyle(el).overflow);
    expect(overflow).toBe("visible");
  });

  test("rays rest fully visible when the motion ends", async ({ page }) => {
    await page.goto("/");
    const rays = page.locator(".whistle-ray");
    await expect(rays).toHaveCount(3);
    expect(await finishLoadMotion(page)).toBe(6);
    const states = await markAnimations(page);
    expect(states.map((a) => a.state)).toEqual(Array(6).fill("finished"));
    const end = await rays.evaluateAll((els) =>
      els.map((el) => {
        const cs = getComputedStyle(el);
        return { opacity: cs.opacity, transform: cs.transform };
      }),
    );
    expect(end).toEqual(
      Array.from({ length: 3 }, () => ({
        opacity: "1",
        transform: "matrix(1, 0, 0, 1, 0, 0)",
      })),
    );
  });

  test("hovering the still mark replays one whistle under 1s, without restarting mid-cycle", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator(".whistle-ray")).toHaveCount(3);
    await finishLoadMotion(page);
    const mark = page.locator(MARK);
    await mark.hover();
    const replay = await markAnimations(page);
    const blows = replay.filter((a) => a.name === "whistle-blow");
    expect(blows.map((a) => a.state)).toEqual(Array(3).fill("running"));
    expect(Math.max(...blows.map((a) => a.remaining))).toBeLessThan(1000);
    expect(
      replay.filter((a) => a.name === "whistle-ray").map((a) => a.state),
    ).toEqual(Array(3).fill("finished"));

    // Jump 300ms into the whistle, then leave and come back mid-cycle: the
    // running whistle keeps going instead of being rewound.
    await mark.evaluate((el) => {
      for (const a of el.getAnimations({ subtree: true })) {
        if ((a as CSSAnimation).animationName === "whistle-blow") {
          a.currentTime = Number(a.currentTime) + 300;
        }
      }
    });
    await page.mouse.move(0, 0);
    await mark.hover();
    const again = (await markAnimations(page)).filter(
      (a) => a.name === "whistle-blow",
    );
    expect(again.map((a) => a.state)).toEqual(Array(3).fill("running"));
    expect(Math.max(...again.map((a) => a.remaining))).toBeLessThan(
      Math.max(...blows.map((a) => a.remaining)) - 250,
    );
  });

  test("tapping the still mark replays one whistle", async ({
    page,
  }, testInfo) => {
    test.skip(!testInfo.project.use.hasTouch, "needs a touch device");
    await page.goto("/");
    await expect(page.locator(".whistle-ray")).toHaveCount(3);
    await finishLoadMotion(page);
    await page.locator(MARK).tap();
    const blows = (await markAnimations(page)).filter(
      (a) => a.name === "whistle-blow",
    );
    expect(blows.map((a) => a.state)).toEqual(Array(3).fill("running"));
    expect(Math.max(...blows.map((a) => a.remaining))).toBeLessThan(1000);
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("rays have no animation, even on hover", async ({ page }) => {
    await page.goto("/");
    const rays = page.locator(".whistle-ray");
    await expect(rays).toHaveCount(3);
    const names = await rays.evaluateAll((els) =>
      els.map((el) => getComputedStyle(el).animationName),
    );
    expect(names).toEqual(["none", "none", "none"]);
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
    await page.locator(MARK).hover();
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
    const rest = await rays.evaluateAll((els) =>
      els.map((el) => getComputedStyle(el).opacity),
    );
    expect(rest).toEqual(["1", "1", "1"]);
  });

  test("cta pills do not move", async ({ page }) => {
    await page.goto("/");
    const ctas = page.locator(".cta");
    await expect(ctas).toHaveCount(2);
    const durations = await ctas.evaluateAll((els) =>
      els.map((el) => getComputedStyle(el).transitionDuration),
    );
    expect(durations).toEqual(["0s", "0s"]);
    const primary = page.getByRole("link", {
      name: "Aggiungi il bot al gruppo",
    });
    await primary.hover();
    const transform = await primary.evaluate(
      (el) => getComputedStyle(el).transform,
    );
    expect(transform).toBe("none");
  });
});
