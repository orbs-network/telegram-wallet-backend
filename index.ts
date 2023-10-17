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

app.post("/topUp", verifyTgMiddleware, (req: any, res: any) => {
  console.log("received verified message by userid", req.tgUserId);

  res.end();
});

const address = "0x9Fa74a0D31ee751b657e12927E8c2F0Ac825A9BF"; //new Web3().eth.accounts.create().address;

debug(`recipient: ${address}`);
debug(`faucet address: ${web3Provider.account.address}`);

(async () => {
  erc20("", "0x0FA8781a83E46826621b3BC094Ea2A0212e71B23")
    .methods.transfer(address, "10000")
    .send({ from: web3Provider.account.address });
})();

if (process.env.NODE_ENV === "development") {
  app.get("/topUpNoAuth", async (req: any, res: any) => {
    await faucet.sendMatic(
      address,
      "0x0FA8781a83E46826621b3BC094Ea2A0212e71B23",
      "myTest"
    );
    res.end();
  });
}

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
