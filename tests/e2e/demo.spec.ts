import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const NAMES = [
  "luca",
  "sara",
  "marco",
  "chiara",
  "andrea",
  "elena",
  "paolo",
  "marta",
  "davide",
];
const LOCKED_ONE = "per le squadre servono dieci conferme: ne manca 1.";

const demo = (page: Page) => {
  const section = page.locator("#prova");
  const summary = section.locator("[data-demo-summary] figure");
  const teams = section.locator("[data-demo-teams]");
  return {
    section,
    summary,
    teams,
    rows: summary.locator("ol > li"),
    status: section.getByRole("status"),
    hint: section.locator("#demo-teams-hint"),
    join: section.getByRole("button", { name: "aggiungimi", exact: true }),
    propose: section.getByRole("button", { name: "proponimi", exact: true }),
    leave: section.getByRole("button", { name: "toglimi", exact: true }),
    make: section.getByRole("button", { name: "fai le squadre" }),
    reset: section.getByRole("button", { name: "ricomincia" }),
    placeholder: section.getByText("qui escono le squadre, a sorte."),
  };
};

async function expectInitial(page: Page) {
  const d = demo(page);
  await expect(d.rows).toHaveCount(10);
  await expect(d.summary.getByText("9/10")).toBeVisible();
  await expect(
    d.summary.getByText("9 posti presi su 10", { exact: true }),
  ).toHaveCount(1);
  await expect(d.summary.locator("[data-state='in']")).toHaveCount(9);
  await expect(d.summary.locator("[data-state='empty']")).toHaveCount(1);
  await expect(d.rows.nth(9)).toContainText("posto libero");
  await expect(d.summary.locator("[data-changed]")).toHaveCount(0);
  await expect(d.status).toHaveText("nove posti presi, manca il tuo.");
  await expect(d.make).toHaveAttribute("aria-disabled", "true");
  await expect(d.make).toHaveAttribute("aria-describedby", "demo-teams-hint");
  await expect(d.make).not.toHaveAttribute("disabled");
  await expect(d.hint).toHaveText("manca 1 conferma");
  await expect(d.placeholder).toBeVisible();
  await expect(d.teams.locator("ul")).toHaveCount(0);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("initial state: 9 of 10, locked button, placeholder", async ({ page }) => {
  await expectInitial(page);
  const d = demo(page);
  for (const [i, name] of NAMES.entries()) {
    await expect(d.rows.nth(i)).toContainText(name);
  }
  await expect(d.section.getByRole("heading", { level: 2 })).toHaveText(
    "provalo",
  );
  await expect(d.section.locator(".cta")).toHaveCount(0);
});

test("aggiungimi fills slot 10 and unlocks the button", async ({ page }) => {
  const d = demo(page);
  await d.join.click();
  await expect(d.status).toHaveText(
    "ci sei: posto 10. dieci conferme, ora puoi fare le squadre.",
  );
  await expect(d.rows).toHaveCount(10);
  await expect(d.summary.getByText("10/10")).toBeVisible();
  await expect(
    d.summary.getByText("10 posti presi su 10", { exact: true }),
  ).toHaveCount(1);
  await expect(d.summary.locator("[data-state='empty']")).toHaveCount(0);
  await expect(d.rows.nth(9)).toContainText("tu");
  await expect(d.rows.nth(9)).toHaveAttribute("data-changed", "");
  await expect(d.summary.locator("[data-changed]")).toHaveCount(1);
  await expect(d.make).toHaveAttribute("aria-disabled", "false");
  await expect(d.hint).toHaveText("a sorte, cinque contro cinque");
});

test("repeating aggiungimi is a no-op that re-announces and keeps one highlight", async ({
  page,
}) => {
  const d = demo(page);
  await d.join.click();
  await expect(d.status).toContainText("ci sei: posto 10.");
  await d.join.click();
  await expect(d.status).toHaveText("ci sei già: posto 10.");
  await expect(d.rows).toHaveCount(10);
  await expect(d.summary.locator("[data-changed]")).toHaveCount(1);
  await d.leave.click();
  await expect(d.summary.locator("[data-changed]")).toHaveCount(0);
  await expect(d.rows.nth(9)).toContainText("posto libero");
});

test("locked button is focusable and clicking it explains why", async ({
  page,
}) => {
  const d = demo(page);
  await d.make.focus();
  await expect(d.make).toBeFocused();
  // force: Playwright treats aria-disabled as not enabled and would wait
  await d.make.click({ force: true });
  await expect(d.status).toHaveText(LOCKED_ONE);
  await expect(d.make).toHaveAttribute("aria-disabled", "true");
  await expect(d.placeholder).toBeVisible();
  await expect(d.summary.locator("[data-changed]")).toHaveCount(0);
  // the same string is announced again: the region is emptied, then refilled
  await d.make.click({ force: true });
  await expect(d.status).toHaveText(LOCKED_ONE);
});

test("toglimi with nobody to remove says so", async ({ page }) => {
  const d = demo(page);
  await d.leave.click();
  await expect(d.status).toHaveText(
    "non sei in lista: non c'è niente da togliere.",
  );
  await expectInitialLists(page);
});

async function expectInitialLists(page: Page) {
  const d = demo(page);
  await expect(d.rows).toHaveCount(10);
  await expect(d.summary.locator("[data-state='in']")).toHaveCount(9);
}

test("proponimi at 10/10 keeps the button locked; aggiungimi then confirms", async ({
  page,
}) => {
  const d = demo(page);
  await d.propose.click();
  await expect(d.status).toHaveText(
    "sei in forse: il posto 10 resta tuo, ma non conti per le squadre.",
  );
  await expect(d.summary.getByText("10/10")).toBeVisible();
  await expect(d.rows.nth(9)).toHaveAttribute("data-state", "maybe");
  await expect(d.rows.nth(9)).toHaveAttribute("data-changed", "");
  await expect(d.rows.nth(9)).toContainText("forse");
  await expect(d.make).toHaveAttribute("aria-disabled", "true");
  await expect(d.hint).toHaveText("manca 1 conferma");
  await d.make.click({ force: true });
  await expect(d.status).toHaveText(LOCKED_ONE);
  await d.propose.click();
  await expect(d.status).toHaveText("sei già in forse: posto 10.");
  await d.join.click();
  await expect(d.status).toHaveText(
    "ora ci sei, non più in forse: posto 10. dieci conferme, ora puoi fare le squadre.",
  );
  await expect(d.rows.nth(9)).toHaveAttribute("data-state", "in");
  await expect(d.make).toHaveAttribute("aria-disabled", "false");
});

test("fai le squadre makes two teams of five with every name, tu highlighted once", async ({
  page,
}) => {
  const d = demo(page);
  await d.join.click();
  await d.make.click();
  const lists = d.teams.locator("ul");
  await expect(lists).toHaveCount(2);
  await expect(lists.nth(0).locator("li")).toHaveCount(5);
  await expect(lists.nth(1).locator("li")).toHaveCount(5);
  await expect(d.placeholder).toHaveCount(0);
  const all = [
    ...(await lists.nth(0).locator("li").allTextContents()),
    ...(await lists.nth(1).locator("li").allTextContents()),
  ];
  expect([...all].sort()).toEqual([...NAMES, "tu"].sort());
  await expect(d.teams.locator("[data-changed]")).toHaveCount(1);
  await expect(d.teams.locator("[data-changed]")).toHaveText("tu");
  await expect(d.summary.locator("[data-changed]")).toHaveCount(0);
  await expect(d.teams.getByRole("list", { name: "squadra nera" })).toHaveCount(
    1,
  );
  await expect(
    d.teams.getByRole("list", { name: "squadra bianca" }),
  ).toHaveCount(1);
  await expect(d.status).toHaveText(
    /^squadre fatte a sorte: sei nella squadra (nera|bianca)\.$/,
  );
  // asking again shows the same teams
  const before = await d.teams.innerHTML();
  await d.make.click();
  await expect(d.status).toHaveText(
    /^le squadre ci sono già: sei nella squadra (nera|bianca)\.$/,
  );
  expect(await d.teams.innerHTML()).toBe(before);
  await expect(d.teams.locator("[data-changed]")).toHaveCount(1);
  // aggiungimi keeps the teams, highlights the summary row
  await d.join.click();
  await expect(d.status).toHaveText("ci sei già: posto 10.");
  await expect(d.teams.locator("ul")).toHaveCount(2);
  await expect(d.teams.locator("[data-changed]")).toHaveCount(0);
  await expect(d.summary.locator("[data-changed]")).toHaveCount(1);
});

test("toglimi after the teams revokes them", async ({ page }) => {
  const d = demo(page);
  await d.join.click();
  await d.make.click();
  await expect(d.teams.locator("ul")).toHaveCount(2);
  await d.leave.click();
  await expect(d.placeholder).toBeVisible();
  await expect(d.teams.locator("ul")).toHaveCount(0);
  await expect(d.status).toContainText("squadre annullate");
  await expect(d.status).toHaveText(
    "fatto: il tuo posto ora è libero. squadre annullate, servono di nuovo dieci conferme.",
  );
  await expect(d.make).toHaveAttribute("aria-disabled", "true");
  await expect(d.hint).toHaveText("manca 1 conferma");
  await expect(d.summary.locator("[data-changed]")).toHaveCount(0);
});

test("proponimi after the teams revokes them", async ({ page }) => {
  const d = demo(page);
  await d.join.click();
  await d.make.click();
  await d.propose.click();
  await expect(d.status).toHaveText(
    "ora sei in forse: il posto 10 resta tuo, ma non conti per le squadre. squadre annullate, servono di nuovo dieci conferme.",
  );
  await expect(d.placeholder).toBeVisible();
  await expect(d.rows.nth(9)).toHaveAttribute("data-state", "maybe");
});

test("ricomincia restores the initial state", async ({ page }) => {
  const d = demo(page);
  await d.join.click();
  await d.make.click();
  await d.reset.click();
  await expectInitial(page);
  await expect(d.reset).toBeFocused();
});

test("keyboard only: Tab order, Enter and Space, focus never moves by itself", async ({
  page,
}) => {
  const d = demo(page);
  await d.join.focus();
  await expect(d.join).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(d.propose).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(d.leave).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(d.make).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(d.reset).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(d.join).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(d.status).toContainText("ci sei: posto 10.");
  await expect(d.join).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(d.make).toBeFocused();
  await page.keyboard.press("Space");
  await expect(d.teams.locator("ul")).toHaveCount(2);
  await expect(d.make).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(d.reset).toBeFocused();
  await page.keyboard.press("Enter");
  await expectInitial(page);
  await expect(d.reset).toBeFocused();
});

test("axe: no violations in the initial state, with teams and with a maybe", async ({
  page,
}) => {
  const d = demo(page);
  await expectInitial(page);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await d.join.click();
  await d.make.click();
  await expect(d.teams.locator("ul")).toHaveCount(2);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await d.propose.click();
  await expect(d.rows.nth(9)).toHaveAttribute("data-state", "maybe");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("the section never names a sport or a platform, and has one status region", async ({
  page,
}) => {
  const html = await demo(page).section.evaluate((el) => el.outerHTML);
  expect(html).not.toMatch(/telegram|whatsapp|calcio|calcetto|equilibrat/i);
  await expect(demo(page).section.getByRole("status")).toHaveCount(1);
  await expect(page.locator("[data-whistle]")).toHaveCount(1);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("interacting starts no animation or transition", async ({ page }) => {
    const d = demo(page);
    await d.join.click();
    await d.make.click();
    await d.leave.click();
    await d.reset.click();
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
    await expect(page.locator(".cta")).toHaveCount(2);
    await expect(page.locator("[data-whistle]")).toHaveCount(1);
    const transitions = await d.section
      .locator("button")
      .evaluateAll((els) =>
        els.map((el) => getComputedStyle(el).transitionDuration),
      );
    expect(transitions).toEqual(Array(5).fill("0s"));
  });
});

test.describe("default motion", () => {
  test("demo buttons are not .cta and do not animate", async ({ page }) => {
    const d = demo(page);
    await d.join.click();
    await d.make.click();
    await expect(page.locator(".cta")).toHaveCount(2);
    const names = await d.section
      .locator("*")
      .evaluateAll((els) =>
        els.map((el) => getComputedStyle(el).animationName),
      );
    expect(new Set(names)).toEqual(new Set(["none"]));
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the initial state shows and the dead buttons are hidden", async ({
    page,
  }) => {
    const d = demo(page);
    await expect(d.rows).toHaveCount(10);
    await expect(d.status).toHaveText("nove posti presi, manca il tuo.");
    await expect(d.placeholder).toBeVisible();
    await expect(d.section.locator("button:visible")).toHaveCount(0);
    await expect(d.hint).toBeHidden();
  });
});
