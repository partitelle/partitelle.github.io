import { describe, expect, it } from "vitest";
import {
  formatDate,
  groupByYear,
  isoDate,
  neighbours,
  sortPosts,
} from "./news";

const post = (id: string, date: string, order?: number) => ({
  id,
  data: { date: new Date(date), order },
});

describe("sortPosts", () => {
  it("sorts newest first, then by order, then by id", () => {
    const sorted = sortPosts([
      post("old", "2022-04-16"),
      post("b", "2026-11-01", 2),
      post("a", "2026-11-01", 3),
      post("new", "2026-11-02", 1),
      post("c", "2026-11-01"),
    ]);
    expect(sorted.map((p) => p.id)).toEqual(["new", "a", "b", "c", "old"]);
  });
});

describe("dates", () => {
  it("formats in Italian without shifting the day", () => {
    expect(formatDate(new Date("2026-11-02"))).toBe("2 novembre 2026");
    expect(isoDate(new Date("2022-04-16"))).toBe("2022-04-16");
  });
});

describe("groupByYear", () => {
  it("groups a sorted list by year, newest first", () => {
    const groups = groupByYear(
      sortPosts([
        post("a", "2026-11-02"),
        post("b", "2024-10-31"),
        post("c", "2026-10-31"),
      ]),
    );
    expect(groups.map((g) => [g.year, g.posts.map((p) => p.id)])).toEqual([
      [2026, ["a", "c"]],
      [2024, ["b"]],
    ]);
  });
});

describe("neighbours", () => {
  const list = sortPosts([
    post("a", "2026-03-01"),
    post("b", "2026-02-01"),
    post("c", "2026-01-01"),
  ]);
  it("returns the newer and the older post", () => {
    expect(neighbours(list, "b").map((p) => p.id)).toEqual(["a", "c"]);
  });
  it("returns only the older one for the newest post", () => {
    expect(neighbours(list, "a").map((p) => p.id)).toEqual(["b"]);
  });
  it("returns only the newer one for the oldest post", () => {
    expect(neighbours(list, "c").map((p) => p.id)).toEqual(["b"]);
  });
});
