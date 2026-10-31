/**
 * Pure state of the landing demo: the slot rules of the real bot, no DOM, no side effects.
 *
 * Mirrors partitelle-bot @ 5e65ec0ee092f2d9a25584876cce03e8da497ee8 (origin/main, 2026-10-31):
 * - callbacks/echo.py (aggiungimi, proponimi, toglimi), callbacks/teams.py (/teams)
 * - domain/match.py (find, has_room, confirmed_count), utils/constants.py (default_target),
 *   utils/utils.py (generate_teams)
 * When the bot rules change, check this file for drift and update the tests.
 */

/** utils/constants.py:3 `default_target = 10` */
export const DEMO_TARGET = 10;

export type Player = { readonly name: string; readonly maybe: boolean };
export type Teams = {
  readonly black: readonly string[];
  readonly white: readonly string[];
};
export type DemoState = {
  readonly players: readonly Player[];
  readonly target: number;
  readonly teams: Teams | null;
};
export type Rng = () => number;

export type ResultKind =
  | "added"
  | "confirmed"
  | "proposed"
  | "moved-to-maybe"
  | "already-in"
  | "full"
  | "removed"
  | "not-in"
  | "teams-made"
  | "teams-shown"
  | "teams-locked";

export type DemoResult = {
  readonly state: DemoState;
  readonly kind: ResultKind;
  /** the player row to highlight, null when no row changed */
  readonly name: string | null;
  /** the confirmed list just reached the target (the bot announces it) */
  readonly reachedTarget: boolean;
  /** the teams existed and the change dropped them (bot: "SQUADRE ANNULLATE") */
  readonly teamsRevoked: boolean;
};

export const createDemoState = (
  players: readonly Player[] = [],
  target: number = DEMO_TARGET,
): DemoState => ({ players, target, teams: null });

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
const find = (s: DemoState, name: string, maybe: boolean) =>
  s.players.some((p) => same(p.name, name) && p.maybe === maybe);
const confirmedCount = (s: DemoState) =>
  s.players.filter((p) => !p.maybe).length;

/** domain/match.py:85 has_room: a maybe holds a slot too */
export const hasRoom = (s: DemoState) => s.players.length < s.target;

/** callbacks/teams.py:20-27: even target and confirmed == target (maybes do not count) */
export const canMakeTeams = (s: DemoState) =>
  s.target % 2 === 0 && s.players.length > 0 && confirmedCount(s) === s.target;

const reply = (
  prev: DemoState,
  next: DemoState,
  kind: ResultKind,
  name: string | null,
  reached = false,
): DemoResult => ({
  state: next,
  kind,
  name,
  reachedTarget: reached,
  teamsRevoked: prev.teams !== null && next.teams === null,
});

const setMaybe = (s: DemoState, name: string, maybe: boolean): DemoState => ({
  ...s,
  players: s.players.map((p) => (same(p.name, name) ? { ...p, maybe } : p)),
});

/** "aggiungimi" (echo.py:64-81) */
export function join(s: DemoState, name: string): DemoResult {
  if (find(s, name, false)) return reply(s, s, "already-in", name);
  const reached = confirmedCount(s) + 1 === s.target;
  if (find(s, name, true))
    return reply(s, setMaybe(s, name, false), "confirmed", name, reached);
  if (!hasRoom(s)) return reply(s, s, "full", null);
  const next = { ...s, players: [...s.players, { name, maybe: false }] };
  return reply(s, next, "added", name, reached);
}

/** "proponimi" (echo.py:149-166): teams are revoked when a confirmed player becomes a maybe */
export function propose(s: DemoState, name: string): DemoResult {
  if (find(s, name, true)) return reply(s, s, "already-in", name);
  if (find(s, name, false))
    return reply(
      s,
      { ...setMaybe(s, name, true), teams: null },
      "moved-to-maybe",
      name,
    );
  if (!hasRoom(s)) return reply(s, s, "full", null);
  const players = [...s.players, { name, maybe: true }];
  return reply(s, { ...s, players, teams: null }, "proposed", name);
}

/** "toglimi" (echo.py:226-240): frees the slot, whether confirmed or maybe */
export function leave(s: DemoState, name: string): DemoResult {
  if (!s.players.some((p) => same(p.name, name)))
    return reply(s, s, "not-in", null);
  const players = s.players.filter((p) => !same(p.name, name));
  return reply(s, { ...s, players, teams: null }, "removed", name);
}

/** utils.py:61-64 generate_teams: random.sample for black, the rest (in order) for white */
export function splitTeams(
  names: readonly string[],
  rng: Rng = Math.random,
): Teams {
  const pool = [...names];
  const black: string[] = [];
  for (let i = 0; i < Math.floor(names.length / 2); i++) {
    const j = Math.floor(rng() * pool.length);
    black.push(...pool.splice(j, 1));
  }
  return { black, white: pool };
}

/** "fai le squadre" (/teams, callbacks/teams.py:22-32): existing teams are shown again */
export function makeTeams(s: DemoState, rng: Rng = Math.random): DemoResult {
  if (s.teams) return reply(s, s, "teams-shown", null);
  if (!canMakeTeams(s)) return reply(s, s, "teams-locked", null);
  const names = s.players.filter((p) => !p.maybe).map((p) => p.name);
  return reply(s, { ...s, teams: splitTeams(names, rng) }, "teams-made", null);
}
