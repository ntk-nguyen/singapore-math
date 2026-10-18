import type { Metadata } from "next";
import Link from "next/link";
import { contactEmail, LEGAL_UPDATED } from "@/lib/legal";

export const metadata: Metadata = { title: "Terms of use" };

export default function TermsPage() {
  const email = contactEmail();
  return (
    <div className="stack legal">
      <header className="intro">
        <p className="eyebrow">Terms of use</p>
        <h1>Terms of use</h1>
        <p className="muted">Last updated {LEGAL_UPDATED}. By using MathBridge you agree to these terms. Please read them with our <Link href="/privacy">privacy policy</Link>.</p>
      </header>

      <section className="panel">
        <h2>Who can use MathBridge</h2>
        <p>MathBridge is for children learning math with a parent, guardian or teacher. Accounts and purchases are for adults only: a grown-up signs in, sets up children’s profiles, and is responsible for how the app is used in their family or class.</p>
      </section>

      <section className="panel">
        <h2>Free and Pro plans</h2>
        <ul>
          <li>Lessons, games and the free practice tests are free to use.</li>
          <li>The Pro plan is a monthly subscription priced per child, as shown on the <Link href="/pro">Pro plan</Link> page and at checkout. Payments are handled by Stripe.</li>
          <li>Any free trial is shown at checkout. If you cancel before the trial ends, you aren’t charged. After that, the plan renews each month until you cancel.</li>
          <li>Cancel any time with “Manage or cancel subscription” on the <Link href="/parents">Parents</Link> page. Pro stays on until the end of the period you’ve paid for. We don’t give partial refunds for unused time unless the law requires it.</li>
          <li>We may change prices with notice before your next renewal.</li>
        </ul>
      </section>

      <section className="panel">
        <h2>About our practice tests</h2>
        <p>Placement results, grade estimates and state-test-style papers are practice tools. They are not official assessments and don’t predict scores on MCAS, MAP Growth, SBAC, PARCC or any other test. MathBridge is not affiliated with or endorsed by the Massachusetts Department of Elementary and Secondary Education, NWEA, the Singapore Ministry of Education or any test publisher.</p>
      </section>

      <section className="panel">
        <h2>Using the app fairly</h2>
        <p>Please don’t copy or resell our lessons and questions, try to get around the Pro plan, disrupt the service, or access other people’s accounts. Printable papers are for use in your own family or classroom. We may suspend accounts that break these rules.</p>
      </section>

      <section className="panel">
        <h2>The service</h2>
        <p>We work to keep MathBridge accurate and available, but it is provided “as is”, and we can’t promise it will always be error-free or uninterrupted. We may add, change or remove features. To the extent the law allows, we aren’t liable for indirect losses, and our total liability is limited to what you paid us in the last 12 months.</p>
      </section>

      <section className="panel">
        <h2>Changes and contact</h2>
        <p>If we change these terms, we’ll update this page and the date above. Continuing to use MathBridge after a change means you accept it.{email ? <> Questions: <a href={`mailto:${email}`}>{email}</a>.</> : null}</p>
      </section>
    </div>
  );
}
