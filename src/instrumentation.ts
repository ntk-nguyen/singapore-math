import type { Instrumentation } from "next";

/** Server errors (pages, server actions, API routes) go to the shared error reporter. */
export const onRequestError: Instrumentation.onRequestError = async (err, request) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { reportError } = await import("./lib/report");
  const e = err instanceof Error ? err : new Error(String(err));
  const digest = typeof err === "object" && err !== null && "digest" in err ? String(err.digest) : undefined;
  await reportError({ source: "server", message: e.message, name: e.name, stack: e.stack, digest, path: request.path });
};
