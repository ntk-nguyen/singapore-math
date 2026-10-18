import type { Metadata } from "next";
import Link from "next/link";
import { contactEmail, LEGAL_UPDATED } from "@/lib/legal";

export const metadata: Metadata = { title: "Privacy policy" };

function Contact() {
  const email = contactEmail();
  return email ? <a href={`mailto:${email}`}>{email}</a> : <b>the contact address on this page (coming soon)</b>;
}

export default function PrivacyPage() {
  return (
    <div className="stack legal">
      <header className="intro">
        <p className="eyebrow">Privacy policy</p>
        <h1>How MathBridge handles your family’s information</h1>
        <p className="muted">Last updated {LEGAL_UPDATED}. MathBridge is made for children from Kindergarten to Grade 8, so we collect as little as we can and never show ads or use trackers.</p>
      </header>

      <section className="panel">
        <h2>The short version</h2>
        <ul className="ticks">
          <li>Children never create accounts, sign in, or type in personal details. A parent sets up each child with a first name or nickname and a built-in avatar.</li>
          <li>Without signing in, progress stays in your browser on this device. We don’t receive it.</li>
          <li>If a parent signs in with Google, we keep the parent’s name, email and profile picture from Google, plus a copy of the children’s profiles and progress, so they follow you to other devices.</li>
          <li>No ads, no analytics or tracking scripts, no selling or sharing of data for marketing. Fonts are served by us, not by Google.</li>
          <li>You can delete your account and everything synced to it at any time from the <Link href="/parents">Parents</Link> page.</li>
        </ul>
      </section>

      <section className="panel">
        <h2>What we collect</h2>
        <h3>About your children</h3>
        <ul>
          <li><b>Profile:</b> the first name or nickname a parent types in, a built-in avatar, and the grade they practice at. We don’t ask for surnames, birthdays, photos, schools or locations.</li>
          <li><b>Progress:</b> stars, streaks, practice scores, test results, placement and which lessons were finished, by day.</li>
        </ul>
        <p>This is kept in your browser’s local storage. It is copied to our database only when a parent signs in, so it can sync between devices.</p>
        <h3>About the parent</h3>
        <ul>
          <li><b>Google sign-in:</b> your name, email address and profile picture URL, as Google shares them. We don’t keep Google access tokens and can’t read your Gmail, Drive or anything else.</li>
          <li><b>Pro plan:</b> payments go through Stripe Checkout. Stripe collects your card and billing details; we only keep the Stripe customer ID that links your plan to your account.</li>
        </ul>
        <h3>Cookies and browser storage</h3>
        <ul>
          <li>A sign-in cookie, only when a parent signs in.</li>
          <li><code>bma_plan</code>, a signed cookie that remembers a Pro plan bought in this browser.</li>
          <li>Local storage for children’s profiles and progress, light or dark theme, and similar settings.</li>
        </ul>
        <p>None of these are used for advertising or tracking across sites.</p>
      </section>

      <section className="panel">
        <h2>How we use it</h2>
        <p>Only to run MathBridge: showing each child their lessons, progress and results, syncing a family across devices, checking whether a Pro plan is active, and fixing errors. Error reports include the page and the error message, never children’s profiles or progress.</p>
        <p>We don’t use children’s information for advertising, profiling or anything unrelated to learning in the app, and we don’t sell it.</p>
      </section>

      <section className="panel">
        <h2>Who else handles it</h2>
        <p>We share information only with the services that run MathBridge for us, and only what each one needs:</p>
        <ul>
          <li><b>Vercel</b> hosts the app.</li>
          <li><b>Neon</b> stores the database of parent accounts and synced family data.</li>
          <li><b>Google</b> provides parent sign-in.</li>
          <li><b>Stripe</b> handles subscriptions and payments.</li>
          <li>An error-reporting service may receive error messages and the page they happened on.</li>
        </ul>
        <p>We may also disclose information if the law requires it.</p>
      </section>

      <section className="panel">
        <h2>Parents’ choices and rights</h2>
        <p>A parent can at any time:</p>
        <ul>
          <li><b>Review or change</b> a child’s profile on the <Link href="/parents">Parents</Link> page.</li>
          <li><b>Delete</b> a child, which removes them from every signed-in device.</li>
          <li><b>Delete the account</b> on the Parents page, which deletes the parent account and every synced profile and score. Profiles kept only in a browser can be removed by deleting each child there or clearing the browser’s site data.</li>
          <li><b>Stop further collection</b> by not signing in, or by deleting the account.</li>
          <li><b>Ask us</b> what we hold or to delete it by writing to <Contact />.</li>
        </ul>
        <p>Deleting the account doesn’t cancel a Pro subscription. Cancel it first with “Manage or cancel subscription” on the Parents page.</p>
      </section>

      <section className="panel">
        <h2>Children’s privacy (COPPA)</h2>
        <p>MathBridge is directed to children under 13. The parent is the account holder: children can’t sign in, buy anything, chat, or share information with other users. We collect a child’s nickname and progress only as a parent sets them up, and we use them only to provide the app. If you think a child has given us personal information without a parent’s involvement, contact us at <Contact /> and we will delete it.</p>
      </section>

      <section className="panel">
        <h2>Keeping and protecting data</h2>
        <p>Synced data is kept until you delete it or your account. Sign-in sessions expire on their own. Stripe keeps billing records as the law requires. Everything travels over HTTPS, and access to the database is limited to the app.</p>
      </section>

      <section className="panel">
        <h2>Changes and contact</h2>
        <p>If we change this policy in a way that affects how children’s information is used, we’ll update this page and the date above, and ask for a parent’s consent where the law requires it. Questions: <Contact />.</p>
        <p className="muted small">See also our <Link href="/terms">terms of use</Link>.</p>
      </section>
    </div>
  );
}
