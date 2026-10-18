/** A random source returning floats in [0, 1). */
export type Rng = () => number;

/** Deterministic xorshift RNG, so a seeded test always produces the same questions. */
export function seeded(seed: number): Rng {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1e6) / 1e6;
  };
}

export function helpers(r: Rng) {
  const ri = (a: number, b: number) => a + Math.floor(r() * (b - a + 1));
  const pick = <T,>(a: readonly T[]): T => a[Math.floor(r() * a.length)];
  const shuffle = <T,>(a: T[]): T[] => {
    const out = [...a];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };
  return { ri, pick, shuffle };
}

/**
 * Deal items like a shuffled deck: each one once, in a random order, before any comes
 * back; then a fresh shuffle that does not start with the item just dealt.
 */
export function deck<T>(items: readonly T[], r: Rng): () => T {
  const { shuffle } = helpers(r);
  let left: number[] = [];
  let last = -1;
  return () => {
    if (!left.length) {
      left = shuffle(items.map((_, i) => i));
      if (left.length > 1 && left[0] === last) left.push(left.shift()!);
    }
    last = left.shift()!;
    return items[last];
  };
}

export const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
