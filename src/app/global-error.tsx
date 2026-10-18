"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/report-client";

/**
 * Last-resort page when the root layout itself fails. It replaces the whole document, so it
 * carries its own minimal styles instead of globals.css, and follows the OS light or dark setting.
 */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => reportClientError(error), [error]);
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "system-ui, sans-serif", background: "Canvas", color: "CanvasText", colorScheme: "light dark" }}>
        <title>Something went wrong · MathBridge</title>
        <main style={{ maxWidth: 480, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: "1.75rem", margin: "0 0 12px" }}>Something went wrong</h1>
          <p style={{ margin: "0 0 20px", opacity: 0.8 }}>MathBridge hit a problem loading. Your progress is saved on this device.</p>
          <button type="button" onClick={() => retry()} style={{ font: "inherit", fontWeight: 700, padding: "12px 24px", borderRadius: 999, border: "none", background: "#312e81", color: "#fff", cursor: "pointer" }}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
