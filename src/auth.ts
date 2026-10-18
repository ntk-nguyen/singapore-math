import "server-only";
import PostgresAdapter from "@auth/pg-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db, dbConfigured, ensureSchema } from "@/lib/db";

/**
 * Parent sign-in with Google (Auth.js), with sessions stored in Postgres. It is switched on
 * only when the Google client, AUTH_SECRET and DATABASE_URL are all set; otherwise the app
 * runs signed-out and the sign-in button is hidden.
 */
export function signInEnabled(): boolean {
  return !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET && process.env.AUTH_SECRET && dbConfigured());
}

export const { handlers, auth, signIn, signOut } = NextAuth(async () => {
  if (!signInEnabled()) return { providers: [] };
  await ensureSchema();
  const adapter = PostgresAdapter(db());
  return {
    adapter: {
      ...adapter,
      // We only need to know who the parent is, never to call Google for them, so keep no Google tokens.
      linkAccount: (account) =>
        adapter.linkAccount!({ ...account, access_token: undefined, refresh_token: undefined, id_token: undefined }),
    },
    providers: [Google],
    session: { strategy: "database" },
    pages: { error: "/parents" },
    callbacks: {
      session({ session, user }) {
        session.user.id = user.id;
        return session;
      },
    },
  };
});
