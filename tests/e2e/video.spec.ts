import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { tabTo } from "./keyboard";

const START_NAME = "guarda il video, 56 secondi";

const start = (page: Page) => page.locator("#video [data-video-start]");
const video = (page: Page) => page.locator("#video video");
const frame = (page: Page) => page.locator("#video .aspect-video");

async function mp4Requests(page: Page, action: () => Promise<void>) {
  const urls: string[] = [];
  const onRequest = (r: { url(): string }) => {
    if (new URL(r.url()).pathname.endsWith(".mp4")) urls.push(r.url());
  };
  page.on("request", onRequest);
  await action();
  page.off("request", onRequest);
  return urls;
}

test.describe("with JavaScript", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("the block closes the problem section, right before how it works", async ({
    page,
  }) => {
    await expect(page.locator("#problema > div > #video")).toHaveCount(1);
    const order = await page.evaluate(() => {
      const section = document.querySelector("#problema") as Element;
      const block = document.querySelector("#video") as Element;
      return {
        lastInSection:
          block.parentElement?.parentElement === section &&
          block.nextElementSibling?.tagName === "SCRIPT" &&
          block.nextElementSibling.nextElementSibling === null,
        next: section.nextElementSibling?.id,
        previous: section.previousElementSibling?.tagName,
      };
    });
    expect(order.lastInSection).toBe(true);
    expect(order.next).toBe("come-funziona");
    await expect(page.locator("#video h3")).toHaveText(
      "te lo raccontiamo in un minuto.",
    );
    await expect(page.locator("#video")).toHaveAttribute(
      "aria-labelledby",
      "video-title",
    );
  });

  test("the video element has the agreed attributes and nothing automatic", async ({
    request,
  }) => {
    const html = await (await request.get("/")).text();
    const tag = html.match(/<video\b[^>]*>/)?.[0] ?? "";
    expect(tag).toContain(" controls");
    expect(tag).toContain('preload="none"');
    expect(tag).toContain(" playsinline");
    for (const attr of ["autoplay", "muted", "loop", "poster"]) {
      expect(tag, attr).not.toMatch(new RegExp(`\\s${attr}(\\s|=|>)`));
    }
    expect(html.match(/<video\b/g)).toHaveLength(1);
  });

  test("two sources, one captions track", async ({ page }) => {
    const sources = page.locator("#video video source");
    await expect(sources).toHaveCount(2);
    await expect(sources.nth(0)).toHaveAttribute(
      "media",
      "(min-width: 1024px)",
    );
    await expect(sources.nth(1)).not.toHaveAttribute("media", /.*/);
    const track = page.locator("#video video track");
    await expect(track).toHaveCount(1);
    await expect(track).toHaveAttribute("kind", "captions");
    await expect(track).toHaveAttribute("srclang", "it");
    await expect(track).toHaveAttribute("label", "italiano");
    await expect(track).toHaveAttribute("default", "");
  });

  test("the poster is a lazy, sized image and the video has no poster", async ({
    page,
  }) => {
    const img = start(page).locator("img");
    await expect(img).toHaveAttribute("loading", "lazy");
    await expect(img).toHaveAttribute("alt", "");
    await expect(img).toHaveAttribute("width", "1920");
    await expect(img).toHaveAttribute("height", "1080");
    await expect(img).toHaveAttribute(
      "sizes",
      "(min-width: 1024px) 55rem, calc(100vw - 3rem)",
    );
    expect(await img.getAttribute("srcset")).toMatch(/ 960w, .* 1920w$/);
    await expect(img).toHaveClass(/object-cover/);
    await expect(video(page)).not.toHaveAttribute("poster", /.*/);
  });

  test("no video file is requested before the start button is used", async ({
    page,
  }) => {
    const urls = await mp4Requests(page, async () => {
      await page.reload();
      await page.waitForLoadState("networkidle");
      await frame(page).scrollIntoViewIfNeeded();
      await page.waitForLoadState("networkidle");
    });
    expect(urls).toEqual([]);
    expect(await video(page).evaluate((v: HTMLVideoElement) => v.paused)).toBe(
      true,
    );
  });

  for (const [width, w, h] of [
    [320, 272, 153],
    [360, 312, 175.5],
    [390, 342, 192.375],
    [640, 592, 333],
    [768, 720, 405],
    [1024, 684, 384.75],
    [1280, 876, 492.75],
    [1440, 876, 492.75],
  ] as const) {
    test(`frame is ${w} x ${h} at ${width} px, aligned with the text column`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      const box = await frame(page).boundingBox();
      const label = await page.locator("#problem-title").boundingBox();
      const list = await page.locator("#problema ul").boundingBox();
      expect(box?.width).toBeCloseTo(w, 0);
      expect(box?.height).toBeCloseTo(h, 0);
      if (width >= 1024) {
        // from 1024 px the frame shares the pain lines' left and right edges
        expect(Math.abs((box?.x ?? 0) - (list?.x ?? 99))).toBeLessThanOrEqual(
          0.5,
        );
        expect(
          Math.abs(
            (box?.x ?? 0) +
              (box?.width ?? 0) -
              ((list?.x ?? 0) + (list?.width ?? 0)),
          ),
        ).toBeLessThanOrEqual(0.5);
      } else {
        expect(Math.abs((box?.x ?? 0) - (label?.x ?? 99))).toBeLessThanOrEqual(
          0.5,
        );
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - innerWidth,
        ),
      ).toBeLessThanOrEqual(0);
    });
  }

  test("the frame is transparent, the video paints the dark fill", async ({
    page,
  }) => {
    const bg = (l: ReturnType<typeof frame>) =>
      l.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(await bg(frame(page))).toBe("rgba(0, 0, 0, 0)");
    expect(await bg(video(page))).toBe("rgb(17, 17, 17)");
  });

  test("the platform name appears only in credit line 3", async ({ page }) => {
    const count = (t: string) => (t.match(/telegram/gi) ?? []).length;
    const all = count((await page.locator("#video").textContent()) ?? "");
    const lines = page.locator("#video figcaption p");
    await expect(lines).toHaveCount(3);
    const third = count((await lines.nth(2).textContent()) ?? "");
    expect(third).toBeGreaterThanOrEqual(1);
    expect(all).toBe(third);
    for (const i of [0, 1]) {
      expect(count((await lines.nth(i).textContent()) ?? "")).toBe(0);
    }
    for (const sel of ["h3", "button", "details"]) {
      expect(
        count(
          (await page.locator(`#video ${sel}`).first().textContent()) ?? "",
        ),
      ).toBe(0);
    }
  });

  test("the frame uses the video container token, not a literal", async ({
    page,
  }) => {
    await expect(frame(page)).toHaveClass(/\bmax-w-video\b/);
    await expect(page.locator("#video figcaption")).toHaveClass(
      /\bmax-w-video\b/,
    );
    const html = await page.content();
    expect(html).not.toContain("max-w-[60rem]");
  });

  test("a pill with its label from 640 px, a disc without it below", async ({
    page,
  }) => {
    const label = start(page).getByText("guarda il video", { exact: true });
    const pill = start(page).locator(".video-play");
    await frame(page).scrollIntoViewIfNeeded();

    await page.setViewportSize({ width: 640, height: 900 });
    await expect(label).toBeVisible();
    // The duration is generated content, so the accessible name stays the
    // aria-label and the label text alone is what a speech user can say.
    expect(
      await label.evaluate((el) => getComputedStyle(el, "::after").content),
    ).toBe('" · 0:56"');
    let box = await pill.boundingBox();
    let fb = await frame(page).boundingBox();
    expect(box?.height).toBeCloseTo(48, 0);
    expect(box?.width).toBeGreaterThan(48);
    // inset 24 px (the frame border is 1 px)
    expect(
      (fb?.x ?? 0) + (fb?.width ?? 0) - 1 - ((box?.x ?? 0) + (box?.width ?? 0)),
    ).toBeCloseTo(24, 0);
    expect(
      (fb?.y ?? 0) +
        (fb?.height ?? 0) -
        1 -
        ((box?.y ?? 0) + (box?.height ?? 0)),
    ).toBeCloseTo(24, 0);

    await page.setViewportSize({ width: 639, height: 900 });
    await expect(label).toBeHidden();
    box = await pill.boundingBox();
    fb = await frame(page).boundingBox();
    expect(box?.width).toBeCloseTo(48, 0);
    expect(box?.height).toBeCloseTo(48, 0);
    expect(
      (fb?.x ?? 0) + (fb?.width ?? 0) - 1 - ((box?.x ?? 0) + (box?.width ?? 0)),
    ).toBeCloseTo(12, 0);
    expect(
      (fb?.y ?? 0) +
        (fb?.height ?? 0) -
        1 -
        ((box?.y ?? 0) + (box?.height ?? 0)),
    ).toBeCloseTo(12, 0);

    await expect(
      page.getByRole("button", { name: START_NAME, exact: true }),
    ).toBeVisible();
    await expect(start(page).locator("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  test("the start button covers the whole frame and the native controls are off", async ({
    page,
  }) => {
    await expect(start(page)).toBeVisible();
    await expect(start(page)).toHaveAttribute("aria-label", START_NAME);
    expect(
      await video(page).evaluate((v: HTMLVideoElement) => v.controls),
    ).toBe(false);
    const b = await start(page).boundingBox();
    const f = await frame(page).boundingBox();
    expect(b?.width).toBeGreaterThanOrEqual((f?.width ?? 0) - 2.5);
    expect(b?.height).toBeGreaterThanOrEqual((f?.height ?? 0) - 2.5);
  });

  async function expectStarted(page: Page) {
    await expect(start(page)).toBeHidden();
    const state = await video(page).evaluate((v: HTMLVideoElement) => ({
      controls: v.controls,
      poster: v.poster,
      active: document.activeElement === v,
    }));
    expect(state.controls).toBe(true);
    expect(state.poster).toMatch(
      /\/video\/presentazione-placeholder-poster-\d+\.webp$/,
    );
    expect(state.active).toBe(true);
  }

  test("clicking the start button turns the controls on and focuses the video", async ({
    page,
  }) => {
    await frame(page).scrollIntoViewIfNeeded();
    await start(page).click();
    await expectStarted(page);
  });

  test("the keyboard starts it too", async ({ page }) => {
    await tabTo(page, start(page));
    await expect(start(page)).toBeFocused();
    await page.keyboard.press("Enter");
    await expectStarted(page);
  });

  test("a play event from another route hides the start button", async ({
    page,
  }) => {
    await expect(start(page)).toBeVisible();
    await video(page).evaluate((v) => v.dispatchEvent(new Event("play")));
    await expect(start(page)).toBeHidden();
  });

  test("a play event from another route also turns the controls on", async ({
    page,
  }) => {
    await expect(start(page)).toBeVisible();
    await video(page).evaluate((v) => v.dispatchEvent(new Event("play")));
    await expect(start(page)).toBeHidden();
    expect(
      await video(page).evaluate((v: HTMLVideoElement) => v.controls),
    ).toBe(true);
  });

  test("credits: three lines, two links, same tab", async ({ page }) => {
    const lines = page.locator("#video figcaption p");
    await expect(lines).toHaveText([
      "musica: Pure House Beats 01 di Sascha Ende, licenza CC BY 4.0, accorciata per il video.",
      "voce generata con IA.",
      "partitelle è un progetto indipendente, non affiliato a Telegram.",
    ]);
    const links = page.locator("#video figcaption a");
    await expect(links).toHaveCount(2);
    await expect(links.nth(0)).toHaveText("Pure House Beats 01");
    await expect(links.nth(0)).toHaveAttribute(
      "href",
      "https://ende.app/en/song/499-pure-house-beats-01",
    );
    await expect(links.nth(1)).toHaveText("CC BY 4.0");
    await expect(links.nth(1)).toHaveAttribute(
      "href",
      "https://creativecommons.org/licenses/by/4.0/deed.it",
    );
    for (const i of [0, 1]) {
      await expect(links.nth(i)).toHaveClass(/\blink-inline\b/);
      await expect(links.nth(i)).not.toHaveAttribute("target", /.*/);
    }
  });

  test("the transcript is a closed details with a 48 px summary", async ({
    page,
  }) => {
    const details = page.locator("#video details");
    const summary = details.locator("summary");
    await expect(summary).toHaveText("leggi il testo del video");
    expect((await summary.boundingBox())?.height).toBeGreaterThanOrEqual(48);
    expect(await details.evaluate((d: HTMLDetailsElement) => d.open)).toBe(
      false,
    );
    await summary.click();
    await expect(details.locator("p")).toHaveText([
      "segnaposto: il testo arriva con il video.",
    ]);
  });

  test("every request is same-origin, before and after playing", async ({
    page,
    baseURL,
  }) => {
    const origins = new Set<string>();
    page.on("request", (r) => {
      const url = new URL(r.url());
      if (url.protocol === "http:" || url.protocol === "https:")
        origins.add(url.origin);
    });
    await page.reload();
    await page.waitForLoadState("networkidle");
    await frame(page).scrollIntoViewIfNeeded();
    await start(page).click();
    await page.waitForTimeout(500);
    await page.waitForLoadState("networkidle");
    expect([...origins]).toEqual([new URL(baseURL as string).origin]);
  });

  test("the video file is requested only after the click", async ({ page }) => {
    const urls = await mp4Requests(page, async () => {
      await frame(page).scrollIntoViewIfNeeded();
      await start(page).click();
      await expect
        .poll(() =>
          video(page).evaluate((v: HTMLVideoElement) => v.networkState),
        )
        .not.toBe(0);
      await page.waitForTimeout(500);
    });
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls)
      expect(new URL(url).pathname).toBe(
        "/video/presentazione-placeholder.mp4",
      );
  });

  test("axe: no violations on the block, before and after starting", async ({
    page,
  }) => {
    expect(
      (await new AxeBuilder({ page }).include("#video").analyze()).violations,
    ).toEqual([]);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await start(page).click();
    expect(
      (await new AxeBuilder({ page }).include("#video").analyze()).violations,
    ).toEqual([]);
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the plain native player stays, with the transcript", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(video(page)).toHaveJSProperty("controls", true);
    await expect(video(page)).toBeVisible();
    await expect(start(page)).toBeHidden();
    await expect(start(page)).toHaveAttribute("hidden", "");
    await expect(page.locator("#video details")).toHaveCount(1);
    await expect(page.locator("#video summary")).toBeVisible();
    await expect(page.locator("#video figcaption p")).toHaveCount(3);
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the pill does not move on hover or focus", async ({ page }) => {
    await page.goto("/");
    const pill = start(page).locator(".video-play");
    await frame(page).scrollIntoViewIfNeeded();
    await start(page).hover();
    await tabTo(page, start(page));
    const style = await pill.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { transform: cs.transform, transition: cs.transitionDuration };
    });
    expect(style.transform).toBe("none");
    expect(style.transition).toBe("0s");
  });
});
