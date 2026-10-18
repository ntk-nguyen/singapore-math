import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <section className="panel oops">
      <p className="eyebrow">404</p>
      <h1>We couldn’t find that page.</h1>
      <p className="muted">The link may be old, or the page may have moved. Let’s get you back to some math.</p>
      <div className="oops-actions">
        <Link className="btn" href="/">Back to home</Link>
        <Link className="btn ghost" href="/tests">Practice tests</Link>
      </div>
    </section>
  );
}
