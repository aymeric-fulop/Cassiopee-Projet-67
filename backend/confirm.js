require('dotenv').config();
const { ethers } = require('ethers');
const contractABI = require('./ContractABI.json');

const mnemonic = process.env.MNEMONIC;
const providerUrl = process.env.INFURA_URL;

const provider = new ethers.providers.JsonRpcProvider(providerUrl);
const walletMnemonic = ethers.Wallet.fromMnemonic(mnemonic);
const wallet = walletMnemonic.connect(provider);

const contractAddress = '0x9b4d86c7dbb039fb060b25096eadafc3e54e3944'; // To be actualised
const contractDepositETH = new ethers.Contract(contractAddress, contractABI, wallet);
const contractDepositNft = new ethers.Contract(contractAddress, contractABI, wallet);

// let depositor = '0xDA242f571090f25114A849F7fB3E7947D03D322e'; // Replace with the actual depositor address
// let recipient = '0xDA242f571090f25114A849F7fB3E7947D03D322e';

let ethDeposits = [[]]; 
let nftsDeposits = [[]]; 
const executor = wallet.address;

async function confirmTransferAfterETHDeposit(depositor, recipient, value, event) {
    for (let nftdeposit of nftsDeposits) {
        if (nftdeposit[0] == recipient && nftdeposit[1] == depositor) {
            console.log(`Confirming transfer: executor=${executor}, depositor=${depositor}, recipient=${recipient}`);
            
            // Confirm the transfer
            const txTransferETH = await contractDepositETH.confirm(depositor, recipient);
            
            await txTransferETH.wait(); // Wait for the transaction confirmation
            
            const txTransferNft = await contractDepositNft.confirm(depositor, recipient);
            await txTransferNft.wait(); // Wait for the transaction confirmation


            console.log(`Transaction hash: ${txTransferETH.hash}`); // Exemple de log les transfers
            console.log("Transfer has been done") // log, transfer hashes or pass them directly to the front
            break;
        }
    }
    // Faire quelque chose si le transfert ne s'est pas fait. 
    ethDeposits.push([depositor, recipient]);
    
}


async function confirmTransferAfterNftDeposit(depositor, recipient, event) {
    for (let ethdeposit of ethDeposits) {
        if (ethdeposit[0] == recipient && ethdeposit[1] == depositor) {
            console.log(`Confirming transfer: executor=${executor}, depositor=${depositor}, recipient=${recipient}`);
            
            // Confirm the transfer
            const txTransferETH = await contractDepositETH.confirm(depositor, recipient);
            await txTransferETH.wait(); // Wait for the transaction confirmation
            
            const txTransferNft = await contractDepositNft.confirm(depositor, recipient);
            await txTransferNft.wait(); // Wait for the transaction confirmation

            console.log("Transfer has been done") // log, transfer hashes or pass them directly to the front
            break;
        }
    }
    // Faire quelque chose si le transfert ne s'est pas fait. 
    nftsDeposits.push([depositor, recipient]);
}
// confirmTransferAfterNftDeposit()
//     .then(() => process.exit(0))
//     .catch((err) => {
//         console.error(err);
//         process.exit(1);
//     });

contractDepositETH.on("Deposit", confirmTransferAfterETHDeposit);
contractDepositNft.on("NftDeposit", confirmTransferAfterNftDeposit)