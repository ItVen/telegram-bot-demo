import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { Api } from "telegram/tl";
import "dotenv/config";
import bigInt from "big-integer";
import fs from 'fs';
import path from "path";
// 从 https:/ / my.telegram.org 获取
const apiId = process.env.API_ID as any as number;
const apiHash = process.env.API_HASH as string;
const sessionFilePath = path.resolve(__dirname, 'session.json');
let sessionData = "";
if (fs.existsSync(sessionFilePath)) {
  sessionData = fs.readFileSync(sessionFilePath, 'utf8');
}
const stringSession = new StringSession(sessionData);

console.log(apiId, apiHash)
// 初始化客户端
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
  // 发送一条消息到某个聊天
  // await client.sendMessage("me", { message: "Hello, this is a test message!" });

  const me = await client.invoke(new Api.users.GetFullUser({
    id: await client.getInputEntity('me')
  }));
  // 获取最近的对话列表
  try {
    const result = await client.invoke(new Api.messages.GetDialogs({
      offsetDate: 0,
      offsetId: 0,
      offsetPeer: await client.getInputEntity('me'),
      limit: 10,
      hash: bigInt(0)
    }));
  } catch (error) {
    console.error('Failed to get dialogs:', error);
  }

  let message = await client.sendMessage('avendemobot', { message: 'Hello, this is a test message!' });

  await client.invoke(new Api.messages.EditMessage({
    peer: await client.getInputEntity('avendemobot'),
    id: message.id,
    message: 'Edited message text'
  }));

  await client.invoke(new Api.messages.DeleteMessages({
    id: [message.id],
    revoke: true // Set to true if you want to delete the message for everyone
  }));

  const history = await client.invoke(new Api.messages.GetHistory({
    peer: await client.getInputEntity('avendemobot'),
    offsetId: 0,
    offsetDate: 0,
    addOffset: 0,
    limit: 10,
    maxId: 0,
    minId: 0,
    hash: bigInt(0)
  }));

  const user = await client.invoke(new Api.users.GetFullUser({
    id: await client.getInputEntity('avendemobot')
  }));

  await client.invoke(new Api.channels.LeaveChannel({
    channel: await client.getInputEntity('tonkeeper_news')
  }));

  await client.invoke(new Api.channels.JoinChannel({
    channel: await client.getInputEntity('tonkeeper_news')
  }));

  // 获取对话列表
  const dialogs = await client.invoke(new Api.messages.GetDialogs({
    offsetDate: 0,
    offsetId: 0,
    offsetPeer: new Api.InputPeerSelf(),
    limit: 100,
    hash: bigInt(0)
  }));

  const channels: Api.Channel[] = [];
  const bots: Api.User[] = [];
  const users: Api.User[] = [];
  const folderMap = new Map(); // 文件夹ID和名称的映射

  if ('chats' in dialogs) {
    for (const chat of dialogs.chats) {
      if (chat instanceof Api.Channel) {
        channels.push(chat);
      } else if (chat instanceof Api.User) {
        if ((chat as Api.User).bot) {
          bots.push(chat);
        } else {
          users.push(chat);
        }
      } else if (chat instanceof Api.Chat) {
      } else {
      }
    }
  } else {
    console.error("Unexpected response format:", dialogs);
  }
  // 获取文件夹信息
  if ('dialogs' in dialogs) {
    for (const dialog of dialogs.dialogs) {
      if ((dialog as any).folderId) {
        console.log(dialog)
        folderMap.set((dialog as any).folderId, (dialog as any).folderTitle);
      }
    }

  }


  // console.log("Channels:", channels.map(c => c.title));
  // console.log("Bots:", bots.map(b => b.username));
  // console.log("Users:", users.map(u => u.username));
  console.log("Folders:", Array.from(folderMap.entries()).map(([id, title]) => ({ id, title })));

  // 创建“收藏”文件夹并添加对话
  // await client.invoke(new Api.folders.EditPeerFolders({
  //   folderPeers: channels.map(chat => {
  //     console.log({ chat })
  //     let peer = new Api.InputPeerChannel({
  //       channelId: chat.id,
  //       accessHash: chat.accessHash ?? bigInt(0),
  //     });
  //     return new Api.InputFolderPeer({
  //       folderId: 1, // 文件夹 ID，需要唯一
  //       peer: peer,
  //     });
  //   })
  // }));

  // console.log("Selected chats added to '收藏' folder.");

}

// 运行客户端
run().catch(console.error);



// 辅助函数，用于命令行输入
function ask(question: string): Promise<string> {
  const rl = require("readline").createInterface({
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

