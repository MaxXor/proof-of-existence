pragma solidity ^0.5.10;

contract Documents {

    struct Document {
        address submitter;
        bytes32 hash;
        uint blockNumber;
        bool exists;
    }

    mapping(bytes32 => Document) public documents;

    function addDocument(bytes32 hash) external {
        require(!documents[hash].exists);
        documents[hash] = Document(msg.sender, hash, block.number, true);
    }
}
