import { expect, type Page, type Route } from "@playwright/test";

// The header indicator only checks the bot from https://partitelle.com (the
// bot answers CORS requests from that origin only). These helpers let a test
// open the local preview as that origin, without any switch in the site code:
// every request to https://partitelle.com is served by the preview server.

export const SITE = "https://partitelle.com";
export const HEALTH = "https://partitelle-bot.onrender.com/health";
export const VERSION = "9.9.9-abc1234";
export const CLOCK_START = new Date("2026-11-01T21:04:10");

const cors = { "access-control-allow-origin": SITE };

export async function serveAsProduction(page: Page, baseURL: string) {
  await page.route(`${SITE}/**`, async (route) => {
    const { pathname, search } = new URL(route.request().url());
    const response = await route.fetch({
      url: `${baseURL}${pathname}${search}`,
    });
    await route.fulfill({ response });
  });
}

export type Answer = "ok" | "degraded" | "unknown" | "hang";

const json = (status: number, body: unknown) => ({
  status,
  contentType: "application/json",
  headers: cors,
  body: JSON.stringify(body),
});

export function answer(kind: Answer, route: Route): Promise<void> {
  if (kind === "hang") return new Promise(() => {});
  if (kind === "unknown") return route.abort();
  if (kind === "ok") {
    return route.fulfill(
      json(200, { status: "ok", version: VERSION, database: "ok" }),
    );
  }
  return route.fulfill(
    json(503, { status: "degraded", version: VERSION, database: "error" }),
  );
}

export interface Bot {
  urls: string[];
  headers: Record<string, string>[];
  count: () => number;
}

// Mocks the bot's health endpoint and records what reaches it.
export async function mockBot(
  page: Page,
  kind: Answer | ((n: number) => Answer),
): Promise<Bot> {
  const bot: Bot = { urls: [], headers: [], count: () => bot.urls.length };
  await page.route(HEALTH, (route, request) => {
    bot.urls.push(request.url());
    bot.headers.push(request.headers());
    const n = bot.urls.length;
    return answer(typeof kind === "function" ? kind(n) : kind, route);
  });
  return bot;
}

export const dot = (page: Page) => page.locator("header [data-health-dot]");
export const dotLink = (page: Page) =>
  page.locator("header [data-health-link]");

export const LABELS = {
  pending: "stato del bot",
  asleep:
    "stato del bot: il bot ci mette un po' a rispondere, forse si sta svegliando",
  ok: "stato del bot: il bot è attivo, controllato alle 21:04",
  degraded: "stato del bot: il bot ha un problema, controllato alle 21:04",
  unknown: "stato del bot: nessuna risposta dal bot, controllato alle 21:04",
} as const;

export type DotState = keyof typeof LABELS;
export const DOT_STATES = Object.keys(LABELS) as DotState[];

// Opens `path` as the production site with the bot answering as `state` asks.
// "pending" is a request that has been open for less than 5 s, "asleep" one
// that has been open for more. The other states are left to the caller to
// wait for.
export async function openInState(
  page: Page,
  baseURL: string,
  path: string,
  state: DotState,
): Promise<Bot> {
  await serveAsProduction(page, baseURL);
  await page.clock.install({ time: CLOCK_START });
  const bot = await mockBot(
    page,
    state === "pending" || state === "asleep" ? "hang" : state,
  );
  await page.goto(`${SITE}${path}`);
  // Past the idle wait (3 s at most): the one request is out.
  await page.clock.fastForward(3_500);
  await expect.poll(bot.count).toBe(1);
  if (state === "asleep") await page.clock.fastForward(5_500);
  return bot;
}
