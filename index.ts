import { config } from "dotenv";
config();
import { initBot } from "./src/telegram-bot";
import { tgAuthMiddleware } from "./src/utils/tg-auth-middleware";
import express from "express";
import { Web3Provider } from "./src/web3-provider";
import { Faucet } from "./src/faucet";
import { DiskStorage } from "./src/storage/disk-storage";
import { MemoryStorage } from "./src/storage/memory-storage";
import { TempWeb3Provider } from "./src/web3-provider-temp";
import { getDebug } from "./src/utils/debug";
import { web3 } from "@defi.org/web3-candies";
const debug = getDebug("server");

export const isMumbai = process.env.IS_MUMBAI === "1";

initBot();

const app = express();
app.use(require("cors")());
app.use(express.json());

const web3Provider = new Web3Provider(
  `${process.env.ALCHEMY_URL}/${process.env.ALCHEMY_API_KEY}`,
  process.env.FAUCET_PRIVATE_KEY!
);

const faucet = new Faucet(web3Provider, new DiskStorage(), new MemoryStorage());

app.get("/hc", async (req: any, res: any) => {
  res.json(await faucet.status());
});

app.post("/topUp", tgAuthMiddleware, async (req: any, res: any, next: any) => {
  try {
    console.log("received verified message by userid", req.tgUserId);
    await faucet.sendMatic(
      req.body.toAddress,
      req.body.erc20Token,
      req.tgUserId
    );
    res.end();
  } catch (e) {
    next(e);
  }
});

const tempWeb3Provider = new TempWeb3Provider(
  web3Provider.web3,
  web3Provider.account
);

if (process.env.NODE_ENV === "development") {
  app.get("/usdc", async (req: any, res: any) => {
    await tempWeb3Provider.transfer(
      "0x0FA8781a83E46826621b3BC094Ea2A0212e71B23",
      req.query.address,
      "10000"
    );
    debug("sent 10000 usdc to", req.query.address);
    res.end();
  });
}

const port = process.env.PORT ?? 3000;

app.listen(port, () => {
  debug(`Wallet backend listening on port ${port}`);
  debug(`ALCHEMY_URL: ${process.env.ALCHEMY_URL}`);
  debug(`SKIP_TG_AUTH: ${process.env.SKIP_TG_AUTH}`);
  debug(`WEBAPP_URL: ${process.env.WEBAPP_URL}`);
  debug(`NODE_ENV: ${process.env.NODE_ENV}`);
});

app.use((err: Error, req: any, res: any, next: any) => {
  res.status(500).send(err.toString());
});
