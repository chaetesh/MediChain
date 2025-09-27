// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title MediChain
 * @dev Smart contract for secure medical record management on blockchain
 */
contract MediChain is Ownable {
    struct Record {
        address patientAddress;
        string ipfsHash;
        string recordHash;
        uint256 timestamp;
    }

    struct Access {
        bool hasAccess;
        uint256 expirationTime;
    }

    // Mapping from recordId to Record
    mapping(string => Record) private records;

    // Mapping from patientAddress to recordId to address to Access
    mapping(address => mapping(string => mapping(address => Access))) private accessControl;

    // Events
    event RecordStored(address indexed patientAddress, string recordId, string ipfsHash, uint256 timestamp);
    event AccessGranted(address indexed patientAddress, address indexed to, string recordId, uint256 expirationTime);
    event AccessRevoked(address indexed patientAddress, address indexed from, string recordId);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Store a new medical record hash
     * @param patientAddress Address of the patient who owns the record
     * @param recordId Unique identifier for the record
     * @param ipfsHash IPFS hash where the encrypted record is stored
     * @param recordHash Hash of the record content for verification
     */
    function storeRecordHash(
        address patientAddress,
        string calldata recordId,
        string calldata ipfsHash,
        string calldata recordHash
    ) external {
        // Only patient or system can store records
        require(
            msg.sender == patientAddress || owner() == msg.sender,
            "Not authorized to store record"
        );

        // Ensure the record doesn't already exist
        require(
            records[recordId].timestamp == 0,
            "Record already exists"
        );

        // Store the record
        records[recordId] = Record({
            patientAddress: patientAddress,
            ipfsHash: ipfsHash,
            recordHash: recordHash,
            timestamp: block.timestamp
        });

        // The patient automatically has access to their own records
        accessControl[patientAddress][recordId][patientAddress] = Access({
            hasAccess: true,
            expirationTime: type(uint256).max // Never expires for the patient
        });

        emit RecordStored(patientAddress, recordId, ipfsHash, block.timestamp);
    }

    /**
     * @dev Verify if a record hash matches what's stored on the blockchain
     * @param recordId Record ID to verify
     * @param recordHash Hash to verify against blockchain
     * @return bool True if the record matches
     */
    function verifyRecord(
        string calldata recordId,
        string calldata recordHash
    ) external view returns (bool) {
        return keccak256(abi.encodePacked(records[recordId].recordHash)) == 
               keccak256(abi.encodePacked(recordHash));
    }

    /**
     * @dev Get record information from the blockchain
     * @param recordId Record ID to retrieve
     * @return patientAddress Address of the patient who owns the record
     * @return ipfsHash IPFS hash where the encrypted record is stored
     * @return recordHash Hash of the record content for verification
     * @return timestamp Time when the record was stored
     */
    function getRecordInfo(
        string calldata recordId
    ) external view returns (
        address patientAddress,
        string memory ipfsHash,
        string memory recordHash,
        uint256 timestamp
    ) {
        Record memory record = records[recordId];
        
        // Ensure record exists
        require(record.timestamp > 0, "Record does not exist");
        
        return (
            record.patientAddress,
            record.ipfsHash,
            record.recordHash,
            record.timestamp
        );
    }

    /**
     * @dev Grant access to a record for a specific address
     * @param to Address to grant access to
     * @param recordId Record ID
     * @param expirationTime Unix timestamp when access expires
     */
    function grantAccess(
        address to,
        string calldata recordId,
        uint256 expirationTime
    ) external {
        Record memory record = records[recordId];
        
        // Ensure record exists
        require(record.timestamp > 0, "Record does not exist");
        
        // Only the patient can grant access to their records
        require(
            msg.sender == record.patientAddress,
            "Only the patient can grant access"
        );
        
        // Cannot grant access to oneself (patient already has access)
        require(to != record.patientAddress, "Patient already has access");
        
        // Ensure expiration time is in the future
        require(
            expirationTime > block.timestamp,
            "Expiration time must be in the future"
        );
        
        accessControl[record.patientAddress][recordId][to] = Access({
            hasAccess: true,
            expirationTime: expirationTime
        });
        
        emit AccessGranted(record.patientAddress, to, recordId, expirationTime);
    }

    /**
     * @dev Revoke access to a record for a specific address
     * @param from Address to revoke access from
     * @param recordId Record ID
     */
    function revokeAccess(
        address from,
        string calldata recordId
    ) external {
        Record memory record = records[recordId];
        
        // Ensure record exists
        require(record.timestamp > 0, "Record does not exist");
        
        // Only the patient can revoke access to their records
        require(
            msg.sender == record.patientAddress,
            "Only the patient can revoke access"
        );
        
        // Cannot revoke access from oneself (patient must always have access)
        require(from != record.patientAddress, "Cannot revoke patient's access");
        
        // Delete the access entry
        delete accessControl[record.patientAddress][recordId][from];
        
        emit AccessRevoked(record.patientAddress, from, recordId);
    }

    /**
     * @dev Check if an address has access to a patient's record
     * @param requestor Address requesting access
     * @param patientAddress Patient's address
     * @param recordId Record ID
     * @return bool True if the requestor has access
     */
    function checkAccess(
        address requestor,
        address patientAddress,
        string calldata recordId
    ) external view returns (bool) {
        // The patient and contract owner always have access
        if (requestor == patientAddress || requestor == owner()) {
            return true;
        }
        
        Access memory access = accessControl[patientAddress][recordId][requestor];
        
        // Check if access is granted and not expired
        return access.hasAccess && access.expirationTime > block.timestamp;
    }
}
