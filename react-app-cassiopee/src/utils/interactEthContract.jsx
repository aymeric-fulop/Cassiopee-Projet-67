import React,{ useState, useEffect } from 'react';
import { BigNumber, ethers } from "ethers";
import contractEthAbi from '../contracts/contractEthAbi.json';

    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [contract, setContract] = useState(null);

    contractAddress = "";
    userAddress = "";
    recipientAddress = "";

/**
 * Function to set an instance of Provider, Signer and Contract.
 */
const updateEthers = () => {

    let tempProvider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(tempProvider);

    let tempSigner = tempProvider.getSigner();
    setSigner(tempSigner);

    let tempContract = new ethers.Contract(contractAddress, contractEthAbi, tempSigner);
    setContract(tempContract);	
}

/**
 * Function to deposit Eth to the Ethereum Smart Contract.
 * @param value  value to deposit
 */
const contractDeposit = async (value) => {
    try {
        const sepoliaeth = value; 
        contract.deposit({ value: ethers.utils.parseEther(sepoliaeth) });
        console.log("Deposit success");
    }
    catch(err) {
        console.log(err);
    }
}

/**
 * Function to revert a previous deposit to a wallet address.
 * @param userAddress  wallet address
 */
const contractRevertDeposit = async (userAddress) => {
    try {
        contract.revertDepo(userAddress);
        console.log("Revert Deposit success")
    }
    catch(err) {
        console.log(err)
    }
}

/**
 * Function to confirm an Eth transaction between two address.
 * @param userAddress  Sender
 * @param recipientAddress  Receiver
 */
const contractConfirm = async (userAddress, recipientAddress) => {
    try {
        contract.confirm(userAddress, recipientAddress);
        console.log("Confirm success")
    }
    catch(err) {
        console.log(err)
    }
}

export { updateEthers, contractDeposit, contractRevertDeposit, contractConfirm };
