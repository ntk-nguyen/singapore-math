import "server-only";
import { auth, signInEnabled } from "@/auth";
import { db } from "./db";
import { mergeFamily, parseFamily, type Family } from "./family";

export interface Parent {
  id: string;
  name: string | null;
  email: string | null;
}

/** The signed-in parent, or null when signed out or sign-in isn't set up. */
export async function currentParent(): Promise<Parent | null> {
  if (!signInEnabled()) return null;
  try {
    const session = await auth();
    const u = session?.user;
    // Postgres hands back the SERIAL id as a number; keep it a string everywhere (Stripe's client_reference_id is one).
    return u?.id ? { id: String(u.id), name: u.name ?? null, email: u.email ?? null } : null;
  } catch (err) {
    console.error("Session lookup failed", err);
    return null;
  }
}

/** The Stripe customer linked to this parent's account, if any. */
export async function linkedCustomer(userId: string): Promise<string | null> {
  const r = await db().query<{ stripe_customer: string | null }>("SELECT stripe_customer FROM families WHERE user_id = $1", [userId]);
  return r.rows[0]?.stripe_customer ?? null;
}

/**
 * Link a Stripe customer to the parent's account, so Pro follows them to every device.
 * Never moves a customer that is already linked to someone else, and never replaces one.
 */
export async function linkCustomer(userId: string, customer: string): Promise<void> {
  try {
    await db().query(
      `INSERT INTO families (user_id, stripe_customer) VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET stripe_customer = EXCLUDED.stripe_customer, updated_at = now()
       WHERE families.stripe_customer IS NULL`,
      [userId, customer],
    );
  } catch (err) {
    // A unique violation means another account already holds this customer: leave both as they are.
    if ((err as { code?: string }).code !== "23505") throw err;
  }
}

export async function loadFamily(userId: string): Promise<Family | null> {
  const r = await db().query<{ data: unknown }>("SELECT data FROM families WHERE user_id = $1", [userId]);
  const data = r.rows[0]?.data;
  return data ? parseFamily(data) : null;
}

/** Merge a device's copy into the account's copy and return the result, one write at a time per family. */
export async function saveFamily(userId: string, incoming: Family): Promise<Family> {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    await client.query("INSERT INTO families (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING", [userId]);
    const r = await client.query<{ data: unknown }>("SELECT data FROM families WHERE user_id = $1 FOR UPDATE", [userId]);
    const stored = r.rows[0]?.data;
    const merged = stored ? mergeFamily(parseFamily(stored), incoming) : incoming;
    await client.query("UPDATE families SET data = $2, updated_at = now() WHERE user_id = $1", [userId, JSON.stringify(merged)]);
    await client.query("COMMIT");
    return merged;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/** Delete the parent's account, sessions and synced children. Stripe billing is separate and unchanged. */
export async function deleteParent(userId: string): Promise<void> {
  await db().query("DELETE FROM users WHERE id = $1", [userId]);
}
