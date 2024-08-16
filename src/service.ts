import express from "express";
import bodyParser from "body-parser";
import crypto from "crypto";
import { runBot } from "./bot";
import path from "path";
import webApp from "@twa-dev/sdk";

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
  console.log("checkSignature", query);
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
  console.log({ hmac, hash });
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
    const first_name = query.first_name;
    res.redirect(`/welcome?username=${username}&first_name=${first_name}`);
  } else {
    res.redirect("/error");
  }
});

app.get("/welcome", (req, res) => {
  const targetAppUrl = `https://t.me/avendemobot/demo?startapp=1222`;
  const htmlContent = `
    <html>
      <head>
        <title>Welcome</title>
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
      </head>
      <body> 
        <h1>Welcome!</h1>
        <div id="telegram-info"></div>
        <div id="route-params"></div>
        <button id="open-another-app">Open Another Mini App</button>
        <script>
          (function() {
            try {
              const tg = window.Telegram.WebApp;
              console.log(tg)
              const initDataUnsafe = tg.initDataUnsafe; // 解析后的初始数据（包含用户信息）

              // 显示用户信息
              const user = initDataUnsafe.user || {};
              const userInfo = JSON.stringify(user, null, 2);
              document.getElementById('telegram-info').innerText = userInfo;

              // 显示当前页面的 URL 参数（如果有的话）
              const urlParams = new URLSearchParams(window.location.search);
              document.getElementById('route-params').innerText = JSON.stringify(Object.fromEntries(urlParams.entries()), null, 2);

              // 设置按钮点击事件，跳转到目标小程序页面
              document.getElementById('open-another-app').addEventListener('click', function() {
                tg.openTelegramLink("${targetAppUrl}"); 
              });
            } catch (error) {
              console.error("Error initializing Telegram Web App:", error);
              document.getElementById('telegram-info').innerText = 'Error retrieving Telegram data.';
            }
          })();
        </script>
      </body>
    </html>
  `;
  res.send(htmlContent);
});

app.get("/demo", (req, res) => {
  const htmlContent = `
    <html>
      <head>
        <title>Demo</title>
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
      </head>
      <body> 
        <h1>Welcome!</h1>
        <div id="telegram-info"></div>
        <div id="route-params"></div>
        <script>
          (function() {
            try {
              const tg = window.Telegram.WebApp;
              console.log(tg)
              const initDataUnsafe = tg.initDataUnsafe; // 解析后的初始数据（包含用户信息）

              // 显示用户信息
              const user = initDataUnsafe.user || {};
              const userInfo = JSON.stringify(user, null, 2);
              document.getElementById('telegram-info').innerText = userInfo; 
              const urlParams = new URLSearchParams(window.location.search);
              document.getElementById('route-params').innerText = urlParams

            } catch (error) {
              console.error("Error initializing Telegram Web App:", error);
              document.getElementById('telegram-info').innerText = 'Error retrieving Telegram data.';
            }
          })();
        </script>
      </body>
    </html>
  `;
  res.send(htmlContent);
});

 
app.get("/error", (req, res) => {
  res.send("<h1>Authentication Failed</h1>");
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../page/index.html"));
});
app.get("/app", (req, res) => {
  res.sendFile(path.join(__dirname, "../page/index.html"));
});

app.get("/hello", (req, res) => {
  res.sendFile(path.join(__dirname, "../page/test.html"));
});
// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

runBot();
