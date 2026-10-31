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
