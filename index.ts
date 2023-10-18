import { config } from "dotenv";
config();
import { initBot, verifyTgMiddleware } from "./telegram-bot";
import express from "express";
import { Web3Provider } from "./Web3Provider";
import { Faucet } from "./faucet";
import { DiskStorage } from "./DiskStorage";
import { MemoryStorage } from "./MemoryStorage";
import { erc20, erc20sData } from "@defi.org/web3-candies";
import Web3 from "web3";
import { TempWeb3Provider } from "./web3-provider-temp";
const debug = require("debug")("wallet-backend:server");

initBot();

const app = express();
app.use(require("cors")());
app.use(express.json());

const port = 3000;

const web3Provider = new Web3Provider(
  `https://polygon-mumbai.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
  process.env.FAUCET_PRIVATE_KEY!
);

const faucet = new Faucet(web3Provider, new DiskStorage(), new MemoryStorage());

/*

Flow:
- Topup from credit card - any token (usdc, dai, etc)
- Sent from polygon - any token
- Sent from ethereum - any token

Client monitors balance, and when confirmed it initiates the MATIC top up against the backend

*/

app.post("/topUp", verifyTgMiddleware, async (req: any, res: any) => {
  console.log("received verified message by userid", req.tgUserId);
  await faucet.sendMatic(req.body.toAddress, req.body.erc20Token, req.tgUserId);
  res.end();
});

const recipientAddress = "0x3552115aFFd2D60559089D09585c0EE04697aE07"; //new Web3().eth.accounts.create().address;

debug(`recipient: ${recipientAddress}`);
debug(`faucet address: ${web3Provider.account.address}`);

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
    res.end();
  });

  app.get("/topUpNoAuth", async (req: any, res: any) => {
    await faucet.sendMatic(
      req.query.address,
      "0x0FA8781a83E46826621b3BC094Ea2A0212e71B23",
      `Nottg:${req.query.address}`
    );
    res.end();
  });
}

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
