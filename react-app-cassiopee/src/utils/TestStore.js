import React,{ useState, useEffect } from 'react';
import { BigNumber, ethers } from "ethers";
import contractEthAbi from './contractEthAbi.json';

export const TestStore = () => {
  
    const [inputValue, setInputValue] = useState(null);

    const contractAddress = "0x9B4d86c7dBb039FB060b25096eADAFc3E54e3944";

    const [errorMessage, setErrorMessage] = useState(null);
    const [defaultAccount, setDefaultAccount] = useState(null);
    const [connButtonText, setConnButtonText] = useState('Connect Wallet');
    const [provider, setProvider] = useState(null);
	  const [signer, setSigner] = useState(null);
	  const [contract, setContract] = useState(null);


  const accountChangedHandler = (newAccount) => {
    setDefaultAccount(newAccount);
    updateEthers();
  }

  const updateEthers = () => {
    
		let tempProvider = new ethers.providers.Web3Provider(window.ethereum);
		setProvider(tempProvider);

		let tempSigner = tempProvider.getSigner();
		setSigner(tempSigner);

		let tempContract = new ethers.Contract(contractAddress, contractEthAbi, tempSigner);
		setContract(tempContract);	
	}

  async function requestAccount() {
    if (window.ethereum) {
      window.ethereum.request({method: 'eth_requestAccounts'}).then(result => {
            accountChangedHandler(result[0]);
            setConnButtonText('Wallet Connected');
    });
    } else {
      setErrorMessage('MetaMask is not installed...')
    }
  }

  const contractDeposit = async (value) => {
    const sepoliaeth = value; // Example value in sepoliaeth
    //const weiValue = ethers.utils.formatEther(sepoliaeth);
		contract.deposit({ value: ethers.utils.parseEther(sepoliaeth) });
    console.log("Deposit success")
	}

  function handleButtonClick() {
    const input = inputValue;
    console.log(`Input value is ${input}`);
    contractDeposit(input);
  }

  return (
    <div>
        <h3> {"Test deposit"} </h3>
        <button onClick={requestAccount}> {connButtonText}</button>
        <h3> Address : {defaultAccount} </h3>

        {errorMessage}
        <div>
        <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
        <button onClick={handleButtonClick} style={{marginTop: '5em'}}> Deposit SepoliaEth </button>
        </div>
    </div>
  )
}