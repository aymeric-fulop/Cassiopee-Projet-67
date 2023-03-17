// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "openzeppelin-contracts/contracts/token/ERC721/IERC721.sol";
import "openzeppelin-contracts/contracts/utils/Address.sol";

contract NFT_Transfer {
    using Address for address;

    //create an object to store tranfer in pending
    struct PendingTransfer {
        address sender;
        address recipient;
        address nftContract;
        uint256 tokenId;
    }

    //to store transfer in pending
    mapping(bytes32 => PendingTransfer) public pendingTransfers;

    //function put a transfer into pending, requesting the confirmation
    function Request(address nftContract, uint256 tokenId, address recipient) external returns (bytes32) {
        //sender needs to own the nft
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "ERC721Transfer: sender does not own token");
        //recipient should not be a contract address
        require(!recipient.isContract(), "ERC721Transfer: recipient cannot be a contract");

        //retrieve the abi of the transfer ID
        bytes32 transferId = keccak256(abi.encodePacked(msg.sender, recipient, nftContract, tokenId));
        PendingTransfer memory transfer = PendingTransfer(msg.sender, recipient, nftContract, tokenId);
        pendingTransfers[transferId] = transfer;
        return transferId;
    }

    //function that will perform the transaction, previously locked
    function Confirm(bytes32 transferId) external {
        //retrieve all the informations of the pending transfer
        PendingTransfer memory transfer = pendingTransfers[transferId];
        //sender needs to match
        require(transfer.sender == msg.sender, "ERC721Transfer: sender does not match original request");
        //recipient needs to match
        require(transfer.recipient != address(0), "ERC721Transfer: invalid recipient address");
        //sender needs to own the nft
        require(IERC721(transfer.nftContract).ownerOf(transfer.tokenId) == transfer.sender, "ERC721Transfer: sender does not own token");
        //delete pending informations after the transfer process
        delete pendingTransfers[transferId];
        //proceeds the transfer between the sender and the recipient
        IERC721(transfer.nftContract).transferFrom(transfer.sender, transfer.recipient, transfer.tokenId);
    }
}