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
- **For grown-ups**: Common Core ↔ Singapore level map, how results compare with MAP Growth and state tests, privacy notes, and plan management.

Every question is tagged with a Common Core code, so results are reported by standard. The design and product plan lives in the project's `plan.md` (Google Stitch prompts, baselining against US tests, paywall, COPPA notes).

## Run it

```bash
npm install
cp .env.example .env.local   # fill in Stripe test keys, or set ALLOW_DEMO_UNLOCK=true
npm run dev
```

Checks: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` (all run in CI).

## Payments (Stripe test mode only)

- `POST /api/checkout` starts a Stripe Checkout subscription ($7.99/month, 7-day trial). Set `STRIPE_PRICE_ID` to use a Price from your dashboard instead of inline pricing.
- `GET /api/checkout/success` verifies the Checkout Session and stores the Stripe customer id in a signed, httpOnly cookie.
- `GET /api/tests/[id]` serves test papers and checks the Pro plan **on the server** (an active or trialing subscription, looked up in Stripe) before returning a paid test.
- `POST /api/portal` opens the Stripe Customer Portal so parents can cancel.
- The app refuses live keys (`sk_live_`/`rk_live_`). Use a test card such as `4242 4242 4242 4242`.
- `ALLOW_DEMO_UNLOCK=true` adds an "Unlock (demo)" button for local development. It is ignored in production.

## Privacy

Children don't sign up. Stars, scores and placement stay in the browser's local storage, fonts are self-hosted, and there are no ads or third-party trackers. Only a grown-up completes checkout.

## Not built yet

- Parent accounts, a database (Postgres) and up to 4 child profiles; progress is per device for now. The plan entitlement is per browser until accounts exist.
- Stripe webhooks (needed once there is a database to update).
- IRT-calibrated item bank and MAP RIT concordance; the placement rule is the simple up/down rule from the prototype.
- Parent standards heat map and printable worksheets.
