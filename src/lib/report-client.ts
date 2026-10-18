/** Send a browser error to /api/errors. Best effort: failures are ignored. */
export function reportClientError(error: Error & { digest?: string }) {
  try {
    const body = JSON.stringify({ message: error.message, name: error.name, stack: error.stack, digest: error.digest, path: location.pathname });
    fetch("/api/errors", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch {
    // Reporting must never break the error page itself.
  }
}
