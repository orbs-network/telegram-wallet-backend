import { Web3Provider } from "./web3-provider";

const MATIC_TO_SEND = Web3.utils.toWei("0.1", "ether");

class Persistence {
  async store(key: string, property: string, value: any) {}

  async read(key: string): Promise<null | Record<string, string>> {
    return null;
  }
}

type AccountInfo = {
  address: string;
  tgUserId: string;
  topupStatus: "not_started" | "pending" | "completed";
  lastTopupDate: number;
};

class Faucet {
  constructor(
    private web3Provider: Web3Provider,
    private persistence: Persistence
  ) {}

  async sendMatic(
    toAddress: string,
    erc20TokenAddressForProof: string,
    tgUserId: string
  ) {
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
    }

    switch (userDetails.topupStatus) {
      case "not_started":
        break;
      case "pending":
        throw new Error("Topup already in progress");
      // TODO if X time has passed since, retry
      case "completed":
        throw new Error("Topup already completed");
      default:
        throw new Error(`Topup status unknown: ${userDetails.topupStatus}}`);
    }

    // TODO perhaps minimal amount
    if (!(await this.web3Provider.isEOABalanceEmpty(toAddress)))
      throw new Error("EOA already has MATIC");

    // TODO verify token against top-100 allowed list
    if (
      !(await this.web3Provider.hasErc20Balance(
        toAddress,
        erc20TokenAddressForProof
      ))
    )
      throw new Error("EOA does not have balance of an ERC20 token");

    await this.persistence.store(toAddress, "topupStatus", "pending");
    await this.persistence.store(toAddress, "lastTopupDate", Date.now());

    await this.web3Provider.transferToEOA(toAddress, MATIC_TO_SEND);

    // TODO await this.web3Provider.waitForConfirmation(toAddress);
    // or alternatively, wait for confirmation within the transferToEOA method

    await this.persistence.store(toAddress, "topupStatus", "completed");
  }
}
