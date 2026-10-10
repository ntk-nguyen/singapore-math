"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { CrownIcon } from "@/components/Icons";
import { Paywall } from "@/components/Paywall";
import { useProgress } from "@/components/Progress";
import { usePlan } from "@/components/usePlan";
import { PAPER_KINDS, paperAvailable } from "@/lib/papers";
import { GRADES, type Grade } from "@/lib/questions";
import { TESTS } from "@/lib/tests";

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M6 10V7a6 6 0 1112 0v3h1a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1V11a1 1 0 011-1h1zm2 0h8V7a4 4 0 10-8 0v3z" />
    </svg>
  );
}

function CheckoutNotice() {
  const params = useSearchParams();
  if (params.get("unlocked")) return <p className="notice">Pro plan unlocked. Enjoy the extra tests!</p>;
  if (params.get("checkout")) return <p className="notice bad">Checkout did not finish, so nothing was charged.</p>;
  return null;
}

export default function TestsPage() {
  const { best, placement } = useProgress();
  const [plan] = usePlan();
  const [paywall, setPaywall] = useState(false);
  const pro = !!plan?.pro;

  return (
    <div className="stack">
      <div className="intro">
        <p className="eyebrow">Two free · six more with the Pro plan</p>
        <h2>Practice tests</h2>
        {placement && (
          <p className="muted">
            Last placement: <b>Grade {placement}</b>.
          </p>
        )}
      </div>
      <Suspense>
        <CheckoutNotice />
      </Suspense>
      <div className="tests">
        {TESTS.map((t) => {
          const open = t.free || pro;
          return (
            <div key={t.id} className={`test${open ? "" : " locked"}`}>
              {t.free ? <span className="tag free">Free</span> : <span className="tag paid"><span className="lock"><CrownIcon />Pro</span></span>}
              <h3>{t.name}</h3>
              <p>{t.desc}</p>
              {best[t.id] != null && <span className="muted small">Best: {best[t.id]}%</span>}
              {open ? (
                <Link className="btn self-start" href={`/tests/${t.id}`}>Start</Link>
              ) : (
                <button className="btn gold self-start" onClick={() => setPaywall(true)} disabled={!plan}>
                  <span className="lock"><LockIcon />Upgrade to Pro</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
      <PrintPanel pro={pro} planLoaded={!!plan} onLocked={() => setPaywall(true)} />
      {paywall && (
        <Paywall onClose={() => setPaywall(false)} onUnlocked={() => setPaywall(false)} />
      )}
    </div>
  );
}

/**
 * Make a printable paper: pick a grade and a test or topic, and get a new paper with
 * its answer key every time. Free users can print the free grade checkpoint; the Pro
 * plan prints every test and topic, as many times as they like.
 */
function PrintPanel({ pro, planLoaded, onLocked }: { pro: boolean; planLoaded: boolean; onLocked: () => void }) {
  const { grade: myGrade } = useProgress();
  const router = useRouter();
  const [grade, setGrade] = useState<Grade | null>(null);
  const [kindId, setKindId] = useState("checkpoint");
  const g = grade ?? myGrade;
  const kinds = PAPER_KINDS.filter((k) => paperAvailable(k, g));
  const kind = kinds.find((k) => k.id === kindId) ?? kinds[0];
  const open = kind.free || pro;
  const option = (k: (typeof kinds)[number]) => (
    <option key={k.id} value={k.id}>{k.name}{k.free ? " (free)" : pro ? "" : " (Pro)"}</option>
  );
  const make = () => {
    if (!open) return onLocked();
    router.push(`/tests/print?kind=${kind.id}&grade=${g}`);
  };

  return (
    <section className="panel stack">
      <div className="intro">
        <p className="eyebrow">{pro ? "Unlimited with your Pro plan" : "Free: grade checkpoint · Pro: every test and topic"}</p>
        <h3>Print a practice paper</h3>
        <p className="muted">Every paper is new, with an answer key on its own page. Download it as a PDF or print it.</p>
      </div>
      <div className="print-panel">
        <label>
          Grade
          <select value={g} onChange={(e) => setGrade(Number(e.target.value) as Grade)}>
            {GRADES.map((x) => <option key={x} value={x}>Grade {x}</option>)}
          </select>
        </label>
        <label>
          What to practice
          <select value={kind.id} onChange={(e) => setKindId(e.target.value)}>
            <optgroup label="Practice tests">{kinds.filter((k) => k.group === "test").map(option)}</optgroup>
            <optgroup label="One topic">{kinds.filter((k) => k.group === "topic").map(option)}</optgroup>
          </select>
        </label>
        {open ? (
          <button className="btn" onClick={make}>Make a paper</button>
        ) : (
          <button className="btn gold" onClick={make} disabled={!planLoaded}>
            <span className="lock"><LockIcon />Upgrade to Pro</span>
          </button>
        )}
      </div>
    </section>
  );
}
