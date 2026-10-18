#!/usr/bin/env bash
# Starts everything for local development: checks Node and Docker, installs packages,
# makes sure .env.local exists with a local DATABASE_URL, then runs `npm run dev`
# (which starts Postgres from docker-compose.yml first). Run from anywhere: scripts/dev.sh
set -euo pipefail
cd "$(dirname "$0")/.."

LOCAL_DB_URL="postgres://postgres:postgres@localhost:5433/mathbridge"
say() { printf '\033[1m[dev]\033[0m %s\n' "$*"; }
die() { printf '\033[31m[dev]\033[0m %s\n' "$*" >&2; exit 1; }

# 1. Node and npm
command -v node >/dev/null || die "Node.js isn't installed. Install it with: brew install node"
command -v npm >/dev/null || die "npm isn't installed (it comes with Node.js)."
say "Node $(node -v)"

# 2. Packages: install when node_modules is missing or older than package-lock.json
if [ ! -d node_modules ] || [ package-lock.json -nt node_modules/.package-lock.json ]; then
  say "Installing packages..."
  npm install
fi

# 3. .env.local, with a DATABASE_URL for the local Postgres
if [ ! -f .env.local ]; then
  say "Creating .env.local from .env.example"
  cp .env.example .env.local
  secret=$(openssl rand -base64 33)
  sed -i '' "s|^SESSION_SECRET=.*|SESSION_SECRET=${secret}|" .env.local
fi
if grep -qE '^DATABASE_URL=$' .env.local; then
  sed -i '' "s|^DATABASE_URL=$|DATABASE_URL=${LOCAL_DB_URL}|" .env.local
elif ! grep -qE '^DATABASE_URL=' .env.local; then
  printf '\n# Local Postgres from docker-compose.yml\nDATABASE_URL=%s\n' "$LOCAL_DB_URL" >> .env.local
fi

# 4. Docker: open Docker Desktop and wait for it if it isn't running yet
if ! command -v docker >/dev/null; then
  say "Docker isn't installed; the app will run without a database (signed-out)."
elif ! docker info >/dev/null 2>&1; then
  say "Starting Docker Desktop..."
  open -a Docker 2>/dev/null || true
  for _ in $(seq 1 60); do
    docker info >/dev/null 2>&1 && break
    sleep 2
  done
  docker info >/dev/null 2>&1 || say "Docker didn't start; the app will run without a database (signed-out)."
fi

# 5. Postgres (via the predev hook) and the dev server
say "Starting the app at http://localhost:3000 (Ctrl+C to stop; npm run db:down stops Postgres)"
exec npm run dev
