//import { ethers } from "ethers";

const contractAddress = "";

async function interactEthSmartContract() {
    if(typeof window.ethereum !== 'undefined') {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.contract(ethcontractAddress, ethcontract.abi, provider);
        try {
            
        }
        catch(err) {
            console.log(err);
        }
    } 
}