/**
 * Times tables the Singapore way: learn a few anchor facts (×1, ×2, ×5, ×10) and
 * derive the rest by doubling, halving and splitting (the distributive property).
 */
export const TABLES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
export const MAX = 12;

export interface Strategy {
  /** Short name of the trick. */
  name: string;
  /** Worked example for this exact fact. */
  how: string;
}

/** The friendliest strategy for a × b, with the working for this fact. */
export function strategy(a: number, b: number): Strategy {
  const p = a * b;
  // Use the factor with the easiest rule as the "table".
  const order = [1, 10, 2, 5, 11, 9, 4, 3, 8, 12, 6, 7];
  const t = order.find((x) => x === a || x === b)!;
  const n = t === a ? b : a;
  switch (t) {
    case 1: return { name: "Times 1", how: `Any number times 1 is itself: ${n} × 1 = ${p}.` };
    case 10: return { name: "Times 10", how: `Each ${n === 1 ? "one" : "of the " + n + " ones"} becomes a ten: ${n} × 10 = ${p}.` };
    case 2: return { name: "Doubles", how: `× 2 is doubling: double ${n} is ${p}.` };
    case 5: return { name: "Half of ten", how: `× 5 is half of × 10: ${n} × 10 = ${n * 10}, half of that is ${p}.` };
    case 11: return n <= 9
      ? { name: "Elevens", how: `× 11 for 1 to 9 repeats the digit: ${n} × 11 = ${p}.` }
      : { name: "Ten and one more", how: `${n} × 11 = ${n} × 10 + ${n} = ${n * 10} + ${n} = ${p}.` };
    case 9: return { name: "Ten minus one", how: `${n} × 9 = ${n} × 10 − ${n} = ${n * 10} − ${n} = ${p}. The digits of ${p} add to 9${n > 10 ? " (or 18)" : ""}.` };
    case 4: return { name: "Double double", how: `× 4 is double, then double again: ${n} → ${n * 2} → ${p}.` };
    case 3: return { name: "Double plus one more", how: `${n} × 3 = ${n} × 2 + ${n} = ${n * 2} + ${n} = ${p}.` };
    case 8: return { name: "Double three times", how: `× 8 is doubling three times: ${n} → ${n * 2} → ${n * 4} → ${p}.` };
    case 12: return { name: "Ten plus two", how: `${n} × 12 = ${n} × 10 + ${n} × 2 = ${n * 10} + ${n * 2} = ${p}.` };
    case 6: return { name: "Five plus one more", how: `${n} × 6 = ${n} × 5 + ${n} = ${n * 5} + ${n} = ${p}.` };
    default: return { name: "Five plus two", how: `${n} × 7 = ${n} × 5 + ${n} × 2 = ${n * 5} + ${n * 2} = ${p}.` };
  }
}

/** Facts are stored once: 7 × 8 and 8 × 7 are the same fact. */
export const factKey = (a: number, b: number) => (a <= b ? `${a}x${b}` : `${b}x${a}`);

/** Mastery 0–3. A fast correct answer adds 1; a miss resets to 0. */
export const MASTERED = 3;
export function nextMastery(current: number, ok: boolean, ms: number): number {
  if (!ok) return 0;
  return ms <= 5000 ? Math.min(MASTERED, current + 1) : current;
}

/** How many questions later a missed fact comes back. */
export const RETRY_GAP = 4;

/**
 * The facts for a sprint, dealt like a shuffled deck: every fact in the chosen tables
 * comes up once before any fact repeats, facts not yet mastered come first, and each
 * new deck starts with a different fact from the one just asked. A missed fact comes
 * back once, a few questions later, so it can stick.
 */
export function factDeck(tables: number[], mastery: Record<string, number>, r: () => number) {
  const facts = new Map<string, [number, number]>();
  for (const t of tables) for (let n = 1; n <= MAX; n++) facts.set(factKey(t, n), t <= n ? [t, n] : [n, t]);
  let deck: string[] = [];
  const retries: { key: string; at: number }[] = [];
  let asked = 0;
  let last: string | undefined;

  const deal = () => {
    // Shuffle, then put the least-mastered facts first (a stable sort keeps the shuffle within a level).
    const keys = [...facts.keys()];
    for (let i = keys.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [keys[i], keys[j]] = [keys[j], keys[i]];
    }
    keys.sort((a, b) => Math.min(mastery[a] ?? 0, MASTERED) - Math.min(mastery[b] ?? 0, MASTERED));
    if (keys.length > 1 && keys[0] === last) keys.push(keys.shift()!);
    deck = keys;
  };

  return {
    /** The next fact, in a random order (7 × 8 or 8 × 7). */
    next(): [number, number] {
      const due = retries.findIndex((x) => x.at <= asked && x.key !== last);
      let key: string;
      if (due >= 0) {
        key = retries.splice(due, 1)[0].key;
        // Asked again now, so it does not also need its place in this deck.
        const k = deck.indexOf(key);
        if (k >= 0) deck.splice(k, 1);
      } else {
        if (!deck.length) deal();
        key = deck.shift()!;
      }
      asked++;
      last = key;
      const [a, b] = facts.get(key)!;
      return r() < 0.5 ? [a, b] : [b, a];
    },
    /** The fact was answered wrongly: ask it again a few questions from now. */
    missed(a: number, b: number) {
      const key = factKey(a, b);
      if (facts.has(key) && !retries.some((x) => x.key === key)) retries.push({ key, at: asked + RETRY_GAP });
    },
    /** How many different facts the chosen tables hold. */
    size: facts.size,
  };
}
