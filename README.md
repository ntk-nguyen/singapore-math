# MathBridge

<img src="src/app/icon.svg" width="48" alt="MathBridge logo">

A fun, interactive Singapore Math app for Grades 1–8, built with Next.js (App Router) and TypeScript.

- **Learn**: one worked bar-model lesson per grade, from number bonds (Grade 1) to linear equations (Grade 8).
- **Number skills**: 27 lessons for Grades 1–6 on 2- to 5-digit addition, subtraction, multiplication and division, each tagged with its Common Core code. Make 10 with number bonds, place-value discs for regrouping, the area model leading to long multiplication, and long division as sharing place by place. Every lesson steps through a fresh example, and every practice question has "Show me how".
- **Times tables**: anchor facts plus tricks (doubling, half of ten, ten minus one, five plus two…), a tappable 12 × 12 fact map that explains any fact, and a 60-second sprint that brings back missed facts until they're mastered. Free.
- **Problem solving**: word problems solved with bar models and solve-for-x equations, each at three levels. Easy is free; intermediate and advanced need the Pro plan and are only served by `/api/practice/[kind]` after a server-side plan check. Every question has a worked solution.
- **Play**: a ten-question challenge at the child's grade, with stars, streaks, confetti and a "Show me the bar model" hint.
- **Practice tests**: two free tests (adaptive Placement check, Grade checkpoint) and six Pro plan tests behind a Stripe paywall.
- **Upgrade to Pro** (`/pro`): Free vs Pro plan comparison and the 7-day trial. The header's Go Pro button, the home sidebar card and every locked test or level lead here or to the in-app upgrade prompt.
- **Parent sign-in with Google** (optional): a parent signs in on the Parents page, and their children's profiles, progress and Pro plan follow them to every device. Signed out, everything works as before on one device.
- **Parents**: Common Core ↔ Singapore level map, how results compare with MAP Growth and state tests, privacy notes, and plan management.

Every question is tagged with a Common Core code, so results are reported by standard. The design and product plan lives in the project's `plan.md` (Google Stitch prompts, baselining against US tests, paywall, COPPA notes).

## Run it

```bash
npm install
cp .env.example .env.local   # fill in Stripe test keys, or set DEV_PRO=true to be Pro locally
npm run dev
```

Checks: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` (all run in CI).

## Parent sign-in with Google (optional)

Sign-in uses [Auth.js](https://authjs.dev) (`next-auth` v5) with the Google provider and sessions stored in Postgres. It switches on only when `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are all set. Without them the app runs signed-out and the sign-in button is hidden.

### 1. A Postgres database

Any Postgres works. Two free options:

- **Neon** (works on Vercel too): create a project at [neon.tech](https://neon.tech) and copy its connection string into `DATABASE_URL`.
- **Local**: `createdb mathbridge`, then `DATABASE_URL=postgres://localhost:5432/mathbridge` (add a user and password if yours needs them).

The tables (`users`, `accounts`, `sessions`, `verification_token`, `families`) are created automatically on the first request. The SQL is in `src/lib/db.ts`.

### 2. A Google OAuth client

1. Open [Google Cloud Console](https://console.cloud.google.com/), create or pick a project.
2. **APIs & Services → OAuth consent screen** (Google Auth Platform → Branding): app name *MathBridge*, your support email, audience **External**. While the app is in *Testing*, add the Google accounts that may sign in under **Test users**.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**, application type **Web application**.
4. **Authorized JavaScript origins**: `http://localhost:3000` (and your production URL, e.g. `https://mathbridge.example`).
5. **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google` (and `https://mathbridge.example/api/auth/callback/google` for production).
6. Create, then copy the **Client ID** into `AUTH_GOOGLE_ID` and the **Client secret** into `AUTH_GOOGLE_SECRET` in `.env.local` (or your host's environment variables). Never commit them; `.env*` files are git-ignored.

### 3. A secret

`AUTH_SECRET` signs the sign-in cookies. Generate one with `npx auth secret` or `openssl rand -base64 33`.

Restart `npm run dev`; the Parents page now shows **Sign in with Google**. On Vercel set the same four variables in Project Settings → Environment Variables. Anywhere other than Vercel or `npm run dev` (for example `npm start` on your own server), also set `AUTH_URL` to the public URL, or Auth.js refuses the request.

### What it stores

- The parent's Google name and email (no Google access tokens are kept).
- Each child's first name or nickname, avatar and progress, as one JSON copy per family (`families.data`), plus the linked Stripe customer id.
- Each device still keeps its own copy. While signed in, the app pulls the account's copy on sign-in and when the app comes back into view, and saves after each change. Copies merge: children are matched by id, the most recent name, avatar and grade win, and stars, best scores, lessons and daily activity keep the higher or combined value. Deleting a child on one device deletes them everywhere.
- **Delete account** on the Parents page deletes the account and its synced copy. It doesn't cancel a Stripe subscription (use **Manage or cancel subscription** for that).

## Payments (Stripe test mode only)

- `POST /api/checkout` starts a Stripe Checkout subscription with a 7-day trial, priced per child: $7.99/month for the first child and $3.99 for each extra child, up to 5 (quantity = children). The app finds or creates a graduated tiered Price with lookup key `mathbridge_pro_per_child_monthly` in test mode. Set `STRIPE_PRICE_ID` to use your own Price instead. To let parents change the number of children later, allow quantity changes in the Customer Portal settings.
- `GET /api/checkout/success` verifies the Checkout Session and stores the Stripe customer id in a signed, httpOnly cookie. If a parent is signed in, the customer is also linked to their account, so Pro works on every device where they sign in. A plan bought before signing in moves to the account the first time the parent signs in on that device.
- `GET /api/tests/[id]` serves test papers and checks the Pro plan **on the server** (an active or trialing subscription, looked up in Stripe) before returning a paid test.
- `POST /api/portal` opens the Stripe Customer Portal so parents can cancel.
- The app refuses live keys (`sk_live_`/`rk_live_`). Use a test card such as `4242 4242 4242 4242`.
- `DEV_PRO=true` makes you Pro on `npm run dev` with no Stripe: the server checks (`/api/tests`, `/api/papers`, `/api/practice`, `/api/thinking`) and `/api/plan` all report Pro. It is ignored in production.
- `ALLOW_DEMO_UNLOCK=true` adds an "Unlock (demo)" button for local development. It is ignored in production.

## Privacy

Children don't sign up. Stars, scores and placement stay in the browser's local storage, and in the parent's account only if a parent signs in. Fonts are self-hosted, and there are no ads or third-party trackers. Only a grown-up signs in or completes checkout.

## Not built yet

- Stripe webhooks (the plan is still looked up in Stripe on each check, cached for a minute).
- Per-child question history on the server (`docs/per-child-no-repeat.md`); the `families` table is the place to hang it.
- IRT-calibrated item bank and MAP RIT concordance; the placement rule is the simple up/down rule from the prototype.
- Parent standards heat map and printable worksheets.
