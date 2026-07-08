import type { Telegraf } from "telegraf";
import { bindChatToFixture, getFixtureForChat, getMatch, getRecentEvents } from "../state/matchStore";
import { answerMatchQuestion } from "./qa";

export function registerCommands(bot: Telegraf) {
  bot.start((ctx) => {
    ctx.reply(
      "⚽ Welcome to GolazoChat!\n\n" +
        "/match <team1> vs <team2> — bind this chat to a fixture\n" +
        "/ask <question> — ask about the bound match\n" +
        "You'll also get automatic 🚨 odds-swing alerts once bound."
    );
  });

  bot.help((ctx) => {
    ctx.reply("GolazoChat: live World Cup odds/score narration + Q&A, powered by TxLINE.");
  });

  bot.command("match", async (ctx) => {
    const text = ctx.message.text.replace("/match", "").trim();
    if (!text) {
      return ctx.reply("Usage: /match Brazil vs Argentina");
    }
    // TODO: resolve `text` to a real TxLINE fixture ID via client.getFixtures()
    const fixtureId = text.toLowerCase().replace(/\s+/g, "-");
    bindChatToFixture(String(ctx.chat.id), fixtureId);
    ctx.reply(`✅ Bound this chat to "${text}". I'll post swing alerts and answer /ask questions about it.`);
  });

  bot.command("ask", async (ctx) => {
    const question = ctx.message.text.replace("/ask", "").trim();
    if (!question) {
      return ctx.reply("Usage: /ask how is the match going");
    }
    const fixtureId = getFixtureForChat(String(ctx.chat.id));
    if (!fixtureId) {
      return ctx.reply("Bind a match first with /match <team1> vs <team2>.");
    }
    const match = getMatch(fixtureId);
    const events = getRecentEvents(fixtureId);
    const answer = await answerMatchQuestion(question, match, events);
    ctx.reply(answer);
  });
}
