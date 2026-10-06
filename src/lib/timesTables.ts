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

/**
 * Pick the next fact for the sprint: weighted toward facts not yet mastered,
 * never the same fact twice in a row.
 */
export function pickFact(tables: number[], mastery: Record<string, number>, r: () => number, last?: string): [number, number] {
  const pool: [number, number, number][] = [];
  for (const t of tables) for (let n = 1; n <= MAX; n++) {
    const k = factKey(t, n);
    if (k === last) continue;
    const m = mastery[k] ?? 0;
    pool.push([t, n, MASTERED + 1 - m]);
  }
  const total = pool.reduce((s, x) => s + x[2], 0);
  let x = r() * total;
  for (const [t, n, w] of pool) {
    x -= w;
    if (x < 0) return r() < 0.5 ? [t, n] : [n, t];
  }
  return [pool[0][0], pool[0][1]];
}
