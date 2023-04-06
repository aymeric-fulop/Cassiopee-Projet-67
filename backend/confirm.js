require('dotenv').config();
const { ethers } = require('ethers');
const contractABI = require('./ContractABI.json');

const mnemonic = process.env.MNEMONIC;
const providerUrl = process.env.INFURA_URL;

const provider = new ethers.providers.JsonRpcProvider(providerUrl);
const walletMnemonic = ethers.Wallet.fromMnemonic(mnemonic);
const wallet = walletMnemonic.connect(provider);

const contractAddress = 'your_contract_address_when_deployed';
const contract = new ethers.Contract(contractAddress, contractABI, wallet);

const recipient = 'this_address_will_be_sent_by_the_dapp';
const amount = ethers.utils.parseEther('1'); // Convert 1 ether to wei

async function confirmTransfer() {
    const sender = wallet.address;
    console.log(`Confirming transfer: sender=${sender}, recipient=${recipient}, amount=${amount}`);
    const tx = await contract.confirm(recipient, amount);
    console.log(`Transaction hash: ${tx.hash}`);
    await tx.wait(); // Wait for the transaction confirmation
}

confirmTransfer()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
