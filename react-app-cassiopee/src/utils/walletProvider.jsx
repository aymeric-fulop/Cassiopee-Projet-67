import React,{ useState } from 'react';

    const [defaultAccount, setDefaultAccount] = useState(null);

/**
 * Function to get a userAdrress.
 */
async function requestAccount() {
    if (window.ethereum) {
      window.ethereum.request({method: 'eth_requestAccounts'}).then(result => {
            setDefaultAccount(result[0]);
    });
    } else {
      setErrorMessage('MetaMask is not installed...')
    }
  }

/**
 * Function to dislabe the current userAddress.
 */  
async function dislabeAccount() {
    try {
        setDefaultAccount(null);
    }
    catch(err) {
        console.log(err);
    }
}
  
export { requestAccount, dislabeAccount };