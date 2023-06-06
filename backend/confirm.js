require('dotenv').config();
const { ethers } = require('ethers');
const contractABI = require('./ContractABI.json');

const mnemonic = process.env.MNEMONIC;
const providerUrl = process.env.INFURA_URL;

const provider = new ethers.JsonRpcProvider(providerUrl);
const wallet = new ethers.Wallet(mnemonic, provider);

const contractAddress = '0x3C21539f9728550B9e23F9887B8068756AB775AB'; // To be actualised
const contractDepositETH = new ethers.Contract(contractAddress, contractABI, wallet);
const contractDepositNft = new ethers.Contract(contractAddress, contractABI, wallet);

// let depositor = '0xDA242f571090f25114A849F7fB3E7947D03D322e'; // Replace with the actual depositor address
// let recipient = '0xDA242f571090f25114A849F7fB3E7947D03D322e';

let ethDeposits = [[]]; 
let nftsDeposits = [[]]; 
const executor = wallet.address;

async function confirmTransferAfterETHDeposit(depositor, recipient, value, event) {
    console.log(event);
}
contractDepositETH.on("Deposit", confirmTransferAfterETHDeposit);

async function confirmTransferAfterNftDeposit(depositor, recipient, event) {
    // On a l'adresse de dépot et l'adresse recipiente
    // On check dans la liste des dépots de ETH si il y en a un correspondant
    // La liste des dépots ETH est de la sorte [depositorAddress, recipientAddress]
    // On a juste à checker si ethdeposit[0] == recipient et ethdeposit[1] == depositor
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


// contractDepositNft.on("NftDeposit", confirmTransferAfterNftDeposit)