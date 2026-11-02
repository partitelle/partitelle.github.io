import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CACHE_KEY,
  checkHealth,
  mapHealth,
  readCachedHealth,
  TIMEOUT_MS,
  WAKING_AFTER_MS,
  writeCachedHealth,
} from "./health";

describe("mapHealth", () => {
  it("is ok only for HTTP 200 and status ok", () => {
    expect(mapHealth(200, { status: "ok", version: "1" })).toBe("ok");
    expect(mapHealth(503, { status: "ok" })).toBe("unknown");
    expect(mapHealth(500, { status: "ok" })).toBe("unknown");
    expect(mapHealth(204, { status: "ok" })).toBe("unknown");
  });

  it("is degraded for status degraded with any code", () => {
    expect(mapHealth(200, { status: "degraded" })).toBe("degraded");
    expect(mapHealth(503, { status: "degraded" })).toBe("degraded");
    expect(mapHealth(500, { status: "degraded" })).toBe("degraded");
  });

  it("is unknown for everything else", () => {
    for (const body of [
      null,
      undefined,
      "ok",
      42,
      [],
      {},
      { status: "weird" },
      { status: "OK" },
      { status: true },
      { status: null },
    ]) {
      expect(mapHealth(200, body)).toBe("unknown");
    }
  });
});

describe("checkHealth", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const answer = (status: number, body: string) =>
    vi.fn(async () => new Response(body, { status }));

  it("sends one plain GET with the strict options", async () => {
    const fetchMock = answer(200, '{"status":"ok","version":"9.9.9"}');
    vi.stubGlobal("fetch", fetchMock);
    expect(await checkHealth("https://example.test/health")).toBe("ok");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("https://example.test/health", {
      method: "GET",
      cache: "no-store",
      credentials: "omit",
      mode: "cors",
      referrerPolicy: "no-referrer",
      signal: expect.any(AbortSignal),
    });
  });

  it("maps degraded, non-JSON and network errors", async () => {
    vi.stubGlobal("fetch", answer(503, '{"status":"degraded"}'));
    expect(await checkHealth("x")).toBe("degraded");
    vi.stubGlobal("fetch", answer(200, "<html></html>"));
    expect(await checkHealth("x")).toBe("unknown");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("network");
      }),
    );
    expect(await checkHealth("x")).toBe("unknown");
  });

  it("calls onSlow once after 5 s and gives up at 60 s", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener("abort", () => reject(new Error()));
          }),
      ),
    );
    const onSlow = vi.fn();
    const result = checkHealth("x", onSlow);
    await vi.advanceTimersByTimeAsync(WAKING_AFTER_MS - 1);
    expect(onSlow).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(onSlow).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(TIMEOUT_MS - WAKING_AFTER_MS);
    expect(await result).toBe("unknown");
    expect(onSlow).toHaveBeenCalledTimes(1);
  });

  it("does not call onSlow when the answer is quick", async () => {
    vi.stubGlobal("fetch", answer(200, '{"status":"ok"}'));
    const onSlow = vi.fn();
    await checkHealth("x", onSlow);
    await vi.advanceTimersByTimeAsync(TIMEOUT_MS);
    expect(onSlow).not.toHaveBeenCalled();
  });
});

describe("cache", () => {
  const store = new Map<string, string>();
  beforeEach(() => {
    store.clear();
    vi.stubGlobal("sessionStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("stores only the state and the time, under one key", () => {
    writeCachedHealth("degraded", 1_000);
    expect([...store.keys()]).toEqual([CACHE_KEY]);
    expect(store.get(CACHE_KEY)).toBe('{"state":"degraded","at":1000}');
  });

  it("is fresh for less than 10 minutes", () => {
    writeCachedHealth("ok", 1_000);
    expect(readCachedHealth(1_000)).toEqual({ state: "ok", at: 1_000 });
    expect(readCachedHealth(1_000 + 599_999)).toEqual({
      state: "ok",
      at: 1_000,
    });
    expect(readCachedHealth(1_000 + 600_000)).toBeNull();
  });

  it("ignores malformed values", () => {
    for (const raw of [
      "",
      "not json",
      "null",
      "42",
      '"ok"',
      "[]",
      "{}",
      '{"state":"ok"}',
      '{"at":1000}',
      '{"state":"up","at":1000}',
      '{"state":"checking","at":1000}',
      '{"state":"ok","at":"1000"}',
      '{"state":"ok","at":null}',
      '{"state":"ok","at":5000}',
    ]) {
      store.set(CACHE_KEY, raw);
      expect(readCachedHealth(1_000), raw).toBeNull();
    }
    expect(readCachedHealth(1_000)).toBeNull();
  });

  it("behaves as no cache when sessionStorage throws", () => {
    vi.stubGlobal("sessionStorage", {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
    });
    expect(() => writeCachedHealth("ok", 1)).not.toThrow();
    expect(readCachedHealth(1)).toBeNull();
  });
});
