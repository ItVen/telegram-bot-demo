import express from "express";
import bodyParser from "body-parser";
import crypto from "crypto";
import { runBot } from "./bot";
import path from "path";

const app = express();
const botToken = process.env.TOKEN || "";
if (!botToken) {
  console.error(
    "Bot token not provided. Please set the TOKEN environment variable."
  );
  process.exit(1);
}
const secret = crypto.createHash("sha256").update(botToken).digest();

// 配置中间件
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// 添加请求头

// 验证 Telegram 传递的哈希值
const checkSignature = (query: any): boolean => {
  const hash = query.hash;
  const dataCheckString = Object.keys(query)
    .filter((key) => key !== "hash")
    .sort()
    .map((key) => `${key}=${query[key]}`)
    .join("\n");
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(dataCheckString)
    .digest("hex");
  return hmac === hash;
};

// Telegram 认证回调
app.get("/auth/telegram", (req, res) => {
  const query = req.query;
  console.log(query);
  if (checkSignature(query)) {
    // 用户通过验证，处理用户信息
    const userId = query.id;
    const username = query.username;
    res.send(`Hello, ${username}! Your Telegram ID is ${userId}.`);
  } else {
    res.status(401).send("Unauthorized");
  }
});

app.post("/auth/telegram", (req, res) => {
  const query = req.query;
  console.log(query);
  res.status(200).send("ok");
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../page/index.html"));
});
// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

runBot();
