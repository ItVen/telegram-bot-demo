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
  const dialogs = await client.invoke(new Api.messages.GetDialogs({
    offsetDate: 0,
    offsetId: 0,
    offsetPeer: new Api.InputPeerSelf(),
    limit: 100,
    hash: bigInt(0)
  }));

  const groups = [];
  const adminUser: any[] = [];
  if ('chats' in dialogs) {
    for (const chat of dialogs.chats) {
      if (chat instanceof Api.Channel && chat.megagroup) { // 确保是超级群组
        groups.push(chat);
      }
    }
  } else {
    console.error("Unexpected response format:", dialogs);
  }
  console.log("Groups:", groups.map(g => g.title));

  for (const group of groups) {
    console.log(`Fetching admins for group: ${group.title} (${group.id})`);
    const result = await client.invoke(new Api.channels.GetParticipants({
      channel: new Api.InputChannel({
        channelId: group.id,
        accessHash: group.accessHash ?? bigInt(0),
      }),
      filter: new Api.ChannelParticipantsAdmins(),
      offset: 0,
      limit: 100,
      hash: bigInt(0),
    }));

    if (result instanceof Api.channels.ChannelParticipants) {
      console.log(`Admins in ${group.title}; admin len = ${result.users.length}`);

      result.users.map((user) => {
        adminUser.push({
          id: user.id,
          username: (user as Api.User).username,
          firstName: (user as Api.User).firstName
        })
      })


    } else {
      console.log("Failed to fetch participants.");
    }

  }
  console.log(adminUser)

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

