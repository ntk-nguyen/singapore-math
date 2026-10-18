import { describe, expect, it } from "vitest";
import { DEFAULT_PROGRESS, familyAfterSignIn, isBlankStart, mergeFamily, parseFamily, sameFamily, STARTER_NAME, type Family, type Profile } from "./family";

const kid = (id: string, over: Partial<Profile> = {}, progress: Partial<Profile["progress"]> = {}): Profile => ({
  id, name: id.toUpperCase(), avatar: "🦊", progress: { ...DEFAULT_PROGRESS, ...progress }, ...over,
});
const fam = (...profiles: Profile[]): Family => ({ profiles, removed: [] });

describe("mergeFamily", () => {
  it("keeps children from both copies, matched by id", () => {
    const m = mergeFamily(fam(kid("a"), kid("b")), fam(kid("b"), kid("c")));
    expect(m.profiles.map((p) => p.id)).toEqual(["a", "b", "c"]);
  });

  it("never loses earned stars, best scores, lessons or daily activity", () => {
    const here = kid("a", { updatedAt: 2 }, { stars: 5, best: { t1: 60 }, lessons: ["l1"], days: { "2026-10-09": { xp: 30, done: 1 } } });
    const there = kid("a", { updatedAt: 1 }, { stars: 9, best: { t1: 80, t2: 40 }, lessons: ["l2"], days: { "2026-10-09": { xp: 10, done: 2 }, "2026-10-08": { xp: 5, done: 1 } } });
    const p = mergeFamily(fam(here), fam(there)).profiles[0].progress;
    expect(p.stars).toBe(9);
    expect(p.best).toEqual({ t1: 80, t2: 40 });
    expect(p.lessons.sort()).toEqual(["l1", "l2"]);
    expect(p.days).toEqual({ "2026-10-09": { xp: 30, done: 2 }, "2026-10-08": { xp: 5, done: 1 } });
  });

  it("takes the name, avatar and grade from the copy changed most recently", () => {
    const old = kid("a", { name: "Sam", updatedAt: 1 }, { grade: 3 });
    const fresh = kid("a", { name: "Sammy", avatar: "🐼", updatedAt: 5 }, { grade: 4 });
    for (const m of [mergeFamily(fam(old), fam(fresh)), mergeFamily(fam(fresh), fam(old))]) {
      expect(m.profiles[0]).toMatchObject({ name: "Sammy", avatar: "🐼", updatedAt: 5 });
      expect(m.profiles[0].progress.grade).toBe(4);
    }
  });

  it("keeps a deleted child deleted when another device still has them", () => {
    const m = mergeFamily({ profiles: [kid("a")], removed: ["b"] }, fam(kid("a"), kid("b")));
    expect(m.profiles.map((p) => p.id)).toEqual(["a"]);
    expect(m.removed).toEqual(["b"]);
  });

  it("is stable: merging the result again changes nothing", () => {
    const a = fam(kid("a", { updatedAt: 3 }, { stars: 2 }), kid("b"));
    const b = { profiles: [kid("a", { updatedAt: 1 }, { stars: 7 }), kid("c")], removed: ["b"] };
    const once = mergeFamily(b, a);
    expect(mergeFamily(once, a)).toEqual(once);
    expect(mergeFamily(once, b)).toEqual(once);
    // A device and the account agree after one round trip, so syncing stops.
    expect(sameFamily(mergeFamily(once, a), once)).toBe(true);
  });

  it("compares copies whatever order their keys are in", () => {
    const x = kid("a", {}, { days: { "2026-10-01": { xp: 1, done: 0 }, "2026-10-02": { xp: 2, done: 1 } } });
    const y: Profile = { progress: { ...x.progress, days: { "2026-10-02": { done: 1, xp: 2 }, "2026-10-01": { xp: 1, done: 0 } } }, avatar: x.avatar, name: x.name, id: x.id };
    expect(sameFamily(fam(x), fam(y))).toBe(true);
    expect(sameFamily(fam(x), fam(kid("a", { name: "Other" })))).toBe(false);
  });

  it("caps the family at five children", () => {
    const m = mergeFamily(fam(kid("a"), kid("b"), kid("c")), fam(kid("d"), kid("e"), kid("f")));
    expect(m.profiles).toHaveLength(5);
  });
});

describe("familyAfterSignIn", () => {
  const starter = fam(kid("x", { name: STARTER_NAME }));

  it("a new device takes the account's children instead of adding a blank Player 1", () => {
    expect(isBlankStart(starter)).toBe(true);
    expect(familyAfterSignIn(starter, fam(kid("a"))).profiles.map((p) => p.id)).toEqual(["a"]);
  });

  it("a device with progress adds its children to the account", () => {
    const local = fam(kid("x", { name: STARTER_NAME }, { stars: 3 }));
    expect(isBlankStart(local)).toBe(false);
    expect(familyAfterSignIn(local, fam(kid("a"))).profiles.map((p) => p.id)).toEqual(["a", "x"]);
  });

  it("the first device to sign in keeps what it has", () => {
    expect(familyAfterSignIn(starter, null)).toBe(starter);
  });
});

describe("parseFamily", () => {
  it("drops malformed profiles and fields", () => {
    const f = parseFamily({
      profiles: [{ id: "a", name: "  Mia   Lee ", avatar: "💣", progress: { grade: 12, stars: "9", best: { t: 50, u: "x" } } }, { name: "no id" }, null],
      removed: ["z", 4],
    });
    expect(f.removed).toEqual(["z"]);
    expect(f.profiles).toHaveLength(1);
    expect(f.profiles[0]).toMatchObject({ id: "a", name: "Mia Lee", avatar: "🦊" });
    expect(f.profiles[0].progress).toMatchObject({ grade: 3, stars: 0, best: { t: 50 } });
  });

  it("handles junk", () => {
    expect(parseFamily(null)).toEqual({ profiles: [], removed: [] });
    expect(parseFamily("x")).toEqual({ profiles: [], removed: [] });
  });
});
