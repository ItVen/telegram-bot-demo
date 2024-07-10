import TelegramBot, { InlineQueryResult } from "node-telegram-bot-api";
import "dotenv/config";
import { containsBTCAddress, containsEVMAddress } from "./tool";
import {
  monitorMessage,
  pingChatMessage,
  sentAiMessage,
  sentCopyMessage,
} from "./bot-message";

// 模拟存储 Web 应用的数据
interface WebApp {
  id: number;
  name: string;
  url: string;
}
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
let webApps: WebApp[] = [];
let nextId = 1;

export const runBot = () => {
  // 监听 /start 消息
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "欢迎使用 Telegram Bot！");
  });

  bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    const helpMessage = `
    可用命令:
    /start - 开始与 Bot 的对话
    /help - 获取可用命令列表和帮助信息
    /about - 查看 Bot 的简介和详细信息
    /settings - 配置和查看 Bot 的设置
    /profile - 查看或编辑用户个人资料
    /stats - 获取 Bot 的使用统计信息
    /feedback - 提交反馈或建议
    /contact - 获取联系信息或支持
    /news - 获取最新的新闻更新
    /subscribe - 订阅每日更新
    /unsubscribe - 取消订阅
    /myapps - 编辑你的 Web 应用
    /newapp - 创建一个新的 Web 应用
    /listapps - 获取你的 Web 应用列表
    /editapp - 编辑一个 Web 应用
    /deleteapp - 删除一个 Web 应用
  `;
    bot.sendMessage(chatId, helpMessage);
  });

  bot.on("new_chat_members", (msg) => {
    const chatId = msg.chat.id;
    const newMembers = msg.new_chat_members;

    newMembers?.forEach((member) => {
      const welcomeMessage = `欢迎 ${member.first_name} 加入群组！`;
      bot.sendMessage(chatId, welcomeMessage);
    });
  });

  // 监听用户消息并回复
  bot.on("message", async (msg: TelegramBot.Message) => {
    // monitorMessage(msg);
    // sentCopyMessage(bot, msg);
    // pingChatMessage(bot, msg);
    await sentAiMessage(bot, msg);
  });

  bot.on("kickme", (callbackQuery) => {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = (msg.from as TelegramBot.User).id;
    bot
      .banChatMember(chatId, userId)
      .then(() => {
        bot.sendMessage(
          chatId,
          `用户 ${(msg.from as TelegramBot.User).first_name} 已被封禁。`
        );
      })
      .catch((error) => {
        bot.sendMessage(chatId, `无法封禁用户：${error.message}`);
      });
  });

  bot.on("unbanme", (callbackQuery) => {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = (msg.from as TelegramBot.User).id;
    bot
      .unbanChatMember(chatId, userId)
      .then(() => {
        bot.sendMessage(
          chatId,
          `用户 ${(msg.from as TelegramBot.User).first_name} 的封禁已被取消。`
        );
      })
      .catch((error) => {
        bot.sendMessage(chatId, `无法取消用户的封禁：${error.message}`);
      });
  });

  // 监听回调查询
  bot.on("callback_query", (callbackQuery) => {
    const message = callbackQuery.message;
    const data = callbackQuery.data;

    if (message) {
      bot.sendMessage(message.chat.id, `You clicked button ${data}`);
    }
  });

  // 发送自定义键盘
  bot.onText(/\/keyboard/, (msg) => {
    const chatId = msg.chat.id;
    const options = {
      reply_markup: {
        keyboard: [[{ text: "按钮1" }, { text: "按钮2" }], [{ text: "按钮3" }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    };
    bot.sendMessage(chatId, "请选择一个选项:", options);
  });

  // 设置内联键盘
  bot.onText(/\/inline/, (msg) => {
    const chatId = msg.chat.id;
    const options = {
      reply_markup: {
        inline_keyboard: [
          [{ text: "内联按钮1", callback_data: "1" }],
          [{ text: "内联按钮2", callback_data: "2" }],
        ],
      },
    };
    bot.sendMessage(chatId, "选择一个内联选项:", options);
  });

  // 监听 /news 命令，模拟发送新闻更新
  bot.onText(/\/news/, (msg) => {
    const chatId = msg.chat.id;
    const news = `
    今日新闻：
    1. 新闻标题1
    2. 新闻标题2
    3. 新闻标题3
  `;
    bot.sendMessage(chatId, news);
  });

  // 创建新的 Web 应用
  bot.onText(/\/newapp (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const [name, url] = match ? match[1].split(" ") : [];

    if (!name || !url) {
      bot.sendMessage(chatId, "使用方法: /newapp <name> <url>");
      return;
    }

    const newApp: WebApp = { id: nextId++, name, url };
    webApps.push(newApp);
    bot.sendMessage(chatId, `已创建 Web 应用: ${name} (${url})`);
  });

  // 列出所有 Web 应用
  bot.onText(/\/listapps/, (msg) => {
    const chatId = msg.chat.id;

    if (webApps.length === 0) {
      bot.sendMessage(chatId, "你还没有任何 Web 应用。");
      return;
    }

    const appList = webApps
      .map((app) => `${app.id}. ${app.name} (${app.url})`)
      .join("\n");
    bot.sendMessage(chatId, `你的 Web 应用列表:\n${appList}`);
  });

  // 编辑 Web 应用
  bot.onText(/\/editapp (\d+) (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const appId = parseInt(match ? match[1] : "", 10);
    const [newName, newUrl] = match ? match[2].split(" ") : [];

    const appIndex = webApps.findIndex((app) => app.id === appId);

    if (appIndex === -1) {
      bot.sendMessage(chatId, "找不到该 Web 应用。");
      return;
    }

    if (!newName || !newUrl) {
      bot.sendMessage(chatId, "使用方法: /editapp <id> <new_name> <new_url>");
      return;
    }

    webApps[appIndex] = { id: appId, name: newName, url: newUrl };
    bot.sendMessage(chatId, `已更新 Web 应用: ${newName} (${newUrl})`);
  });

  // 删除 Web 应用
  bot.onText(/\/deleteapp (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const appId = parseInt(match ? match[1] : "", 10);

    const appIndex = webApps.findIndex((app) => app.id === appId);

    if (appIndex === -1) {
      bot.sendMessage(chatId, "找不到该 Web 应用。");
      return;
    }

    webApps.splice(appIndex, 1);
    bot.sendMessage(chatId, `已删除 Web 应用 ID: ${appId}`);
  });

  // 处理内联查询
  bot.on("inline_query", async (inlineQuery) => {
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

      await bot.answerInlineQuery(inlineQuery.id, results);
    }
  });

  bot.on("polling_error", (error) => {
    console.error("Polling error:", error);
  });

  // 监听群组中的新成员加入事件
  bot.on("new_chat_members", (msg) => {
    const chatId = msg.chat.id;
    const newMembers = msg.new_chat_members;
    if (newMembers) {
      newMembers.forEach((member) => {
        const welcomeMessage = `欢迎 ${member.first_name} 加入群组！`;
        bot.sendMessage(chatId, welcomeMessage);
      });
    }
  });

  // 监听群组中的命令
  bot.onText(/\/promote (\d+)/, (msg, match) => {
    if (match) {
      const chatId = msg.chat.id;
      const userId = parseInt(match[1]);

      bot
        .promoteChatMember(chatId, userId, {
          can_change_info: true,
          can_delete_messages: true,
          can_invite_users: true,
          can_restrict_members: true,
          can_pin_messages: true,
          can_promote_members: true,
        })
        .then(() => {
          bot.sendMessage(chatId, `用户 ${userId} 已被提升为管理员。`);
        })
        .catch((error) => {
          bot.sendMessage(chatId, `无法提升用户为管理员：${error.message}`);
        });
    }
  });

  console.log("Bot is running...");
};
