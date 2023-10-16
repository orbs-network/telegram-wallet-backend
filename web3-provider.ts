const Web3 = require("web3");
const { erc20 } = require("@defi.org/web3-candies");

export class Web3Provider {
  web3: any;
  constructor(providerURL, erc20ABI) {
    this.web3 = new Web3(new Web3.providers.HttpProvider(providerURL));
  }

  async isEOABalanceEmpty(address) {
    const balanceWei = await this.web3.eth.getBalance(address);
    const balanceEth = this.web3.utils.fromWei(balanceWei, "ether");
    return parseFloat(balanceEth) === 0;
  }

  async hasErc20Balance(address, tokenAddress) {
    const tokenContract = erc20(tokenAddress);
    const balance = await tokenContract.methods.balanceOf(address).call();
    return parseInt(balance) > 0;
  }

  async transferToEOA(toAddress, valueInEth) {
    const valueInWei = this.web3.utils.toWei(valueInEth.toString(), "ether");
    const tx = {
      to: toAddress,
      value: valueInWei,
      gas: 21000,
    };

    const signedTx = await this.web3.eth.accounts.signTransaction(
      tx,
      "" // TODO privateKey
    );
    return this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
  }
}

// Usage:
// const provider = new Web3Provider('<YOUR_INFURA_URL>', erc20ABI);
