import { Web3Provider } from "./Web3Provider";
import { erc20sData } from "@defi.org/web3-candies";
import Web3 from "web3";

const MATIC_TO_SEND = Web3.utils.toWei("0.0001", "ether");

// TODO config
const allowedERC20s = [
  erc20sData.poly.USDC.address,
  erc20sData.poly.USDT.address,
  "0x0FA8781a83E46826621b3BC094Ea2A0212e71B23", // mumbai usdc
];

export interface Storage {
  storeProp(key: string, property: string, value: any): Promise<void>;
  storeObject(key: string, object: any): Promise<void>;
  read(key: string): Promise<null | Record<string, string>>;
  delete(key: string): Promise<void>;
}

type AccountInfo = {
  address: string;
  tgUserId: string;
  topupStatus: "not_started" | "completed";
  lastTopupDate: number | null;
};

export class Faucet {
  constructor(
    private web3Provider: Web3Provider,
    private persistence: Storage,
    private lockManager: Storage
  ) {}

  /*
  If we got here, this means that the message was sent by this authenticated telegram user via our bot
  (If someone else tried to deploy a bot pointing to our webapp, it wouldn't be able to authenticate using our api key)
  */
  async sendMatic(
    toAddress: string,
    erc20TokenAddressForProof: string,
    tgUserId: string
  ) {
    if (!!(await this.lockManager.read(tgUserId))?.lock)
      throw new Error("already in progress for this user");

    // TODO obviously wouldn't work with multiple users
    try {
      await this.lockManager.storeProp(tgUserId, "lock", "true");

      if (!allowedERC20s.includes(erc20TokenAddressForProof))
        throw new Error("ERC20 token not allowed");

      let userDetails = (await this.persistence.read(
        tgUserId
      )) as null | AccountInfo;

      if (!userDetails) {
        userDetails = {
          address: toAddress,
          tgUserId,
          topupStatus: "not_started",
          lastTopupDate: null,
        };

        await this.persistence.storeObject(tgUserId, userDetails);
      }

      switch (userDetails.topupStatus) {
        case "not_started":
          break;
        case "completed":
          throw new Error("Topup already completed");
        default:
          throw new Error(`Topup status unknown: ${userDetails.topupStatus}}`);
      }

      if (!(await this.web3Provider.isEOABalanceEmpty(toAddress)))
        throw new Error("EOA already has MATIC");

      if (
        !(await this.web3Provider.hasErc20Balance(
          toAddress,
          erc20TokenAddressForProof
        ))
      )
        throw new Error("EOA does not have balance of an ERC20 token");

      await this.persistence.storeProp(tgUserId, "lastTopupDate", Date.now());
      const txid = await this.web3Provider.transferToEOA(
        toAddress,
        MATIC_TO_SEND
      );
      await this.persistence.storeProp(tgUserId, "topupStatus", "completed");

      return txid;
    } finally {
      await this.lockManager.delete(tgUserId);
    }
  }
}
