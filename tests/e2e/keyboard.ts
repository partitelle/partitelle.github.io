import { expect, type Locator, type Page } from "@playwright/test";

// Moves focus to the target with the Tab key, so :focus-visible applies
// (a programmatic focus() may not trigger it).
export async function tabTo(page: Page, target: Locator, max = 80) {
  const handle = await target.elementHandle();
  if (!handle) throw new Error("tabTo: target not found");
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
  for (let i = 0; i < max; i++) {
    await page.keyboard.press("Tab");
    const hit = await handle.evaluate((el) => el === document.activeElement);
    if (hit) return;
  }
  throw new Error(`tabTo: not reached after ${max} Tab presses`);
}

// Page-relative client rects of an element and of its parent, to prove
// nothing moves (scrolling into view does not count as a move).
export async function rectsOf(target: Locator) {
  return target.evaluate((el) => {
    const plain = (r: DOMRect) => [
      r.x + scrollX,
      r.y + scrollY,
      r.width,
      r.height,
    ];
    return {
      link: Array.from(el.getClientRects()).map(plain),
      parent: plain((el.parentElement as HTMLElement).getBoundingClientRect()),
    };
  });
}

// Focus adds 4px of bottom padding to the link box (the yellow fill runs past
// the underline) and nothing else: same x, y and width, same paragraph.
export function expectNoShift(
  after: Awaited<ReturnType<typeof rectsOf>>,
  before: Awaited<ReturnType<typeof rectsOf>>,
) {
  expect(after.parent).toEqual(before.parent);
  expect(after.link).toHaveLength(before.link.length);
  after.link.forEach(([x, y, w, h], i) => {
    const ref = before.link[i] as number[];
    const [bx, by, bw, bh] = ref;
    expect([x, y, w]).toEqual([bx, by, bw]);
    expect(h).toBeCloseTo((bh ?? 0) + 4, 1);
  });
}
