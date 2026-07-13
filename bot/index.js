require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const token = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEB_APP_URL;

if (!token || !webAppUrl) {
  console.error("Set BOT_TOKEN and WEB_APP_URL in bot/.env");
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Открыть курс:", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Открыть Mini App", web_app: { url: webAppUrl } }]
      ]
    }
  });
});

console.log("Bot started");

