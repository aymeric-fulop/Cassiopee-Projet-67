export type Depositor = {
    depositorId : string,
    address : string,
    assetId : string,
}

export type Recipient = {
    recipientId : string,
    address : string,
}

export type EthDeposit = {
    depositorAddress : string,
    recipientAddress : string,
}

export type NftDeposit = {
    deposit : Depositor,
    recipient : Recipient,
}