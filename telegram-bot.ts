const token = process.env.TG_BOT_TOKEN;
const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(token, { polling: true });
import { verifyData } from "./verifyData";

export function initBot() {
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
}

export const verifyTgMiddleware = (req: any, res: any, next: any) => {
  if (!verifyData(token!, req.body.queryData)) {
    res.sendStatus(400);
    console.log(JSON.stringify(req.body));
    return;
  }
  req.tgUserId = JSON.parse(
    new URLSearchParams(req.body.queryData).get("user")!
  ).id;
  next();
};
