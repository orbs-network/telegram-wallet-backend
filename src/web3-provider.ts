import Web3 from "web3";
import { erc20, setWeb3Instance } from "@defi.org/web3-candies";
import { Web3Account } from "web3-eth-accounts";
import { estimateGasPrice } from "./utils/estimate-gas-price";
import { getDebug } from "./utils/debug";
const debug = getDebug("web3-provider");

export class Web3Provider {
  web3: Web3;
  account: Web3Account;
  constructor(providerURL: string, privateKey: string) {
    this.web3 = new Web3(new Web3.providers.HttpProvider(providerURL));
    setWeb3Instance(this.web3);
    this.account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
    this.web3.eth.accounts.wallet.add(this.account);
  }

  async isEOABalanceEmpty(address: string) {
    const balanceWei = await this.web3.eth.getBalance(address);
    const balanceEth = this.web3.utils.fromWei(balanceWei, "ether");
    debug(`Balance of ${address} is ${balanceEth}`);
    return parseFloat(balanceEth) === 0;
  }

  async hasErc20Balance(address: string, tokenAddress: string) {
    const tokenContract = erc20("", tokenAddress);
    const balance = await tokenContract.methods.balanceOf(address).call();
    debug(`Balance of ${address} for erc20: ${tokenAddress} is ${balance}`);
    return parseInt(balance) > 0;
  }

  async transferToEOA(toAddress: string, value: string) {
    debug(
      `Transfering ${value} to ${toAddress}. Faucet balance is: ${await this.web3.eth.getBalance(
        this.account.address
      )}`
    );

    const [nonce, price] = await Promise.all([
      this.web3.eth.getTransactionCount(this.account.address),
      estimateGasPrice(this.web3),
    ]);

    const tx = {
      from: this.account.address,
      to: toAddress,
      value: value,
      gas: 21000,
      maxFeePerGas: price["med"].max.toString(),
      maxPriorityFeePerGas: price["med"].tip.toString(),
      nonce,
    };

    const signedTx = await this.web3.eth.accounts.signTransaction(
      tx,
      this.account.privateKey
    );

    const { transactionHash } = await this.web3.eth.sendSignedTransaction(
      signedTx.rawTransaction
    );

    debug(`Transaction hash: ${transactionHash}`);
    return transactionHash;
  }
}
