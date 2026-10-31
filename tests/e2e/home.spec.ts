import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const BOT_URL = "https://t.me/PartitelleBot?startgroup=true";

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
  expect(ogImage).toMatch(/^https:\/\/partitelle\.github\.io\//);
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

test("has no axe violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("rays have no running animation", async ({ page }) => {
    await page.goto("/");
    const rays = page.locator(".whistle-ray");
    await expect(rays).toHaveCount(3);
    const names = await rays.evaluateAll((els) =>
      els.map((el) => getComputedStyle(el).animationName),
    );
    expect(names).toEqual(["none", "none", "none"]);
    const animations = await page.evaluate(
      () => document.getAnimations().length,
    );
    expect(animations).toBe(0);
  });
});
