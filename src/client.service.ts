import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { Api } from "telegram/tl";
import "dotenv/config";
import bigInt from "big-integer";
import fs from 'fs';
import path from "path";
// 从 https:/ / my.telegram.org 获取
const apiId = process.env.YOUR_API_ID as any as number;
const apiHash = process.env.YOUR_API_HASH as string;
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
  await client.sendMessage("me", { message: "Hello, this is a test message!" });

  const me = await client.invoke(new Api.users.GetFullUser({
    id: await client.getInputEntity('me')
  }));
  console.log(me)

  // 获取最近的对话列表
  try {
    const result = await client.invoke(new Api.messages.GetDialogs({
      offsetDate: 0,
      offsetId: 0,
      offsetPeer: await client.getInputEntity('me'),
      limit: 10,
      hash: bigInt(0)
    }));
    console.log(result);
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
  console.log(history)

  const user = await client.invoke(new Api.users.GetFullUser({
    id: await client.getInputEntity('avendemobot')
  }));
  console.log(user);

  await client.invoke(new Api.channels.LeaveChannel({
    channel: await client.getInputEntity('tonkeeper_news')
  }));

  await client.invoke(new Api.channels.JoinChannel({
    channel: await client.getInputEntity('tonkeeper_news')
  }));
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

