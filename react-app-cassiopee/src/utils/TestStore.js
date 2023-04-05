import React,{ useState, useEffect } from 'react';

export const TestStore = () => {
    const [errorMessage, setErrorMessage] = useState(null);
    const [defaultAccount, setDefaultAccount] = useState(null);
    const [connButtonText, setConnButtonText] = useState('Connect Wallet');
  
    const [currentContractVal, setCurrentContractVal] = useState(null);


  const accountChangedHandler = (newAccount) => {
    setDefaultAccount(newAccount);
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

  return (
    <div>
        <h3> {"Test deposit"} </h3>
        <button onClick={requestAccount}> {connButtonText}</button>
        <h3> Address : {defaultAccount} </h3>

        {errorMessage}
    </div>
  )
}