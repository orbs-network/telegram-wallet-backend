import { verifyData } from "./verifyData";

const express = require("express");

const app = express();
app.use(require("cors")());
app.use(express.json());

const port = 3000;

const token = process.env.TG_BOT_TOKEN;

const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(token, { polling: true });

bot.on("message", (msg: any) => {
  const chatId = msg.chat.id;

  console.log(msg);

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, "Welcome to TgWallet", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Open 👋",
            web_app: { url: "https://4182-77-102-81-167.ngrok-free.app" },
          },
        ],
      ],
    },
  });
});

const verifyTgMiddleware = (req: any, res: any, next: any) => {
  if (!verifyData(token, req.body.queryData)) {
    res.sendStatus(400);
    console.log(JSON.stringify(req.body));
    return;
  }
  req.tgUserId = JSON.parse(
    new URLSearchParams(req.body.queryData).get("user")!
  ).id;
  next();
};


/*

Flow:
- Topup from credit card - any token (usdc, dai, etc)
- Sent from polygon - any token
- Sent from ethereum - any token

Client monitors balance, and when confirmed it initiates the MATIC top up against the backend

*/

app.post("/topUp", verifyTgMiddleware, (req: any, res: any) => {
  console.log("received verified message by userid", req.tgUserId);

  
  

  res.end();
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
