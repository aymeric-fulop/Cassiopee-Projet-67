// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../lib/openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import "../lib/openzeppelin-contracts/contracts/utils/Counters.sol";

//The purpose of this smart contract is to implement basic NFT to test nft_transfer.sol on Hyperledger Fabric

contract MyNFT is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    uint256 public constant MAX_NFTS = 100;

    constructor() ERC721("MyNFT", "MNFT") {}

    function mint(address recipient) public returns (uint256) {
        require(_tokenIds.current() < MAX_NFTS, "Maximum number of NFTs reached");

        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(recipient, newItemId);

        return newItemId;
    }
}
