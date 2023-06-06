/*
 * SPDX-License-Identifier: Apache-2.0
 */
// Deterministic JSON.stringify()
import {Context, Contract, Info, Returns, Transaction} from 'fabric-contract-api';
import stringify from 'json-stringify-deterministic';
import sortKeysRecursive from 'sort-keys-recursive';
import {Asset, UserEthereumMapping} from './asset';
import {AssetStatus} from './types';

@Info({title: 'AssetTransfer', description: 'Smart contract for trading assets'})
export class AssetTransferContract extends Contract {
    
    // A way to validate the fact that it is the rigth user that trade it's own asset is to 
    // Link the id of the user to a ssh key in the chaincode state.
    // This idea could be implemented in the future.

    // A user should specify the value of the asset he wants to trade.
    // This idea could be implemented in the future.
    @Transaction()
    public async CreateUser(ctx: Context, userId: string, ethereumAddress: string): Promise<void> {

        const userJSON = await ctx.stub.getState(userId);
        if (userJSON.length !== 0) {
            throw new Error(`The user ${userId} already exist !`);
        }
        const mapping: UserEthereumMapping = { userId, ethereumAddress };
        await ctx.stub.putState(userId, Buffer.from(JSON.stringify(mapping)));
    }

    // CreateAsset issues a new asset to the world state with given details.
    @Transaction()
    public async CreateAsset(ctx: Context, id: string, color: string, size: number, appraisedValue: number, owner: string): Promise<void> {
        await this.checkUserExistence(ctx, owner);
        const exists = await this.AssetExists(ctx, id);
        if (exists) {
            throw new Error(`The asset ${id} already exists`);
        }

        const asset = {
            ID: id,
            Color: color,
            Size: size,
            Owner: owner,
            AppraisedValue: appraisedValue,
            Status : 'owned',
        };
        const assetBuffer = Buffer.from(stringify(sortKeysRecursive(asset)));

		ctx.stub.setEvent('CreateAsset', assetBuffer);
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, assetBuffer);
    }

    // ReadAsset returns the asset stored in the world state with given id.
    @Transaction(false)
    public async ReadAsset(ctx: Context, id: string): Promise<string> {
        const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return assetJSON.toString();
    }

    // UpdateAsset updates an existing asset in the world state with provided parameters.
    @Transaction()
    public async UpdateAsset(ctx: Context, id: string, color: string, size: number, owner: string, appraisedValue: number): Promise<void> {
        await this.checkUserExistence(ctx, owner);
        let asset = await this.checkAssetStatus(ctx, id, 'owned');
        const updatedAsset = {
            ID: id,
            Color: color,
            Size: size,
            Owner: owner,
            AppraisedValue: appraisedValue,
            Status : 'owned',
        };
        const assetBuffer = Buffer.from(stringify(sortKeysRecursive(asset)));

		ctx.stub.setEvent('UpdateAsset', assetBuffer);
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        return ctx.stub.putState(id, assetBuffer);
    }

    // DeleteAsset deletes an given asset from the world state.
    @Transaction()
    public async DeleteAsset(ctx: Context, id: string): Promise<void> {
        await this.checkAssetStatus(ctx, id, 'owned');
        return ctx.stub.deleteState(id);
    }

    // TransferAsset updates the owner field of asset with given id in the world state, and returns the old owner.
    @Transaction()
    public async TransferAsset(ctx: Context, id: string, newOwner: string): Promise<string> {
        await this.checkUserExistence(ctx, newOwner);
        let asset = await this.checkAssetStatus(ctx, id, 'owned');
        const oldOwner = asset.Owner;
        asset.Owner = newOwner;

        const assetBuffer = Buffer.from(stringify(sortKeysRecursive(asset)));
		ctx.stub.setEvent('TransferAsset', assetBuffer);
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, assetBuffer);
        return oldOwner;
    }

    // GetAllAssets returns all assets found in the world state.
    @Transaction(false)
    @Returns('string')
    public async GetAllAssets(ctx: Context): Promise<string> {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
    
    // Déposer un asset
    @Transaction()
    async DepositAsset(ctx: Context, id: string, futureOwner : string) : Promise<void> {
        await this.checkUserExistence(ctx, futureOwner);
        
        const EthAddressTo = await this.GetEthereumAddress(ctx, futureOwner);
        const asset = await this.checkAssetStatus(ctx, id, 'owned');
        const EthAddressFrom = await this.GetEthereumAddress(ctx, asset.Owner);
        asset.Status = 'deposited';
        const assetBuffer = Buffer.from(stringify(sortKeysRecursive(asset)));
        const depositEvent = {
            asset: id,
            actualOwner : asset.Owner,
            futureOwner: futureOwner,
            EthAddressFrom : EthAddressFrom,
            ETHAddressTo : EthAddressTo,
        };
		ctx.stub.setEvent('DepositAsset', Buffer.from(JSON.stringify(depositEvent)));
        return ctx.stub.putState(id, assetBuffer);
    }

    // Confirmer le transfert d'un asset déposé
    @Transaction()
    async ConfirmTransfer(ctx: Context, id: string, newOwner : string) : Promise<void> {
        let asset = await this.checkAssetStatus(ctx, id, 'deposited');
        asset.Owner = newOwner;
        asset.Status = 'owned';
        const assetBuffer = Buffer.from(stringify(sortKeysRecursive(asset)));
		ctx.stub.setEvent('TransferAsset', assetBuffer);
		ctx.stub.setEvent('ConfirmTransfer', assetBuffer);
        return ctx.stub.putState(id, assetBuffer);
    }

    // Annuler un dépôt
    @Transaction()
    public async RevertDepot(ctx: Context, id: string): Promise<void> {
        let asset = await this.checkAssetStatus(ctx, id, 'deposited');
        asset.Status = 'owned';
        const assetBuffer = Buffer.from(stringify(sortKeysRecursive(asset)));
		ctx.stub.setEvent('RevertDepot', assetBuffer);
        return ctx.stub.putState(id, assetBuffer);
    }

    // Récupérer le dépôt d'un utilisateur
    @Transaction(false)
    public async GetUserDeposit(ctx: Context, owner: string): Promise<string> {
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            if(record.Owner === owner && record.Status === 'deposited'){
                return JSON.stringify(record);
            }
            result = await iterator.next();
        }
        throw new Error(`No deposit found for owner ${owner}`);
    }


    // AssetExists returns true when asset with given ID exists in world state.
    @Transaction(false)
    @Returns('boolean')
    public async AssetExists(ctx: Context, id: string): Promise<boolean> {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }
    //CheckAssetStatus returns the asset if it exists and if it has the right status
    @Transaction(false)
    @Returns('any')
    private async checkAssetStatus(ctx: Context, id: string, status : AssetStatus) : Promise<any> {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        const assetString = await this.ReadAsset(ctx, id);
        const asset = JSON.parse(assetString);
        
        if (asset.Status !== status) {
            throw new Error(`The asset ${id} is not ${status}`);
        }

        return asset;
    }

    // Get Ethereum address
    @Transaction(false)
    @Returns('string')
    public async GetEthereumAddress(ctx: Context, userId: string): Promise<string> {
        const mappingJSON = await ctx.stub.getState(userId);
        if (!mappingJSON || mappingJSON.length === 0) {
            throw new Error(`Ethereum address for the user ${userId} is not registered`);
        }
        const mapping: UserEthereumMapping = JSON.parse(mappingJSON.toString());
        return mapping.ethereumAddress;
    }

    //Check if user exists
    @Transaction(false)
    private async checkUserExistence(ctx: Context, userId: string): Promise<void> {
        const userJSON = await ctx.stub.getState(userId);
        if (!userJSON || userJSON.length === 0) {
            throw new Error(`The user ${userId} does not exist you should add it to the chaincode first`);
        }
        return;
    }
}
