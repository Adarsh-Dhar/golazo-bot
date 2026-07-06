import "dotenv/config";
import { Telegraf } from "telegraf";

const token = process.env["TELEGRAM_BOT_TOKEN"];
if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN is not set in .env");
}

const bot = new Telegraf(token);

// Start command
bot.start((ctx) => {
  ctx.reply("⚽ Welcome to GolazoChat! Ready to talk football?");
});

// Help command
bot.help((ctx) => {
  ctx.reply("GolazoChat bot is here! Send me any message and I'll respond.");
});

// Echo all messages
bot.on("text", (ctx) => {
  ctx.reply(`You said: ${ctx.message.text}`);
});

// Launch bot
bot.launch(() => {
  console.log("🚀 GolazoChat bot is running...");
});

// Graceful shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
