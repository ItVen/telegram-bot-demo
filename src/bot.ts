import TelegramBot from "node-telegram-bot-api";
import "dotenv/config";

// 替换成你的 Bot Token
const token = process.env.TOKEN || "";

// 创建一个bot实例
const bot = new TelegramBot(token, { polling: true });

// 监听 /start 消息
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "This is aven's Telegram bot!");
});

// 监听任意消息
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `You said: ${msg.text}`);
});

console.log("Bot is running...");
