// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../lib/openzeppelin-contracts/contracts/token/ERC721/IERC721.sol";
import "../lib/openzeppelin-contracts/contracts/utils/Address.sol";

contract NFT_Transfer {
    using Address for address;

    event TransferOwnership(address indexed admin);

    // Define roles
    address public admin;
    mapping(address => bool) public executors;

    constructor() {
        admin = msg.sender;
    }

    // Modifier to restrict access to admin only
    modifier onlyAdmin() {
        require(msg.sender == admin, "Access denied. Only the admin can call this function.");
        _;
    }
    
    // Modifier to restrict access to executors only
    modifier onlyExecutor() {
        require(executors[msg.sender] == true, "Access denied. Only executors can call this function.");
        _;
    }

    // Function to add an executor
    function addExecutor(address _executor) external onlyAdmin {
        executors[_executor] = true;
    }
    
    // Function to remove an executor
    function removeExecutor(address _executor) external onlyAdmin {
        executors[_executor] = false;
    }

    function transferOwnership(address _admin) external {
        admin = _admin;
        emit TransferOwnership(_admin);
    }

    
    // Mapping pour stocker un UserDeposit pour chaque depositId
    mapping(bytes32 => UserDeposit) public userDeposits;

    // La structure UserDeposit pour stocker des informations sur les NFT déposés
    struct UserDeposit {
        address nftContract;
        uint256 tokenId;
        address sender;
    }

    // Fonction permettant à quiconque de déposer un NFT dans le contrat sans spécifier de destinataire
    function Deposit(address nftContract, uint256 tokenId) external {
        // Le déposant doit posséder le NFT
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "ERC721Transfer: sender does not own token");

        // Transférer le NFT au contrat
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

        // Enregistrer le dépôt
        bytes32 depositId = keccak256(abi.encodePacked(msg.sender, nftContract, tokenId));
        userDeposits[depositId] = UserDeposit(nftContract, tokenId, msg.sender);
    }

    // Fonction permettant aux Executors de spécifier un destinataire et d'effectuer le transfert du NFT stocké dans le contrat
    function Confirm(bytes32 depositId, address recipient) external onlyExecutor {
        // Récupérer les informations sur le dépôt en attente
        UserDeposit memory deposit = userDeposits[depositId];

        // Le contrat doit posséder le NFT
        require(IERC721(deposit.nftContract).ownerOf(deposit.tokenId) == address(this), "ERC721Transfer: contract does not own token");

        // Le destinataire ne doit pas être une adresse de contrat
        require(!recipient.isContract(), "ERC721Transfer: recipient cannot be a contract");

        // Supprimer les informations sur le dépôt après le processus de transfert
        delete userDeposits[depositId];

        // Effectuer le transfert entre le contrat et le destinataire
        IERC721(deposit.nftContract).transferFrom(address(this), recipient, deposit.tokenId);
    }

    // Fonction permettant aux utilisateurs de récupérer leur NFT stocké dans le contrat
    function Revert(bytes32 depositId) external {
        // Récupérer les informations sur le dépôt en attente
        UserDeposit memory deposit = userDeposits[depositId];

        // Le déposant doit correspondre
        require(deposit.sender == msg.sender, "ERC721Transfer: sender does not match original depositor");

        // Le contrat doit posséder le NFT
        require(IERC721(deposit.nftContract).ownerOf(deposit.tokenId) == address(this), "ERC721Transfer: contract does not own token");

        // Supprimer les informations sur le dépôt après le processus de récupération
        delete userDeposits[depositId];

        // Effectuer le transfert entre le contrat et le déposant
        IERC721(deposit.nftContract).transferFrom(address(this), deposit.sender, deposit.tokenId);
    }
}