import { Billing } from "./Billing";

const ROWS: [number, string, string, string][] = [
  [1, "1.OA.A.1, 1.OA.C.6", "Number bonds; part-whole bar models", "Primary 1"],
  [2, "2.OA.A.1, 2.NBT.B.5", "Comparison bar models, two-step problems", "Primary 2"],
  [3, "3.OA.A.3, 3.NF.A.3, 3.MD.D.8", "Equal groups as units, fractions, perimeter", "Primary 3"],
  [4, "4.NBT.B.5, 4.NF.B.3, 4.OA.A.3", "Multi-digit ×, like-fraction +, multi-step money", "Primary 4"],
  [5, "5.NF.B.6, 5.NBT.B.7, 5.MD.C.5", "Fraction of a set (unit method), decimals, volume", "Primary 5"],
  [6, "6.RP.A.3, 6.EE.A.2", "Ratio bar models, percent, expressions", "Primary 6 / PSLE"],
  [7, "7.RP.A.3, 7.EE.B.4, 7.G.B.4", "Percent change, two-step equations, circles", "Secondary 1"],
  [8, "8.EE.C.7, 8.G.B.7, 8.F.B.4", "Linear equations, Pythagoras, slope", "Secondary 2"],
];

export default function GrownUpsPage() {
  return (
    <div className="stack">
      <section className="panel">
        <p className="eyebrow">Standards map</p>
        <h2>How levels line up with US grades</h2>
        <p className="muted">
          Every question carries a Common Core code, so results translate directly into US grade-level language. Singapore levels run about half a year to a year ahead in number sense and word problems.
        </p>
        <div className="tablewrap">
          <table>
            <thead>
              <tr><th>US grade</th><th>Common Core standards used</th><th>Singapore technique</th><th>Rough SG level</th></tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r[0]}>
                  <td>{r[0]}</td>
                  <td className="mono">{r[1]}</td>
                  <td>{r[2]}</td>
                  <td>{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel">
        <p className="eyebrow">Baselining</p>
        <h2>Comparing with US standardized tests</h2>
        <ul className="ticks">
          <li><b>Placement check</b> estimates a grade level by adapting up and down across Grades 1–8, like a short computer-adaptive test.</li>
          <li><b>MAP Growth (NWEA):</b> if your child has a recent RIT score, compare our placement grade with NWEA’s grade-level norms. A big gap tells you which result to trust less.</li>
          <li><b>State tests (SBAC, PARCC/NJSLA, STAAR and others):</b> they test the same Common Core-style standards. The Grade checkpoint’s per-standard table shows which reporting areas need work.</li>
          <li><b>Not normed yet:</b> these scores are estimates. Items will be calibrated on real students (Item Response Theory) before the app reports percentiles.</li>
        </ul>
      </section>
      <section className="panel">
        <p className="eyebrow">Privacy</p>
        <h2>Built for kids under 13</h2>
        <ul className="ticks">
          <li>No ads, no third-party trackers, and no sign-up for children.</li>
          <li>Stars, scores and placement are stored in this browser only. Clearing site data resets them.</li>
          <li>Only a grown-up can buy the Pro plan, through Stripe Checkout. We never see card details.</li>
        </ul>
      </section>
      <Billing />
    </div>
  );
}
