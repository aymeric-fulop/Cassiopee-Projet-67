import React, { useState } from 'react';
import Web3 from 'web3';
import DepositContract from './contracts/DepositContract.json';

const web3 = new Web3(Web3.givenProvider);

function App() {
  const [userAddress, setUserAddress] = useState(null);

  const handleDeposit = async () => {
    const accounts = await web3.eth.getAccounts();
    const depositContract = new web3.eth.Contract(
      "contract abi",
      "contract address"
    );

    await depositContract.methods.deposit().send({
      from: accounts[0],
      value: inputed_value
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
        <button onClick={handleDeposit}>Make deposit</button>
      )}
    </div>
  );
}

export default App;