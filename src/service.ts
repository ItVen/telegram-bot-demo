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
         <button id="goto-demo">Go to Demo</button>
        <script>
          (function() {
            try {
              console.log("=============webApp 0======");
              const tg = window.Telegram.WebApp;
              console.log("tg:", tg);
              const initDataUnsafe = tg.initDataUnsafe; // 解析后的初始数据（包含用户信息）
              console.log("initDataUnsafe:", initDataUnsafe);
              const initData =  tg.initData;
               console.log("=============initData 0======");
              console.log("initDataUnsafe:", initData);

              // Display user info in the HTML
              const user = initDataUnsafe.user || {};
              const userInfo = JSON.stringify(user, null, 2);
              document.getElementById('telegram-info').innerText = userInfo; 
              const urlParams = new URLSearchParams(window.location.search); 
              document.getElementById('route-params').innerText = urlParams;
                document.getElementById('goto-demo').addEventListener('click', function() {
                window.location.href = 'https://bot-demo-hazel.vercel.app/demo?blink=https%3A%2F%2Fjup.ag%2Fswap%2FSOL-MEW';
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
        <title>Welcome</title>
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
      </head>
      <body> 
        <h1>Welcome!</h1>
        <div id="telegram-info"></div>
        <div id="route-params"></div>
        <script>
          (function() {
            try {
              console.log("=============webApp 0======");
              const tg = window.Telegram.WebApp;
              console.log("tg:", tg);
              const initDataUnsafe = tg.initDataUnsafe; // 解析后的初始数据（包含用户信息）
              console.log("initDataUnsafe:", initDataUnsafe);
              const initData =  tg.initData;
               console.log("=============initData 0======");
              console.log("initDataUnsafe:", initData);

              // Display user info in the HTML
              const user = initDataUnsafe.user || {};
              const userInfo = JSON.stringify(user, null, 2);
              document.getElementById('telegram-info').innerText = userInfo; 
              const urlParams = new URLSearchParams(window.location.search); 
              document.getElementById('route-params').innerText = urlParams;
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
