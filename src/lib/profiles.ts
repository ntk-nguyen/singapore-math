/**
 * Child profiles and per-child Pro pricing. Pure helpers, shared by the browser
 * (profiles stored on this device) and the server (checkout quantity).
 */

/** Most children one family can add, and the most a Pro plan covers. */
export const MAX_CHILDREN = 5;

/** Pro plan monthly price in cents: the first child, then each extra child. */
export const FIRST_CHILD_CENTS = 799;
export const EXTRA_CHILD_CENTS = 399;

/** Built-in avatars, so children never upload a photo. */
export const AVATARS = ["🦊", "🐼", "🐯", "🐸", "🦉", "🐙", "🦄", "🐢", "🐧", "🦁"] as const;
export type Avatar = (typeof AVATARS)[number];

export function isAvatar(v: unknown): v is Avatar {
  return typeof v === "string" && (AVATARS as readonly string[]).includes(v);
}

/** Clamp a requested number of children to what a plan can cover. */
export function clampChildren(n: unknown): number {
  const v = typeof n === "number" && Number.isFinite(n) ? Math.round(n) : 1;
  return Math.min(MAX_CHILDREN, Math.max(1, v));
}

/** Monthly Pro price in cents for a family with `n` children on the plan. */
export function proMonthlyCents(n: number): number {
  return FIRST_CHILD_CENTS + EXTRA_CHILD_CENTS * (clampChildren(n) - 1);
}

export function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Names are first names or nicknames only: trimmed, single-spaced, at most 20 characters. */
export function cleanName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, 20);
}
