import type { Telegraf } from "telegraf";
import { getChatIdsForFixture, getRecentOddsTicks, recordOddsTick } from "../state/matchStore";

const SWING_THRESHOLD = 0.15; // 15 percentage-point implied-probability move

interface OddsPayload {
  fixtureId: string;
  home: number;
  draw: number;
  away: number;
}

/** Very rough odds -> implied probability; refine once you see real payloads. */
function impliedProb(decimalOdds: number): number {
  return 1 / decimalOdds;
}

export function makeSwingDetector(bot: Telegraf) {
  return function handleOddsTick(payload: OddsPayload) {
    const prevTicks = getRecentOddsTicks(payload.fixtureId, 1);
    recordOddsTick(payload.fixtureId, { home: payload.home, draw: payload.draw, away: payload.away });

    if (!prevTicks.length) return; // first tick, nothing to compare

    const prevProb = impliedProb(prevTicks[0].oddsHome);
    const currProb = impliedProb(payload.home);
    const delta = Math.abs(currProb - prevProb);

    if (delta >= SWING_THRESHOLD) {
      const direction = currProb > prevProb ? "up" : "down";
      const chatIds = getChatIdsForFixture(payload.fixtureId);
      const message =
        `🚨 Odds swing on ${payload.fixtureId}: home win prob ${direction} ` +
        `${Math.round(prevProb * 100)}% → ${Math.round(currProb * 100)}%`;
      for (const chatId of chatIds) {
        bot.telegram.sendMessage(chatId, message).catch((err) => console.error("sendMessage failed", err));
      }
    }
  };
}
