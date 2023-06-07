/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import contractABI from '../model/ContractABI.json';
import {Depositor, Recipient, NftDeposit, EthDeposit} from  '../model/type'
import * as dotenv from "dotenv";
import { ethers, Wallet } from 'ethers';
import * as grpc from '@grpc/grpc-js';
import { ChaincodeEvent, CloseableAsyncIterable, connect, Contract, GatewayError, Identity, Network, Signer, signers } from '@hyperledger/fabric-gateway';
import * as crypto from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { TextDecoder } from 'util';
dotenv.config({ path: path.resolve(__dirname, '../config/.env') });
const channelName = envOrDefault('CHANNEL_NAME', 'mychannel');
const chaincodeName = envOrDefault('CHAINCODE_NAME', 'basic6');
const mspId = envOrDefault('MSP_ID', 'Org1MSP');
const pkey : any  =  process.env.PKEY;
const providerUrl = process.env.INFURA_URL;
const provider = new ethers.JsonRpcProvider(providerUrl);
const wallet = new ethers.Wallet(pkey, provider);

const contractAddress = '0x3C21539f9728550B9e23F9887B8068756AB775AB'; // To be actualised
const contractDepositETH = new ethers.Contract(contractAddress, contractABI, wallet);
// let depositor = '0xDA242f571090f25114A849F7fB3E7947D03D322e'; // Replace with the actual depositor address
// let recipient = '0xDA242f571090f25114A849F7fB3E7947D03D322e';

let ethDeposits : EthDeposit[] = []; 
let nftsDeposits :  NftDeposit[] = []; 
const executor = wallet.address;


// Path to crypto materials.
const cryptoPath = envOrDefault('CRYPTO_PATH', path.resolve(__dirname, '..', '..', '..', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com'));

// Path to user private key directory.
const keyDirectoryPath = envOrDefault('KEY_DIRECTORY_PATH', path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'keystore'));

// Path to user certificate.
const certPath = envOrDefault('CERT_PATH', path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'signcerts', 'User1@org1.example.com-cert.pem'));

// Path to peer tls certificate.
const tlsCertPath = envOrDefault('TLS_CERT_PATH', path.resolve(cryptoPath, 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt'));

// Gateway peer endpoint.
const peerEndpoint = envOrDefault('PEER_ENDPOINT', 'localhost:7051');

// Gateway peer SSL host name override.
const peerHostAlias = envOrDefault('PEER_HOST_ALIAS', 'peer0.org1.example.com');

const utf8Decoder = new TextDecoder();

// const assetId = `asset${Date.now()}`;
let contract : Contract ;

async function main(): Promise<void> {

    await displayInputParameters();

    // The gRPC client connection should be shared by all Gateway connections to this endpoint.
    const client = await newGrpcConnection();

    const gateway = connect({
        client,
        identity: await newIdentity(),
        signer: await newSigner(),
        // Default timeouts for different gRPC calls
        evaluateOptions: () => {
            return { deadline: Date.now() + 5000 }; // 5 seconds
        },
        endorseOptions: () => {
            return { deadline: Date.now() + 15000 }; // 15 seconds
        },
        submitOptions: () => {
            return { deadline: Date.now() + 5000 }; // 5 seconds
        },
        commitStatusOptions: () => {
            return { deadline: Date.now() + 60000 }; // 1 minute
        },
    });
    
    let events: CloseableAsyncIterable<ChaincodeEvent> | undefined;

    try {
        // Get a network instance representing the channel where the smart contract is deployed.
        const network = gateway.getNetwork(channelName);

        // Get the smart contract from the network.
        contract  = network.getContract(chaincodeName);

        // Listen for events emitted by subsequent transactions
        events = await startEventListening(network);

        console.log("*** Start ETH blockchain smartcontract event listening")
        contractDepositETH.on("Deposit", confirmTransferAfterETHDeposit);
        // Update an asset which does not exist.
        // await updateNonExistentAsset(contract)
    } finally {
        gateway.close();
        client.close();
    }
}

main().catch(error => {
    console.error('******** FAILED to run the application:', error);
    process.exitCode = 1;
});

async function startEventListening(network: Network): Promise<CloseableAsyncIterable<ChaincodeEvent>> {
    console.log('\n*** Start chaincode event listening');

    const events = await network.getChaincodeEvents(chaincodeName);

    void readEvents(events); // Don't await - run asynchronously
    return events;
}

async function readEvents(events: CloseableAsyncIterable<ChaincodeEvent>): Promise<void> {
    try {
        for await (const event of events) {
            const payload : any= parseJson(event.payload);
            if ( event.eventName === "DepositAsset" ) {
                console.log(`\n<-- Chaincode event received: ${event.eventName} -`, payload);
                let depositor: Depositor = {
                    depositorId: payload.actualOwner,
                    address: payload.EthAddressFrom,
                    assetId: payload.asset
                };
                let recipient: Recipient = {
                    recipientId : payload.futureOwner,
                    address: payload.ETHAddressTo,
                };
                confirmTransferAfterNftDeposit(contract, depositor, recipient);
            }
            
        }
    } catch (error: unknown) {
        // Ignore the read error when events.close() is called explicitly
        if (!(error instanceof GatewayError) || error.code !== grpc.status.CANCELLED) {
            throw error;
        }
    }
}

function parseJson(jsonBytes: Uint8Array): unknown {
    const json = utf8Decoder.decode(jsonBytes);
    return JSON.parse(json);
}

async function newGrpcConnection(): Promise<grpc.Client> {
    const tlsRootCert = await fs.readFile(tlsCertPath);
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
    return new grpc.Client(peerEndpoint, tlsCredentials, {
        'grpc.ssl_target_name_override': peerHostAlias,
    });
}

async function newIdentity(): Promise<Identity> {
    const credentials = await fs.readFile(certPath);
    return { mspId, credentials };
}

async function newSigner(): Promise<Signer> {
    const files = await fs.readdir(keyDirectoryPath);
    const keyPath = path.resolve(keyDirectoryPath, files[0]);
    const privateKeyPem = await fs.readFile(keyPath);
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    return signers.newPrivateKeySigner(privateKey);
}

/**
 * This type of transaction would typically only be run once by an application the first time it was started after its
 * initial deployment. A new version of the chaincode deployed later would likely not need to run an "init" function.
 */
async function initLedger(contract: Contract): Promise<void> {
    console.log('\n--> Submit Transaction: InitLedger, function creates the initial set of assets on the ledger');

    await contract.submitTransaction('InitLedger');

    console.log('*** Transaction committed successfully');
}

/**
 * Evaluate a transaction to query ledger state.
 */
async function getAllAssets(contract: Contract): Promise<void> {
    console.log('\n--> Evaluate Transaction: GetAllAssets, function returns all the current assets on the ledger');

    const resultBytes = await contract.evaluateTransaction('GetAllAssets');

    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);
    console.log('*** Result:', result);
}

/**
 * Submit a transaction synchronously, blocking until it has been committed to the ledger.
 */
async function createAsset(contract: Contract): Promise<void> {
    console.log('\n--> Submit Transaction: CreateAsset, creates new asset with ID, Color, Size, Owner and AppraisedValue arguments');

    await contract.submitTransaction(
        'CreateAsset',
        'asset31',
        'yellow',
        '5',
        'Tom',
        '1300',
    );

    console.log('*** Transaction committed successfully');
}

/**
 * Submit transaction asynchronously, allowing the application to process the smart contract response (e.g. update a UI)
 * while waiting for the commit notification.
 */
async function transferAssetAsync(contract: Contract, assetId : string): Promise<void> {
    console.log('\n--> Async Submit Transaction: TransferAsset, updates existing asset owner');

    const commit = await contract.submitAsync('TransferAsset', {
        arguments: [assetId, 'Saptha'],
    });
    const oldOwner = utf8Decoder.decode(commit.getResult());

    console.log(`*** Successfully submitted transaction to transfer ownership from ${oldOwner} to Saptha`);
    console.log('*** Waiting for transaction commit');

    const status = await commit.getStatus();
    if (!status.successful) {
        throw new Error(`Transaction ${status.transactionId} failed to commit with status code ${status.code}`);
    }

    console.log('*** Transaction committed successfully');
}

async function readAssetByID(contract: Contract, assetId : string): Promise<void> {
    console.log('\n--> Evaluate Transaction: ReadAsset, function returns asset attributes');

    const resultBytes = await contract.evaluateTransaction('ReadAsset', assetId);

    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);
    console.log('*** Result:', result);
}

/**
 * submitTransaction() will throw an error containing details of any error responses from the smart contract.
 */
async function updateNonExistentAsset(contract: Contract): Promise<void>{
    console.log('\n--> Submit Transaction: UpdateAsset asset70, asset70 does not exist and should return an error');

    try {
        await contract.submitTransaction(
            'UpdateAsset',
            'asset70',
            'blue',
            '5',
            'Tomoko',
            '300',
        );
        console.log('******** FAILED to return an error');
    } catch (error) {
        console.log('*** Successfully caught the error: \n', error);
    }
}

/**
 * envOrDefault() will return the value of an environment variable, or a default value if the variable is undefined.
 */
function envOrDefault(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
}

/**
 * displayInputParameters() will print the global scope parameters used by the main driver routine.
 */
async function displayInputParameters(): Promise<void> {
    console.log(`channelName:       ${channelName}`);
    console.log(`chaincodeName:     ${chaincodeName}`);
    console.log(`mspId:             ${mspId}`);
    console.log(`cryptoPath:        ${cryptoPath}`);
    console.log(`keyDirectoryPath:  ${keyDirectoryPath}`);
    console.log(`certPath:          ${certPath}`);
    console.log(`tlsCertPath:       ${tlsCertPath}`);
    console.log(`peerEndpoint:      ${peerEndpoint}`);
    console.log(`peerHostAlias:     ${peerHostAlias}`);
}
/**
 * get Ethereum address of a specific user
 **/
async function getEthereumAddress(contract: Contract, userId : string): Promise<void> {
    try{
        const resultBytes = await contract.evaluateTransaction(
        'GetEthereumAddress',
        userId,
    );
        const resultJson = utf8Decoder.decode(resultBytes);
        const result = JSON.parse(resultJson);
        console.log(`Ethereum address of user ${userId} is ${result}`);
    }
    catch(err){
        console.log(`Unable to get Ethereum address of user ${userId} !`);
    }
}

/**
 * Confirm transfer on HyperLedger Fabric
 **/
async function confirmTransfer(contract: Contract, assetId : string, newOwner : string): Promise<void> {
    await contract.submitTransaction(
    'ConfirmTransfer',
    assetId,
    newOwner,
    );
    console.log(`Transfer confirmed on Hyperledger Fabric for asset ${assetId} to ${newOwner} !`);
}

/**
 * Confirm transfer
 **/
async function confirmTransferAfterETHDeposit( depositor : any, recipient : any, value : any, event : any) {
    // On a l'adresse de dépot et l'adresse recipiente
    // On check dans la liste des dépots de NFT si il y en a un correspondant
    for (let nftdeposit of nftsDeposits) {
        if (nftsDeposits.length != 0 && nftdeposit.recipient.address == depositor && nftdeposit.deposit.address == recipient) {
            console.log(`Confirming transfer: executor=${executor}, depositor=${depositor}, recipient=${recipient}`);
            // Confirme le transfert sur Ethereum
            let txTransferETH;
            try {
                txTransferETH = await contractDepositETH.confirm(depositor, recipient );
                await txTransferETH.wait(); // On attend la confirmation 
            }
            catch(err){
                console.log(err);
                console.log(`\nUnable to confirm transfer on ethereum\nTransfer still in logs and can be reverted\nFrom ${depositor} to ${recipient}`);
                return;
            }
            try {
                // On confirm le transfert d'un asset déposé sur le smart contract d'Hyperledger Fabric
                await confirmTransfer(contract, nftdeposit.deposit.assetId, nftdeposit.recipient.recipientId);
            }
            catch(err){
                console.log(err);
                console.log(`\nUnable to confirm transfer check trace for\n${nftdeposit.deposit.assetId} to ${nftdeposit.recipient.recipientId} !`);
                return;
            }

            //On supprime le dépot de la liste des dépots de NFT
            let index = nftsDeposits.indexOf(nftdeposit);

            if (index !== -1) {
                nftsDeposits.splice(index, 1);
            }

            // On vérifie le nouveau ledger, que dans le cadre du dev donc commenté 
            // await getAllAssets(contract);

            console.log(`Transaction hash on ethereum: ${txTransferETH.hash}`); // Exemple de log les transfers
            console.log("Transfer has been done") 
            return;
        }
    }
    // On ajoute le dépot à la liste des dépot de Eth et tant que l'on a pas de dépot d'Nft correspondant on ne fait rien. 
    let ethDeposit : EthDeposit = {
        depositorAddress : depositor,
        recipientAddress : recipient,
    }
    ethDeposits.push(ethDeposit);
    console.log(`Transfer has not been done, because Nft deposit not found for those addresses:\n from ${depositor}\n to ${recipient}\nDeposit is waiting`)
}

/**
 * Confirm transfer
 **/
async function confirmTransferAfterNftDeposit(contract: Contract, depositor : Depositor, recipient : Recipient) {
    // On a l'adresse de dépot et l'adresse recipiente
    // On check dans la liste des dépots de ETH si il y en a un correspondant

    for (let ethdeposit of ethDeposits) {
        if (ethDeposits.length != 0 && ethdeposit.depositorAddress == recipient.address && ethdeposit.recipientAddress == depositor.address) {
            console.log(`Confirming transfer: executor=${executor}, depositor=${depositor}, recipient=${recipient}`);
            
            let txTransferETH;
            try {
                // On confirme le transfert sur Ethereum
                txTransferETH = await contractDepositETH.confirm(ethdeposit.depositorAddress, ethdeposit.recipientAddress);
                await txTransferETH.wait(); // On attend pour la confirmation du transfert avant toute chose
            }
            catch(err){
                console.log(err);
                console.log(`\nUnable to confirm transfer on ethereum\nTransfer still in logs and can be reverted\nFrom ${ethdeposit.depositorAddress} to ${ethdeposit.recipientAddress}`);
                return;
            }
            try {
                // On confirme le transfert d'un asset déposé sur le smart contract d'Hyperledger Fabric
                await confirmTransfer(contract, depositor.assetId, recipient.recipientId);
            }
            catch(err){
                console.log(err);
                console.log(`\nUnable to confirm transfer check trace for\n${depositor.assetId} to ${recipient.recipientId} !`);
                return;
            }
            // On vérifie le nouveau ledger, que dans le cadre du dev donc commenté 
            // await getAllAssets(contract);

            //On retire le dépot d'Eth de la liste des dépots en attente
            let index = ethDeposits.indexOf(ethdeposit);

            if (index !== -1) {
                ethDeposits.splice(index, 1);
            }
            console.log(`Transaction hash on ethereum: ${txTransferETH.hash}`); // Exemple de log les transfers
            console.log("\nTransfer has been done\n");
            return;
        }
    }
    // On ajoute le dépot à la liste des dépot de nft et tant que l'on a pas de dépot d'Eth correspondant on ne fait rien. 
    let nftdDeposit : NftDeposit = {
        deposit : depositor,
        recipient : recipient,
    }
    nftsDeposits.push(nftdDeposit);
    console.log(`Transfer has not been done, because ETH deposit not found for those addresses:\n from ${depositor.address}\n to ${recipient.address}\nDeposit is waiting`)
}

