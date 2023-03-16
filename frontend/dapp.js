import React, { useState } from 'react';
import Web3 from 'web3';
import DepositContract from 'adrr';

const web3 = new Web3();

function App() {
  const [userAddress, setUserAddress] = useState(null);
  const [amount, setAmount] = useState('');

  const handleConnect = async () => {
    if (window.ethereum) {
      await window.ethereum.enable();
      web3.setProvider(window.ethereum);
    } else if (window.web3) {
      web3.setProvider(window.web3.currentProvider);
    } else {
      console.error('No web3 provider found');
    }
  };

  const handleDeposit = async () => {
    const accounts = await web3.eth.getAccounts();
    const depositContract = new web3.eth.Contract(
      "contract abi",
      "contract address"
    );

    await depositContract.methods.deposit().send({
      from: accounts[0],
      value: web3.utils.toWei(amount, 'ether')
    });

    setUserAddress(accounts[0]);
    const response = await fetch('/api/deposit', {
      method: 'POST',
      body: JSON.stringify({ userAddress: accounts[0] }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  };

  return (
    <div>
      {userAddress ? (
        <p>Deposit successful! Your address: {userAddress}</p>
      ) : (
        <>
          <button onClick={handleConnect}>Connect to Web3</button>
          <input type="text" value={amount} onChange={e => setAmount(e.target.value)} />
          <button onClick={handleDeposit}>Make deposit</button>
        </>
      )}
    </div>
  );
}

export default App;