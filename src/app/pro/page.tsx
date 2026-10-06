import type { Metadata } from "next";
import { CheckIcon } from "@/components/Icons";
import { TESTS } from "@/lib/tests";
import { PlanCards, TrialBand } from "./Plans";

export const metadata: Metadata = { title: "Upgrade to Pro plan" };

const FREE_TESTS = TESTS.filter((t) => t.free).length;
const PRO_TESTS = TESTS.length - FREE_TESTS;

const HIGHLIGHTS = [
  ["Bar models", "Concrete, pictorial, abstract"],
  ["Placement check", "Adaptive across Grades 1–8"],
  ["Common Core", "Every question is tagged"],
  ["Worked solutions", "Step by step, every time"],
];

const ROWS: [string, string, string][] = [
  ["Bar model lessons, Grades 1–8", "yes", "yes"],
  ["Number skills, fractions and decimals", "yes", "yes"],
  ["Play and times tables", "yes", "yes"],
  ["Word problems and solve for x", "Easy level", "Easy, intermediate, advanced"],
  ["Practice tests", `${FREE_TESTS} tests`, `All ${TESTS.length} tests`],
  ["Worked solutions", "yes", "yes"],
];

const FAQ = [
  ["Can I cancel any time?", "Yes. Cancel from For grown-ups before the 7-day trial ends and nothing is charged. After that the plan runs month to month."],
  ["Who should check out?", "A grown-up. Children never see a card form, and payment happens on Stripe’s own page. We never see card details."],
  ["Is this charging real money?", "Not yet. Payments run in Stripe test mode while MathBridge is in preview, so no real card is charged."],
  ["What grades does MathBridge cover?", "Grades 1 to 8, with every question mapped to a Common Core standard so results line up with US grade levels."],
];

function Cell({ v }: { v: string }) {
  if (v === "yes") return <span className="cmp-yes" aria-label="Included"><CheckIcon /></span>;
  return <>{v}</>;
}

export default function ProPage() {
  return (
    <div className="stack pro-page">
      <section className="pro-hero">
        <p className="pill-note">Singapore method · Common Core aligned · Grades 1–8</p>
        <h1>
          Unlock the full power of <span>Singapore Math</span>
        </h1>
        <p className="lead">
          Free gets every lesson and skill. Pro adds the harder problem solving and {PRO_TESTS} more full practice tests, so your child can see
          exactly where they stand.
        </p>
        <ul className="highlights">
          {HIGHLIGHTS.map(([b, s]) => (
            <li key={b}>
              <b>{b}</b>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </section>

      <PlanCards freeTests={FREE_TESTS} />

      <section className="panel" aria-labelledby="cmp">
        <h2 id="cmp" className="center">Compare plans</h2>
        <div className="tablewrap">
          <table className="cmp">
            <thead>
              <tr><th>What you get</th><th>Free</th><th className="cmp-pro">Pro plan</th></tr>
            </thead>
            <tbody>
              {ROWS.map(([what, free, pro]) => (
                <tr key={what}>
                  <td>{what}</td>
                  <td><Cell v={free} /></td>
                  <td className="cmp-pro"><Cell v={pro} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="stack faq" aria-labelledby="faq" style={{ gap: 12 }}>
        <h2 id="faq" className="center">Questions grown-ups ask</h2>
        {FAQ.map(([q, a]) => (
          <details key={q} className="faq-item">
            <summary>{q}</summary>
            <p className="muted">{a}</p>
          </details>
        ))}
      </section>

      <TrialBand />
    </div>
  );
}
