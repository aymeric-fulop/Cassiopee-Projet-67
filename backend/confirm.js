require('dotenv').config();
const { ethers } = require('ethers');
const contractABI = require('./ContractABI.json');

const mnemonic = process.env.MNEMONIC;
const providerUrl = process.env.INFURA_URL;

const provider = new ethers.providers.JsonRpcProvider(providerUrl);
const walletMnemonic = ethers.Wallet.fromMnemonic(mnemonic);
const wallet = walletMnemonic.connect(provider);

const contractAddress = '0x9b4d86c7dbb039fb060b25096eadafc3e54e3944';
const contract = new ethers.Contract(contractAddress, contractABI, wallet);

const depositor = '0xDA242f571090f25114A849F7fB3E7947D03D322e'; // Replace with the actual depositor address
const recipient = '0xDA242f571090f25114A849F7fB3E7947D03D322e';

async function confirmTransfer() {
    const executor = wallet.address;
    console.log(`Confirming transfer: executor=${executor}, depositor=${depositor}, recipient=${recipient}`);
    
    // Call the deposit function to simulate a deposit
    const depositTx = await contract.deposit({ value: ethers.utils.parseEther('1') });
    await depositTx.wait();
    
    // Get the balance of the depositor
    const depositAmount = await contract.deposits(depositor);
    
    // Confirm the transfer
    const tx = await contract.confirm(depositor, recipient);
    console.log(`Transaction hash: ${tx.hash}`);
    await tx.wait(); // Wait for the transaction confirmation
    
    // Check if the balance of the depositor is now 0
    const newBalance = await contract.deposits(depositor);
    console.log(`New balance of the depositor: ${newBalance}`);
}

confirmTransfer()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });