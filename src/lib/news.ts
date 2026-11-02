export const categorySlugs = [
  "partita",
  "giocatori",
  "squadre",
  "promemoria",
  "app",
  "privacy",
  "sito",
] as const;

export type Category = (typeof categorySlugs)[number];

export interface PostLike {
  id: string;
  data: { date: Date; order?: number | undefined };
}

// Newest first. Same-day posts: higher `order` first, then by id.
export function sortPosts<T extends PostLike>(posts: readonly T[]): T[] {
  return [...posts].sort(
    (a, b) =>
      b.data.date.getTime() - a.data.date.getTime() ||
      (b.data.order ?? 0) - (a.data.order ?? 0) ||
      a.id.localeCompare(b.id),
  );
}

const formatter = new Intl.DateTimeFormat("it-IT", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export const formatDate = (date: Date) => formatter.format(date);
export const isoDate = (date: Date) => date.toISOString().slice(0, 10);

// Groups a newest-first list by UTC year, keeping the order (newest year first).
export function groupByYear<T extends PostLike>(posts: readonly T[]) {
  const groups: { year: number; posts: T[] }[] = [];
  for (const post of posts) {
    const year = post.data.date.getUTCFullYear();
    const last = groups[groups.length - 1];
    if (last?.year === year) last.posts.push(post);
    else groups.push({ year, posts: [post] });
  }
  return groups;
}

// The posts shown under a post: the next newer and the next older (newer first).
export function neighbours<T extends PostLike>(
  posts: readonly T[],
  id: string,
) {
  const i = posts.findIndex((p) => p.id === id);
  return [posts[i - 1], posts[i + 1]].filter((p): p is T => p !== undefined);
}
