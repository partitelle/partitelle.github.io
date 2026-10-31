import { describe, expect, it } from "vitest";
import {
  canMakeTeams,
  createDemoState,
  DEMO_TARGET,
  type DemoState,
  join,
  leave,
  makeTeams,
  propose,
  splitTeams,
} from "./demo-state";

const names = (n: number, from = 1) =>
  Array.from({ length: n }, (_, i) => `p${from + i}`);
const withPlayers = (confirmed: number, maybes = 0): DemoState =>
  createDemoState([
    ...names(confirmed).map((name) => ({ name, maybe: false })),
    ...names(maybes, confirmed + 1).map((name) => ({ name, maybe: true })),
  ]);
// deterministic rng: always picks the first remaining name
const first = () => 0;

describe("target", () => {
  it("defaults to 10", () => {
    expect(DEMO_TARGET).toBe(10);
    expect(createDemoState()).toEqual({ players: [], target: 10, teams: null });
  });
});

describe("join (aggiungimi)", () => {
  it("adds a confirmed player", () => {
    const r = join(createDemoState(), "ale");
    expect(r.kind).toBe("added");
    expect(r.name).toBe("ale");
    expect(r.state.players).toEqual([{ name: "ale", maybe: false }]);
    expect(r.reachedTarget).toBe(false);
    expect(r.teamsRevoked).toBe(false);
  });

  it("answers already-in for a duplicate, ignoring case", () => {
    const s = join(createDemoState(), "ale").state;
    const r = join(s, "ALE");
    expect(r.kind).toBe("already-in");
    expect(r.name).toBe("ALE");
    expect(r.state).toBe(s);
  });

  it("confirms a maybe in place, keeping the slot count", () => {
    const s = createDemoState([
      { name: "a", maybe: false },
      { name: "b", maybe: true },
    ]);
    const r = join(s, "b");
    expect(r.kind).toBe("confirmed");
    expect(r.name).toBe("b");
    expect(r.state.players).toEqual([
      { name: "a", maybe: false },
      { name: "b", maybe: false },
    ]);
  });

  it("is full when confirmed players fill every slot", () => {
    const s = withPlayers(10);
    const r = join(s, "late");
    expect(r.kind).toBe("full");
    expect(r.name).toBeNull();
    expect(r.state).toBe(s);
  });

  it("is full when a maybe holds the last slot", () => {
    const s = withPlayers(9, 1);
    const r = join(s, "late");
    expect(r.kind).toBe("full");
    expect(r.state.players).toHaveLength(10);
  });

  it("a maybe can still be confirmed when the list is full", () => {
    const r = join(withPlayers(9, 1), "p10");
    expect(r.kind).toBe("confirmed");
    expect(r.reachedTarget).toBe(true);
    expect(canMakeTeams(r.state)).toBe(true);
  });

  it("flags reachedTarget on the tenth confirmed player only", () => {
    expect(join(withPlayers(8), "x").reachedTarget).toBe(false);
    expect(join(withPlayers(9), "x").reachedTarget).toBe(true);
  });
});

describe("propose (proponimi)", () => {
  it("adds a maybe that holds a slot", () => {
    const r = propose(createDemoState(), "ale");
    expect(r.kind).toBe("proposed");
    expect(r.name).toBe("ale");
    expect(r.state.players).toEqual([{ name: "ale", maybe: true }]);
  });

  it("answers already-in for a duplicate maybe", () => {
    const s = propose(createDemoState(), "ale").state;
    const r = propose(s, "Ale");
    expect(r.kind).toBe("already-in");
    expect(r.state).toBe(s);
  });

  it("moves a confirmed player to maybe", () => {
    const r = propose(withPlayers(2), "p1");
    expect(r.kind).toBe("moved-to-maybe");
    expect(r.state.players).toEqual([
      { name: "p1", maybe: true },
      { name: "p2", maybe: false },
    ]);
  });

  it("is full when every slot is held", () => {
    const s = withPlayers(8, 2);
    const r = propose(s, "late");
    expect(r.kind).toBe("full");
    expect(r.state).toBe(s);
  });

  it("holds a slot: 9 confirmed + 1 maybe leaves no room", () => {
    const s = propose(withPlayers(9), "m").state;
    expect(s.players).toHaveLength(10);
    expect(join(s, "late").kind).toBe("full");
  });
});

describe("leave (toglimi)", () => {
  it("removes a confirmed player and frees the slot", () => {
    const full = withPlayers(10);
    const r = leave(full, "p3");
    expect(r.kind).toBe("removed");
    expect(r.name).toBe("p3");
    expect(r.state.players).toHaveLength(9);
    expect(join(r.state, "new").kind).toBe("added");
  });

  it("removes a maybe and frees the slot", () => {
    const r = leave(withPlayers(9, 1), "P10");
    expect(r.kind).toBe("removed");
    expect(r.state.players).toHaveLength(9);
    expect(join(r.state, "new").kind).toBe("added");
  });

  it("answers not-in for a stranger", () => {
    const s = withPlayers(2);
    const r = leave(s, "zed");
    expect(r.kind).toBe("not-in");
    expect(r.name).toBeNull();
    expect(r.state).toBe(s);
  });
});

describe("teams (fai le squadre)", () => {
  it("canMakeTeams needs confirmed >= target", () => {
    expect(canMakeTeams(createDemoState())).toBe(false);
    expect(canMakeTeams(withPlayers(9))).toBe(false);
    expect(canMakeTeams(withPlayers(10))).toBe(true);
  });

  it("9 confirmed + 1 maybe cannot make teams", () => {
    const s = withPlayers(9, 1);
    expect(canMakeTeams(s)).toBe(false);
    const r = makeTeams(s, first);
    expect(r.kind).toBe("teams-locked");
    expect(r.state.teams).toBeNull();
  });

  it("10 confirmed make two balanced teams with every player once", () => {
    const r = makeTeams(withPlayers(10), first);
    expect(r.kind).toBe("teams-made");
    expect(r.state.teams).toEqual({
      black: ["p1", "p2", "p3", "p4", "p5"],
      white: ["p6", "p7", "p8", "p9", "p10"],
    });
  });

  it("splits with the rng, black drawn and white in list order", () => {
    const last = () => 0.99;
    expect(splitTeams(["a", "b", "c", "d"], last)).toEqual({
      black: ["d", "c"],
      white: ["a", "b"],
    });
    expect(splitTeams(["a", "b", "c", "d"], first)).toEqual({
      black: ["a", "b"],
      white: ["c", "d"],
    });
  });

  it("shows existing teams again instead of redrawing", () => {
    const made = makeTeams(withPlayers(10), first).state;
    const r = makeTeams(made, () => 0.99);
    expect(r.kind).toBe("teams-shown");
    expect(r.state).toBe(made);
  });

  it("an odd target cannot make teams", () => {
    const s = createDemoState(
      names(3).map((name) => ({ name, maybe: false })),
      3,
    );
    expect(canMakeTeams(s)).toBe(false);
    expect(makeTeams(s, first).kind).toBe("teams-locked");
  });

  it("leaving revokes the teams and re-locks", () => {
    const made = makeTeams(withPlayers(10), first).state;
    const r = leave(made, "p1");
    expect(r.teamsRevoked).toBe(true);
    expect(r.state.teams).toBeNull();
    expect(canMakeTeams(r.state)).toBe(false);
  });

  it("moving to maybe revokes the teams", () => {
    const made = makeTeams(withPlayers(10), first).state;
    const r = propose(made, "p1");
    expect(r.teamsRevoked).toBe(true);
    expect(r.state.teams).toBeNull();
  });

  it("does not report a revocation when there were no teams", () => {
    expect(leave(withPlayers(10), "p1").teamsRevoked).toBe(false);
  });
});

describe("purity", () => {
  it("never mutates the input state", () => {
    const s = withPlayers(9, 1);
    const snapshot = structuredClone(s);
    join(s, "p10");
    join(s, "new");
    propose(s, "p1");
    propose(s, "new");
    leave(s, "p1");
    makeTeams(s, first);
    makeTeams(withPlayers(10), first);
    expect(s).toEqual(snapshot);
  });

  it("does not mutate the names passed to splitTeams", () => {
    const input = ["a", "b", "c", "d"];
    splitTeams(input, first);
    expect(input).toEqual(["a", "b", "c", "d"]);
  });
});
