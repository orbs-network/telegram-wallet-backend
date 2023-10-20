import TelegramBot from "node-telegram-bot-api";
export const token = process.env.TG_BOT_TOKEN!;
const bot = new TelegramBot(token, { polling: true });

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
              web_app: { url: process.env.WEBAPP_URL! },
            },
          ],
        ],
      },
    });
  });
}
