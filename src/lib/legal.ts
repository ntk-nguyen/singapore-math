/** Shared bits of the privacy policy and terms pages. */
export const LEGAL_UPDATED = "October 18, 2026";

/** Where parents send privacy and account requests. Set CONTACT_EMAIL in production. */
export function contactEmail(): string | null {
  const e = process.env.CONTACT_EMAIL?.trim();
  return e && e.includes("@") ? e : null;
}
