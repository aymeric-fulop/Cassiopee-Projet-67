### Cassiopée - Projet 67 : Solution cross-chain pour l'interconnexion entre 2 blockchains


## Introduction: 

## Project Objectives :
  Build a Dapp to allow the transfer of funds in Ethereum against transfer of assets on Hyperledger Fabric

## Technologies Used: 
  The project is mainly wrote in typescript for all the scripting parts and for the chaincode on Hyperledger Fabric. 
  The smart contracts on Ethereum are written in solidity and compiled using forge. The tests written the storage.sol:Deposit contract are not   up-to-date. 
  To interact with ethereum, we used the widly known librabry etherjs.


## Installation Instructions: 
  To use the chaincode on your own fabric test network, if you want to put it in a custom folder you should change the path directly in the     files. For the smooth execution of this project, please ensure to download it into the same directory where the "fabric-samples" folder is     located. This also applies to "Application-gateway-fabric-eth".
  "npm install" in all folders to init the dependencies. "forge init" for the smart contract on Ethereum folder, forge h  as to be installed.

## Configuration: 
  Create your own .env file in the backend/application-gateway-fabric-eth/config. The .env file should look like this : 
  PKEY = 'your_private_key_from_a_web3_wallet'
  INFURA_URL = 'your_provider_url' 
  Note that the variable is named INFURA_URL but the provider might not be infura it would still work. 

## Usage: 
  If you want to implement a solution between Fabric and Ethereum. To integrate a payement methode using Ethereum on your Fabric Blockchain     this is for you. 


## Credits and Acknowledgements: Paul Bitan & Aymeric Fullop
