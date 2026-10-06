# Per-child no-repeat tracking (design note, step 2)

Status: not built. Needs parent accounts, child profiles and a database first.

## Goal

A child never sees the same question twice across sessions and devices until a
template has genuinely run out, and we learn which questions children miss.

## What step 1 already gives us

- Every generated question comes from a template (`src/lib/templates.ts`) and is fully
  determined by `(template id, tier, seed)`: `render(tpl, seeded(seed), tier)` always
  makes the same question. So we only need to store a seed, never the question text.
- `questionKey(q)` identifies a question independent of how its choices were shuffled.
- Each template's wrong answers carry the mistake that produces them (`Mistake.why`).
- Within one session, Play, practice rounds, placement and test papers already avoid
  repeats (`noRepeats`, `pickFresh`).

## Data

One table, keyed by child:

```
question_seen (
  child_id     uuid      references children(id) on delete cascade,
  key_hash     bigint,   -- 64-bit hash of questionKey(q)
  template_id  text,
  tier         smallint,
  seed         integer,
  seen_at      timestamptz,
  correct      boolean,
  picked       text,     -- the choice tapped, so a miss maps to a named mistake
  ms           integer,  -- time to answer
  primary key (child_id, key_hash)
)
index on (child_id, template_id)
```

No question text and nothing about the child beyond the id, so deleting the child
profile deletes the history (COPPA-friendly).

## Drawing questions

1. Move question generation for signed-in children to the server (`/api/draw`), as the
   paid tests already are. The browser keeps today's in-session `noRepeats` for
   signed-out use.
2. For each slot, pick the template as today, then try up to 30 random seeds, skipping
   any whose `key_hash` is in the child's seen set for that template (loaded once per
   session; a few thousand hashes at most).
3. If every try is a repeat, the template is used up for this child: move to another
   template for the same standard, and only then allow the repeat seen longest ago.
   An old repeat after weeks is fine for practice (spaced review).
4. Send the seed back with each question; the answer post records `correct`, `picked`
   and `ms`.

## Capacity

The batch test already measures variety per template (distinct questions in 400
draws). A small script can turn that into a capacity estimate per template and fail CI
when a template drops below a floor, so we widen it before children run out.

## Fixed papers

Norm-referenced or percentile tests should stay fixed forms (same seed for everyone),
reviewed by a person and later calibrated on real answers. Per-child draws are for
practice, Play and the non-normed paid papers.

## Learning from misses

With `picked` stored, the miss rate per template and per named mistake becomes a
query. Templates where one distractor takes most wrong answers show a real
misconception to teach; items almost everyone misses go to review.

## Order of work

1. Parent accounts, child profiles, Postgres (separate project).
2. `question_seen` table and `/api/draw` + `/api/answer`.
3. Point Play, practice rounds and the problem-solving pages at `/api/draw` when a child
   is signed in.
4. Parent view of misses by standard and by mistake.
