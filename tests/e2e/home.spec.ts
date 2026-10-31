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

test.describe("default motion", () => {
  test("rays run the intro then three blasts, and the svg does not clip", async ({
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
      expect(style.count).toBe("1, 3");
    }
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
    const running = await page.evaluate(() => {
      const animations = document.getAnimations();
      for (const anim of animations) anim.finish();
      return animations.length;
    });
    expect(running).toBe(6);
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
