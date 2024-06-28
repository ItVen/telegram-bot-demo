import TelegramBot, { InlineQueryResult } from "node-telegram-bot-api";
import "dotenv/config";

// 确保环境变量被正确加载
const token = process.env.TOKEN || "";
if (!token) {
  console.error(
    "Bot token not provided. Please set the TOKEN environment variable."
  );
  process.exit(1);
}

// 创建一个bot实例
const bot = new TelegramBot(token, { polling: true });

// 监听 /start 消息
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "This is aven's Telegram bot!");
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `
    Available commands:
    /start - Start the bot
    /help - Get help
    /echo - Echo back your message
    /pic - Send a picture
    `;
  bot.sendMessage(chatId, helpMessage);
});

bot.onText(/\/echo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match ? match[1] : "";
  bot.sendMessage(chatId, resp);
});

// 监听 /buttons 消息
bot.onText(/\/buttons/, (msg) => {
  const chatId = msg.chat.id;
  const options = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Button 1", callback_data: "1" }],
        [{ text: "Button 2", callback_data: "2" }],
      ],
    },
  };
  bot.sendMessage(chatId, "Choose an option:", options);
});

bot.on("callback_query", (callbackQuery) => {
  const message = callbackQuery.message;
  const data = callbackQuery.data;

  if (message) {
    bot.sendMessage(message.chat.id, `You clicked button ${data}`);
  }
});

bot.onText(/\/location/, (msg) => {
  const chatId = msg.chat.id;
  const latitude = 40.73061;
  const longitude = -73.935242;
  bot.sendLocation(chatId, latitude, longitude);
});

bot.on("photo", (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Nice photo!");
});

// 处理内联查询
bot.on("inline_query", async (inlineQuery) => {
  console.log("Received inline query:", inlineQuery);
  const queryText: string = inlineQuery.query;

  if (queryText.length > 0) {
    const results: InlineQueryResult[] = [
      {
        type: "article",
        id: "1",
        title: "Hello",
        description: "My first inline bot",
        input_message_content: {
          message_text: "Hello, world!",
        },
      },
    ];

    let data = await bot.answerInlineQuery(inlineQuery.id, results);
    console.log("answerInlineQuery:", data);
  }
});

bot.on("polling_error", (error) => {
  console.error("Polling error:", error);
});

console.log("Bot is running...");
