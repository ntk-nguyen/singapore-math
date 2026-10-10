import "server-only";
import { Pool } from "pg";

/**
 * Postgres, used only for parent accounts (Auth.js tables) and each family's synced
 * children. Optional: without DATABASE_URL the app runs signed-out, as before.
 */
export function dbConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}

let pool: Pool | null = null;

export function db(): Pool {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set.");
  // A few connections is plenty for one serverless instance or a dev server.
  return (pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 3 }));
}

/**
 * Tables for @auth/pg-adapter (users, accounts, sessions, verification_token) plus
 * families. Created on first use, so a new database needs no setup step.
 */
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  "emailVerified" TIMESTAMPTZ,
  image TEXT
);
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  "providerAccountId" VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  id_token TEXT,
  scope TEXT,
  session_state TEXT,
  token_type TEXT,
  UNIQUE (provider, "providerAccountId")
);
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL,
  "sessionToken" VARCHAR(255) NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS verification_token (
  identifier TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  token TEXT NOT NULL,
  PRIMARY KEY (identifier, token)
);
CREATE TABLE IF NOT EXISTS families (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer TEXT UNIQUE,
  data JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

let ready: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  ready ??= db()
    .query(SCHEMA)
    .then(() => undefined)
    .catch((err) => {
      ready = null; // try again on the next request
      throw err;
    });
  return ready;
}
