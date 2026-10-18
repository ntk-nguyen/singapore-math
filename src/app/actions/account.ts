"use server";

import { signIn, signInEnabled, signOut } from "@/auth";

/** Parents sign in with Google and come back to the Parents page. */
export async function signInWithGoogle() {
  if (!signInEnabled()) return;
  await signIn("google", { redirectTo: "/parents" });
}

/**
 * Signing out keeps this device's children and progress; it only stops syncing. The page
 * reloads itself afterwards, so every part of the app sees the signed-out state.
 */
export async function signOutParent() {
  if (!signInEnabled()) return;
  await signOut({ redirect: false });
}
