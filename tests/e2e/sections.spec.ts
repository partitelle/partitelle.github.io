import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const SECTIONS = ["#problema", "#come-funziona"] as const;

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("both sections are named regions with the right heading outline", async ({
  page,
}) => {
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(
    page.getByRole("region", { name: "il problema" }),
  ).toHaveAttribute("id", "problema");
  await expect(
    page.getByRole("region", { name: "come funziona" }),
  ).toHaveAttribute("id", "come-funziona");
  const h2 = page.getByRole("heading", { level: 2 });
  await expect(h2).toHaveText(["il problema", "come funziona", "provalo"]);
  const h3 = page.locator("#come-funziona").getByRole("heading", { level: 3 });
  await expect(h3).toHaveText([
    "aggiungi il bot al gruppo",
    "ognuno si segna con una parola",
    "squadre a sorte e promemoria",
  ]);
  await expect(page.getByRole("heading", { level: 3 })).toHaveCount(3);
});

test("problem section has the three lines", async ({ page }) => {
  const items = page.locator("#problema li");
  await expect(items).toHaveCount(3);
  await expect(items.locator("p:first-child")).toHaveText([
    "chi c'è mercoledì?",
    "copia la lista, aggiungi il tuo nome, incolla.",
    "squadre fatte a occhio.",
  ]);
  await expect(items.locator("p:last-child")).toHaveText([
    "messaggi su messaggi per contare dieci persone.",
    "e se due rispondono insieme, qualcuno sparisce.",
    "e finisce sempre con la stessa discussione.",
  ]);
});

test("how it works has three ordered steps", async ({ page }) => {
  const steps = page.locator("#come-funziona > div > ol > li");
  await expect(steps).toHaveCount(3);
  await expect(page.locator("#come-funziona > div > ol")).toHaveJSProperty(
    "tagName",
    "OL",
  );
  await expect(
    page.locator(
      "#come-funziona > div > ol > li > div:first-child > span[aria-hidden]",
    ),
  ).toHaveText(["1", "2", "3"]);
});

test("step 1 summary shows one player and nine free slots", async ({
  page,
}) => {
  const summary = page.locator("#come-funziona figure").nth(0);
  await expect(summary.locator("ol > li")).toHaveCount(10);
  await expect(summary.locator("[data-state='in']")).toHaveCount(1);
  await expect(summary.locator("[data-state='empty']")).toHaveCount(9);
  await expect(
    summary.getByText("1 posto preso su 10", { exact: true }),
  ).toHaveCount(1);
});

test("step 2 summary shows 10 slots, 9 taken, 2 maybe, 1 free", async ({
  page,
}) => {
  const summary = page.locator("#come-funziona figure").nth(1);
  await expect(summary.locator("ol > li")).toHaveCount(10);
  await expect(summary.getByText("9/10")).toBeVisible();
  await expect(
    summary.getByText("9 posti presi su 10", { exact: true }),
  ).toHaveCount(1);
  await expect(summary.locator("[data-state='maybe']")).toHaveCount(2);
  await expect(summary.getByText("forse", { exact: true })).toHaveCount(2);
  await expect(summary.locator("[data-state='empty']")).toHaveCount(1);
  await expect(summary.getByText("posto libero", { exact: true })).toHaveCount(
    1,
  );
  await expect(summary.locator("[data-changed]")).toHaveCount(0);
});

test("step 3 shows two teams of five", async ({ page }) => {
  const teams = page.locator("#come-funziona figure").nth(2);
  const lists = teams.locator("ul");
  await expect(lists).toHaveCount(2);
  await expect(lists.nth(0).locator("li")).toHaveCount(5);
  await expect(lists.nth(1).locator("li")).toHaveCount(5);
  await expect(teams.getByText("squadra nera", { exact: true })).toHaveCount(1);
  await expect(teams.getByText("squadra bianca", { exact: true })).toHaveCount(
    1,
  );
  await expect(teams.getByRole("list", { name: "squadra nera" })).toHaveCount(
    1,
  );
});

test("keyword list names the four words", async ({ page }) => {
  const list = page.getByRole("term");
  await expect(list).toHaveText([
    "aggiungimi",
    "proponimi",
    "toglimi",
    "scambia luca con sara",
  ]);
});

test("new sections never name a platform", async ({ page }) => {
  for (const id of SECTIONS) {
    const text = await page.locator(id).evaluate((el) => el.outerHTML);
    expect(text).not.toMatch(/telegram|whatsapp/i);
  }
});

test("the page keeps a single whistle mark", async ({ page }) => {
  await expect(page.locator("[data-whistle]")).toHaveCount(1);
});

test("new sections are not focusable and do not move", async ({ page }) => {
  for (const id of SECTIONS) {
    const section = page.locator(id);
    const focusable = await section.evaluate(
      (el) =>
        el.querySelectorAll(
          "a[href], button, input, select, textarea, [tabindex], [contenteditable]",
        ).length,
    );
    expect(focusable).toBe(0);
    const motion = await section.evaluate((el) => {
      const nodes = [el, ...el.querySelectorAll("*")];
      const animated = nodes.filter((n) => {
        const cs = getComputedStyle(n);
        return (
          cs.animationName !== "none" ||
          cs.transitionDuration.split(", ").some((d) => d !== "0s")
        );
      }).length;
      return { animated, running: el.getAnimations({ subtree: true }).length };
    });
    expect(motion).toEqual({ animated: 0, running: 0 });
  }
});

test("axe reports no violations on the page and on each new section", async ({
  page,
}) => {
  const full = await new AxeBuilder({ page }).analyze();
  expect(full.violations).toEqual([]);
  for (const id of SECTIONS) {
    const scoped = await new AxeBuilder({ page }).include(id).analyze();
    expect(scoped.violations).toEqual([]);
  }
});

test("no horizontal scroll", async ({ page }) => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test.describe("narrow viewport", () => {
  test.use({ viewport: { width: 320, height: 800 } });

  test("no horizontal scroll at 320", async ({ page }) => {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
