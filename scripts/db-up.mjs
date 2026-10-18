// Runs before `npm run dev`: starts the local Postgres from docker-compose.yml, or reuses it
// if it is already up. Skips (without failing) when DATABASE_URL points somewhere other than
// localhost, or when Docker isn't running; the app then runs signed-out as before.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (!existsSync(".env.local")) return "";
  const line = readFileSync(".env.local", "utf8")
    .split("\n")
    .find((l) => /^\s*DATABASE_URL\s*=/.test(l));
  return line ? line.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "") : "";
}

const url = databaseUrl();
let host = "";
try {
  host = url ? new URL(url).hostname : "";
} catch {}

if (!url) {
  console.log("[db] DATABASE_URL not set; skipping local Postgres.");
} else if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(host)) {
  console.log(`[db] DATABASE_URL points at ${host}; skipping local Postgres.`);
} else {
  try {
    execFileSync("docker", ["info"], { stdio: "ignore" });
  } catch {
    console.warn("[db] Docker isn't running; start Docker Desktop for the local database. Continuing without it.");
    process.exit(0);
  }
  console.log("[db] Starting local Postgres (docker compose)...");
  try {
    execFileSync("docker", ["compose", "up", "-d", "--wait", "db"], { stdio: "inherit" });
    console.log("[db] Local Postgres ready on localhost:5433.");
  } catch {
    console.warn("[db] Couldn't start local Postgres; continuing without it.");
  }
}
