import { Telegraf } from "telegraf";
import { config } from "./config";
import { registerCommands } from "./bot/commands";
import { makeSwingDetector } from "./bot/narrator";
import { activateTxLineFreeTier } from "./txline/auth";
import { TxLineClient } from "./txline/client";
import { openTxLineStream } from "./txline/stream";
import { recordEvent, upsertMatch } from "./state/matchStore";

async function main() {
  const bot = new Telegraf(config.telegramBotToken);
  registerCommands(bot);

  console.log("Activating TxLINE free-tier credentials...");
  const creds = await activateTxLineFreeTier();
  const client = new TxLineClient(creds);
  console.log("✅ TxLINE credentials ready.");

  const handleOddsTick = makeSwingDetector(bot);

  openTxLineStream(client, "odds", {
    onEvent: (_kind, payload: any) => {
      // TODO: adjust field names once you've confirmed the real payload
      // shape from `npm run test:txline-stream`.
      upsertMatch(payload.fixtureId, {
        oddsHome: payload.home,
        oddsDraw: payload.draw,
        oddsAway: payload.away,
      });
      handleOddsTick(payload);
    },
    onError: (kind, err) => console.error(`[${kind} stream error]`, err),
  });

  openTxLineStream(client, "scores", {
    onEvent: (_kind, payload: any) => {
      // TODO: adjust field names once confirmed.
      upsertMatch(payload.fixtureId, {
        scoreHome: payload.scoreHome,
        scoreAway: payload.scoreAway,
        phase: payload.phase,
      });
      if (payload.eventType) {
        recordEvent(payload.fixtureId, payload.eventType, payload.minute ?? 0, payload.detail ?? "");
      }
    },
    onError: (kind, err) => console.error(`[${kind} stream error]`, err),
  });

  await bot.launch();
  console.log("🚀 GolazoChat bot is running...");
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});

process.once("SIGINT", () => process.exit(0));
process.once("SIGTERM", () => process.exit(0));
