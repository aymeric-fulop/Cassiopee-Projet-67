const Web3 = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const contractABI = require('./ContractABI.json');

const provider = new HDWalletProvider({
    mnemonic: 'we will process it with process dotenv or json',
    providerOrUrl: 'https://ropsten.infura.io/v3/I will set up that',
});

// initiate web3 instance using web3(provider)
const web3 = new Web3(provider);
const contractAddress = 'our contract adress when deployed';
// we make the contract readable for web3.js
const contract = new web3.eth.Contract(contractABI, contractAddress);

const recipient = 'this adress will be sent by the dapp';
const amount = web3.utils.toWei('1', 'ether');

async function confirmTransfer() {
    const accounts = await web3.eth.getAccounts();
    const sender = accounts[0];
    console.log(`Confirming transfer: recipient=${recipient}, amount=${amount}`);
    const tx = await contract.methods.confirm(recipient, amount).send({from: sender});
    console.log(`Transaction hash: ${tx.transactionHash}`);
}

// We call that script when we want to proceed to the transfer, ie when we have the confirmation from the dapp
confirmTransfer()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
