import TelegramBot from "node-telegram-bot-api";
import { containsBTCAddress, containsEVMAddress } from "./tool";
import { callGPT } from "./chatgpt";

export const sentAiMessage = async (
  bot: TelegramBot,
  msg: TelegramBot.Message
) => {
  const chatId = msg.chat.id;
  console.log(`sentAiMessage`);
  if (msg.photo) {
  } else if (msg.voice) {
  } else if (msg.sticker) {
  } else if (msg.text) {
    if (msg.text.startsWith("/")) {
      return;
    }
    console.log(msg.text);
    const res = await callGPT(msg.text);
    console.log(`res`, res);
    bot.sendMessage(chatId, res);
  }
};

export const sentCopyMessage = (bot: TelegramBot, msg: TelegramBot.Message) => {
  const chatId = msg.chat.id;
  if (msg.photo) {
    bot.sendPhoto(chatId, msg.photo[1].file_id);
  } else if (msg.voice) {
    bot.sendAudio(chatId, msg.voice.file_id);
  } else if (msg.sticker) {
    bot.sendSticker(chatId, msg.sticker.file_id);
  } else if (msg.text) {
    bot.sendMessage(chatId, msg.text);
  }
};

export const monitorMessage = (msg: TelegramBot.Message) => {
  console.log(msg);
};

export const groupMessage = (bot: TelegramBot, msg: TelegramBot.Message) => {
  if (msg.chat.type === "group" || msg.chat.type === "supergroup") {
    bot
      .getChat(msg.chat.id)
      .then((chat) => {
        console.log(`群组信息: ${chat.title} (ID: ${chat.id})`);
      })
      .catch((error) => {
        console.error(`获取群组信息失败: ${error.message}`);
      });
  }
};

export const pingChatMessage = (bot: TelegramBot, msg: TelegramBot.Message) => {
  const chatId = msg.chat.id;
  if (
    msg.text &&
    (containsBTCAddress(msg.text) || containsEVMAddress(msg.text))
  ) {
    bot
      .pinChatMessage(chatId, msg.message_id, { disable_notification: true })
      .then(() => {
        console.log(`消息已置顶: ${msg.text}`);
      })
      .catch((error) => {
        console.error(`置顶消息失败: ${error.message}`);
      });
  }
};
