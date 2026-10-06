/** Stripe test-mode keys only. Live keys (sk_live_/rk_live_) are refused. */
export function isTestKey(key: string): boolean {
  return key.startsWith("sk_test_") || key.startsWith("rk_test_");
}
