// One check of the bot's /health endpoint, shared by the status page and the
// small indicator in the header. Nothing from the response is ever returned
// or shown: only the state it maps to.

/** The three final results of a check. */
export type HealthState = "ok" | "degraded" | "unknown";

/**
 * What the status page announces on `document` with the `partitelle:health`
 * event, in `event.detail.state`:
 * - "checking": a check has started (or none has answered yet);
 * - "waking": no answer after WAKING_AFTER_MS, the request is still open;
 * - "ok" | "degraded" | "unknown": the final result.
 * `at` is the epoch time in ms of that change.
 */
export type HealthEventState = "checking" | "waking" | HealthState;
export interface HealthEventDetail {
  state: HealthEventState;
  at: number;
}

export const HEALTH_EVENT = "partitelle:health";
export const WAKING_AFTER_MS = 5_000;
export const TIMEOUT_MS = 60_000;

export const CACHE_KEY = "partitelle.health";
export const CACHE_TTL_MS = 600_000;

/** Only HTTP 200 with status "ok" is ok; "degraded" counts with any code. */
export function mapHealth(httpStatus: number, body: unknown): HealthState {
  const status =
    typeof body === "object" && body !== null
      ? (body as { status?: unknown }).status
      : undefined;
  if (httpStatus === 200 && status === "ok") return "ok";
  if (status === "degraded") return "degraded";
  return "unknown";
}

/** One GET, no retry. `onSlow` runs once if there is no answer after 5 s. */
export async function checkHealth(
  endpoint: string,
  onSlow?: () => void,
): Promise<HealthState> {
  const controller = new AbortController();
  const wake = onSlow ? setTimeout(onSlow, WAKING_AFTER_MS) : undefined;
  const abort = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(endpoint, {
      method: "GET",
      cache: "no-store",
      credentials: "omit",
      mode: "cors",
      referrerPolicy: "no-referrer",
      signal: controller.signal,
    });
    return mapHealth(response.status, await response.json());
  } catch {
    return "unknown";
  } finally {
    clearTimeout(abort);
    clearTimeout(wake);
  }
}

const isState = (value: unknown): value is HealthState =>
  value === "ok" || value === "degraded" || value === "unknown";

/** The result of a check made in this tab less than 10 minutes ago, if any. */
export function readCachedHealth(
  now: number = Date.now(),
): { state: HealthState; at: number } | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (raw === null) return null;
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return null;
    const { state, at } = value as { state?: unknown; at?: unknown };
    if (!isState(state) || typeof at !== "number" || !Number.isFinite(at)) {
      return null;
    }
    if (at > now || now - at >= CACHE_TTL_MS) return null;
    return { state, at };
  } catch {
    return null;
  }
}

/** Keeps the state and the time of the check in this tab, nothing else. */
export function writeCachedHealth(state: HealthState, at: number): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ state, at }));
  } catch {
    // Storage off or full: the next page simply checks again.
  }
}
