import { randomUUID } from "node:crypto";

/**
 * Error reporting. Every error is logged as one JSON line (Vercel keeps these in its logs),
 * and also sent to Sentry when SENTRY_DSN is set. Reports go out from the server only, so
 * children's browsers never talk to a third party, and they carry the page path and the
 * error itself, never cookies, query strings or children's data.
 */
export type ErrorReport = {
  source: "server" | "browser";
  message: string;
  name?: string;
  stack?: string;
  digest?: string;
  path?: string;
};

type Dsn = { endpoint: string; key: string; dsn: string };

/** Parse a Sentry DSN (https://KEY@HOST/PROJECT) into its envelope endpoint and key. */
export function parseDsn(dsn: string | undefined): Dsn | null {
  if (!dsn) return null;
  try {
    const u = new URL(dsn);
    const project = u.pathname.replace(/^\/+|\/+$/g, "");
    if (!u.username || !project || !/^https?:$/.test(u.protocol)) return null;
    return { endpoint: `${u.protocol}//${u.host}/api/${project}/envelope/`, key: u.username, dsn };
  } catch {
    return null;
  }
}

/** Keep only the path: query strings can carry ids we don't want in reports. */
export function pathOnly(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url, "http://x").pathname;
  } catch {
    return undefined;
  }
}

const clip = (s: string | undefined, n: number) => (s && s.length > n ? s.slice(0, n) : s);

/** A Sentry envelope holding one error event. */
export function sentryEnvelope(r: ErrorReport, dsn: Dsn, now = new Date()): string {
  const eventId = randomUUID().replace(/-/g, "");
  const event = {
    event_id: eventId,
    timestamp: now.getTime() / 1000,
    platform: "javascript",
    level: "error",
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    transaction: r.path,
    tags: { source: r.source, ...(r.digest ? { digest: r.digest } : {}) },
    exception: { values: [{ type: r.name || "Error", value: r.message }] },
    extra: r.stack ? { stack: r.stack } : undefined,
  };
  return [
    JSON.stringify({ event_id: eventId, dsn: dsn.dsn, sent_at: now.toISOString() }),
    JSON.stringify({ type: "event" }),
    JSON.stringify(event),
  ].join("\n");
}

export async function reportError(input: ErrorReport): Promise<void> {
  const r: ErrorReport = {
    source: input.source,
    message: clip(input.message, 2000) || "Unknown error",
    name: clip(input.name, 200),
    stack: clip(input.stack, 8000),
    digest: clip(input.digest, 200),
    path: clip(pathOnly(input.path), 500),
  };
  console.error(JSON.stringify({ level: "error", event: "app_error", ...r }));
  const dsn = parseDsn(process.env.SENTRY_DSN);
  if (!dsn) return;
  try {
    await fetch(dsn.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-sentry-envelope",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${dsn.key}, sentry_client=mathbridge/1.0`,
      },
      body: sentryEnvelope(r, dsn),
      signal: AbortSignal.timeout(3000),
    });
  } catch (err) {
    console.error("Sending the error report failed", err);
  }
}
