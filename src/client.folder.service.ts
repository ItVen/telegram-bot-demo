import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { Api } from "telegram";
import "dotenv/config";
import fs from 'fs';
import path from 'path';
import bigInt from "big-integer";

const apiId = parseInt(process.env.API_ID || '0', 10);
const apiHash = process.env.API_HASH as string;

if (isNaN(apiId) || apiId === 0) {
  throw new Error('Invalid API ID. Please check your .env file');
}
if (!apiHash) {
  throw new Error('API Hash is required. Please check your .env file');
}

const sessionFilePath = path.resolve(__dirname, 'session.json');

let sessionData = "";
if (fs.existsSync(sessionFilePath)) {
  sessionData = fs.readFileSync(sessionFilePath, 'utf8');
}

const stringSession = new StringSession(sessionData);
const client = new TelegramClient(stringSession, Number(apiId), apiHash, {
  connectionRetries: 5,
  useWSS: false, // 使用 WebSocket
  proxy: {
    ip: '127.0.0.1',  // 代理服务器的 IP 地址
    port: 7890,   // 代理服务器的端口
    socksType: 5,// 使用 SOCKS5 代理
  }
});

async function run() {
  console.log("Loading...");
  await client.start({
    phoneNumber: async () => await ask("请输入您的电话号码: "),
    password: async () => await ask("请输入您的密码: "),
    phoneCode: async () => await ask("请输入您收到的验证码: "),
    onError: (err) => console.log(err),
  });

  console.log("You are now connected.");

  const sessionStr = stringSession.save();
  fs.writeFileSync(sessionFilePath, sessionStr);

  // 自动创建文件夹并管理对话
  await createAndManageFolders();
}

async function createAndManageFolders() {
  // 获取对话列表
  const dialogs = await client.invoke(new Api.messages.GetDialogs({
    offsetDate: 0,
    offsetId: 0,
    offsetPeer: new Api.InputPeerSelf(),
    limit: 100,
    hash: bigInt(0)
  }));

  const channels = [];
  if ('chats' in dialogs) {
    for (const chat of dialogs.chats) {
      if (chat instanceof Api.Channel) {
        channels.push(chat);
      }
    }
  }

  console.log("Channels:", channels.map(c => c.title));
  const folderId = 1; // 自定义文件夹 ID

  // 添加对话到文件夹
  await client.invoke(new Api.folders.EditPeerFolders({
    folderPeers: channels.map(chat => {
      let peer;
      if (chat instanceof Api.Channel) {
        peer = new Api.InputPeerChannel({
          channelId: chat.id,
          accessHash: chat.accessHash ?? bigInt(0), // 处理 accessHash 可能为 undefined 的情况
        });
      } else {
        throw new Error('Unknown chat type');
      }
      return new Api.InputFolderPeer({
        folderId: folderId,
        peer: peer,
      });
    })
  }));

  console.log("Folders created and chats added.");
}

run().catch(console.error);

function ask(question: string): Promise<string> {
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(question, (ans: string) => {
      rl.close();
      resolve(ans);
    })
  );
}


