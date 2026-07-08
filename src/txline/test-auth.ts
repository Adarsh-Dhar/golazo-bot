/**
 * Run with: npm run test:txline-auth
 * Verifies the guest JWT + activation flow works end to end before you
 * wire anything into the bot. Prints the credentials on success.
 */
import { activateTxLineFreeTier } from "./auth";

async function main() {
  console.log("Requesting guest JWT + activating free-tier API token...");
  const creds = await activateTxLineFreeTier();
  console.log("✅ Got credentials:");
  console.log("  jwt (first 20 chars):", creds.jwt.slice(0, 20) + "...");
  console.log("  apiToken (first 20 chars):", creds.apiToken.slice(0, 20) + "...");
  console.log("  apiOrigin:", creds.apiOrigin);
}

main().catch((err) => {
  console.error("❌ Activation failed:", err.response?.data ?? err.message ?? err);
  process.exit(1);
});
