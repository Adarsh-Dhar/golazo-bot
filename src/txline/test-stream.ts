/**
 * Run with: npm run test:txline-stream
 * Opens the odds + scores streams and logs raw events for 60s so you can
 * confirm payload shapes before writing parsing logic against them.
 */
import { activateTxLineFreeTier } from "./auth";
import { TxLineClient } from "./client";
import { openTxLineStream } from "./stream";

async function main() {
  const creds = await activateTxLineFreeTier();
  const client = new TxLineClient(creds);

  console.log("Opening odds + scores streams for 60s...");

  const oddsStream = openTxLineStream(client, "odds", {
    onEvent: (kind, payload) => console.log(`[${kind}]`, JSON.stringify(payload)),
    onError: (kind, err) => console.error(`[${kind} error]`, err),
  });

  const scoreStream = openTxLineStream(client, "scores", {
    onEvent: (kind, payload) => console.log(`[${kind}]`, JSON.stringify(payload)),
    onError: (kind, err) => console.error(`[${kind} error]`, err),
  });

  setTimeout(() => {
    oddsStream.close();
    scoreStream.close();
    console.log("Closed streams after 60s smoke test.");
    process.exit(0);
  }, 60_000);
}

main().catch((err) => {
  console.error("❌ Stream test failed:", err.response?.data ?? err.message ?? err);
  process.exit(1);
});
