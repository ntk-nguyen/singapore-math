"use client";

import { useEffect, useState } from "react";
import { usePlan } from "@/components/usePlan";
import { signInWithGoogle, signOutParent } from "../actions/account";

/** Sign in with Google so children, progress and Pro follow the parent to every device. Hidden until sign-in is set up. */
export function Account() {
  const [plan] = usePlan();
  const [failed, setFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Auth.js sends parents back here with ?error=… when Google sign-in doesn't complete.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFailed(new URLSearchParams(window.location.search).has("error"));
  }, []);

  if (!plan?.signIn) return null;
  const parent = plan.parent;

  const leave = async () => {
    await signOutParent();
    // A full reload, so every part of the app (plan, sync, header) sees the signed-out state.
    window.location.reload();
  };

  const remove = async () => {
    if (!window.confirm("Delete your MathBridge account? Your children's synced profiles and progress are deleted from the account. This device keeps its copy, and your Stripe subscription is not cancelled.")) return;
    setError(null);
    const res = await fetch("/api/family", { method: "DELETE" });
    if (res.ok) await leave();
    else setError("Could not delete your account. Please try again.");
  };

  return (
    <section className="panel" id="account">
      <p className="eyebrow">Parent account</p>
      {parent ? (
        <>
          <h2>Signed in{parent.name ? ` as ${parent.name}` : ""}</h2>
          <p className="muted">
            {parent.email && <>Google account <b>{parent.email}</b>. </>}
            Your children’s profiles, progress and Pro plan are saved to your account, so they appear on any device where you sign in.
          </p>
          <div className="row">
            <button className="btn ghost" onClick={leave}>Sign out</button>
            <button className="linkbtn bad" onClick={remove}>Delete account</button>
          </div>
        </>
      ) : (
        <>
          <h2>Use MathBridge on every device</h2>
          <p className="muted">
            Sign in with Google to keep your children’s profiles, progress and Pro plan in your account. Children never sign in themselves.
          </p>
          <form action={signInWithGoogle}>
            <button className="btn self-start google-btn" type="submit">
              <GoogleG />
              Sign in with Google
            </button>
          </form>
          <p className="muted small">
            By signing in you agree that we store your name and email, plus each child’s first name or nickname, avatar and progress. You can delete it all here at any time.
          </p>
        </>
      )}
      {failed && !parent && <p className="notice bad">Sign-in didn’t finish. Please try again.</p>}
      {error && <p className="notice bad">{error}</p>}
    </section>
  );
}

function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
