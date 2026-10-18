"use client";

import Link from "next/link";
import { useEffect } from "react";
import { reportClientError } from "@/lib/report-client";

/** Shown when a page crashes. Progress is saved as children go, so trying again loses nothing. */
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => reportClientError(error), [error]);
  return (
    <section className="panel oops">
      <p className="eyebrow">Something went wrong</p>
      <h1>Oops, that page tripped over a number.</h1>
      <p className="muted">Your stars and progress are safe. Try again, or head back home.</p>
      <div className="oops-actions">
        <button className="btn" type="button" onClick={() => retry()}>Try again</button>
        <Link className="btn ghost" href="/">Back to home</Link>
      </div>
      {error.digest && <p className="muted small">Error code: <span className="mono">{error.digest}</span></p>}
    </section>
  );
}
