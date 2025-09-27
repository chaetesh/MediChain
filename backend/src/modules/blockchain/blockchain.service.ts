import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

// ABI for MediChain Smart Contract
const MEDICHAIN_ABI = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    name: 'OwnableInvalidOwner',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'OwnableUnauthorizedAccount',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'patientAddress',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'recordId',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'expirationTime',
        type: 'uint256',
      },
    ],
    name: 'AccessGranted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'patientAddress',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'recordId',
        type: 'string',
      },
    ],
    name: 'AccessRevoked',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'patientAddress',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'recordId',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'ipfsHash',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    name: 'RecordStored',
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'requestor',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'patientAddress',
        type: 'address',
      },
      {
        internalType: 'string',
        name: 'recordId',
        type: 'string',
      },
    ],
    name: 'checkAccess',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'recordId',
        type: 'string',
      },
    ],
    name: 'getRecordInfo',
    outputs: [
      {
        internalType: 'address',
        name: 'patientAddress',
        type: 'address',
      },
      {
        internalType: 'string',
        name: 'ipfsHash',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'recordHash',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        internalType: 'string',
        name: 'recordId',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: 'expirationTime',
        type: 'uint256',
      },
    ],
    name: 'grantAccess',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        internalType: 'string',
        name: 'recordId',
        type: 'string',
      },
    ],
    name: 'revokeAccess',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'patientAddress',
        type: 'address',
      },
      {
        internalType: 'string',
        name: 'recordId',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'ipfsHash',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'recordHash',
        type: 'string',
      },
    ],
    name: 'storeRecordHash',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'recordId',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'recordHash',
        type: 'string',
      },
    ],
    name: 'verifyRecord',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  private readonly provider: ethers.JsonRpcProvider;
  private readonly contract: ethers.Contract;
  private readonly wallet: ethers.Wallet;

  constructor(private readonly configService: ConfigService) {
    // Initialize provider
    const rpcUrl = this.configService.get<string>('POLYGON_RPC_URL');
    if (!rpcUrl) {
      throw new Error('POLYGON_RPC_URL is not defined');
    }
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    // Initialize wallet
    const privateKey = this.configService.get<string>('POLYGON_PRIVATE_KEY');
    if (!privateKey) {
      throw new Error('POLYGON_PRIVATE_KEY is not defined');
    }
    this.wallet = new ethers.Wallet(privateKey, this.provider);

    // Initialize contract
    const contractAddress = this.configService.get<string>(
      'POLYGON_CONTRACT_ADDRESS',
    );
    if (!contractAddress) {
      throw new Error('POLYGON_CONTRACT_ADDRESS is not defined');
    }
    this.contract = new ethers.Contract(
      contractAddress,
      MEDICHAIN_ABI,
      this.wallet,
    );

    this.logger.log('Blockchain service initialized with Polygon network');

    // Get network information
    this.provider
      .getNetwork()
      .then((network) => {
        this.logger.log(
          `Connected to network: ${network.name} (Chain ID: ${network.chainId})`,
        );
      })
      .catch((error) => {
        this.logger.warn(`Could not get network details: ${error.message}`);
      });
  }

  /**
   * Helper method to ensure an address is properly formatted
   * @param address Ethereum address to normalize
   */
  private normalizeAddress(address: string): string {
    try {
      // Check if the address already starts with '0x'
      if (!address.startsWith('0x')) {
        address = '0x' + address;
      }

      // Ensure it's a valid address format
      return ethers.getAddress(address);
    } catch (error) {
      this.logger.error(`Invalid Ethereum address: ${address}`);
      throw new Error('Invalid blockchain address format');
    }
  }

  /**
   * Store a record hash on the blockchain
   * @param patientAddress - Patient's blockchain address
   * @param recordId - Unique identifier for the record
   * @param ipfsHash - IPFS hash where the encrypted record is stored
   * @param recordHash - Hash of the record content for verification
   */
  async storeRecordHash(
    patientAddress: string,
    recordId: string,
    ipfsHash: string,
    recordHash: string,
  ): Promise<string> {
    try {
      // Normalize the patient address to ensure it's in the correct format
      const normalizedAddress = this.normalizeAddress(patientAddress);

      this.logger.log(
        `Storing record hash for patient ${normalizedAddress}, record ID: ${recordId}`,
      );

      // Call the smart contract function with normalized address
      // The contract is already connected with the wallet in the constructor
      // Let's use it directly
      const tx = await this.contract.storeRecordHash(
        normalizedAddress,
        recordId,
        ipfsHash,
        recordHash,
        { gasLimit: 500000 }, // Add explicit gas limit to prevent estimation issues
      );

      this.logger.log(`Transaction sent, waiting for confirmation...`);
      // Wait for transaction and log the hash from the transaction itself as backup
      this.logger.log(`Transaction hash before confirmation: ${tx.hash}`);

      const receipt = await tx.wait();

      // Extract transaction hash using our helper
      const transactionHash = this.getTransactionHashFromReceipt(receipt, tx);

      this.logger.log(
        `Record hash stored on blockchain: ${recordId}, tx hash: ${transactionHash}`,
      );
      return transactionHash;
    } catch (error) {
      throw this.handleBlockchainError(error, 'record storage');
    }
  }

  /**
   * Verify if a record hash matches what's stored on the blockchain
   * @param recordId - Record ID to verify
   * @param recordHash - Hash to verify against blockchain
   */
  async verifyRecord(recordId: string, recordHash: string): Promise<boolean> {
    try {
      return await this.contract.verifyRecord(recordId, recordHash);
    } catch (error) {
      this.logger.error(`Failed to verify record ${recordId}`, error.stack);
      throw new Error('Blockchain verification failed');
    }
  }

  /**
   * Get record information from the blockchain
   * @param recordId - Record ID to retrieve
   */
  async getRecordInfo(recordId: string): Promise<{
    patientAddress: string;
    ipfsHash: string;
    recordHash: string;
    timestamp: Date;
  }> {
    try {
      const [patientAddress, ipfsHash, recordHash, timestamp] =
        await this.contract.getRecordInfo(recordId);

      return {
        patientAddress,
        ipfsHash,
        recordHash,
        timestamp: new Date(Number(timestamp) * 1000),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get record info for ${recordId}`,
        error.stack,
      );
      throw new Error('Failed to retrieve blockchain record');
    }
  }

  /**
   * Grant access to a record for a specific address
   * @param to - Address to grant access to
   * @param recordId - Record ID
   * @param expirationTime - Unix timestamp when access expires
   */
  async grantAccess(
    to: string,
    recordId: string,
    expirationTime: number,
  ): Promise<string> {
    try {
      // Normalize the address
      const normalizedAddress = this.normalizeAddress(to);

      const tx = await this.contract.grantAccess(
        normalizedAddress,
        recordId,
        expirationTime,
        { gasLimit: 300000 },
      );

      // Log the transaction hash before waiting for confirmation
      this.logger.log(`Grant access transaction submitted, hash: ${tx.hash}`);

      const receipt = await tx.wait();

      // Extract transaction hash using our helper
      const transactionHash = this.getTransactionHashFromReceipt(receipt, tx);

      this.logger.log(
        `Access granted for record ${recordId} to ${normalizedAddress}`,
      );
      return transactionHash;
    } catch (error) {
      throw this.handleBlockchainError(
        error,
        `grant access for record ${recordId}`,
      );
    }
  }

  /**
   * Revoke access to a record for a specific address
   * @param from - Address to revoke access from
   * @param recordId - Record ID
   */
  async revokeAccess(from: string, recordId: string): Promise<string> {
    try {
      // Normalize the address
      const normalizedAddress = this.normalizeAddress(from);

      const tx = await this.contract.revokeAccess(normalizedAddress, recordId, {
        gasLimit: 300000,
      });

      // Log the transaction hash before waiting for confirmation
      this.logger.log(`Revoke access transaction submitted, hash: ${tx.hash}`);

      const receipt = await tx.wait();

      // Extract transaction hash using our helper
      const transactionHash = this.getTransactionHashFromReceipt(receipt, tx);

      this.logger.log(
        `Access revoked for record ${recordId} from ${normalizedAddress}`,
      );
      return transactionHash;
    } catch (error) {
      throw this.handleBlockchainError(
        error,
        `revoke access for record ${recordId}`,
      );
    }
  }

  /**
   * Check if an address has access to a patient's record
   * @param requestor - Address requesting access
   * @param patientAddress - Patient's address
   * @param recordId - Record ID
   */
  async checkAccess(
    requestor: string,
    patientAddress: string,
    recordId: string,
  ): Promise<boolean> {
    try {
      // Normalize both addresses
      const normalizedRequestor = this.normalizeAddress(requestor);
      const normalizedPatient = this.normalizeAddress(patientAddress);

      return await this.contract.checkAccess(
        normalizedRequestor,
        normalizedPatient,
        recordId,
      );
    } catch (error) {
      throw this.handleBlockchainError(
        error,
        `check access for record ${recordId}`,
      );
    }
  }

  /**
   * Test the blockchain connection
   * @returns Connection status information
   */
  async testConnection(): Promise<{
    connected: boolean;
    network: string;
    chainId: string;
    blockNumber: number;
    contractAddress: string;
    walletAddress: string;
    walletBalance: string;
  }> {
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      const contractAddress = await this.contract.getAddress();
      const walletAddress = await this.wallet.getAddress();
      const balance = await this.provider.getBalance(walletAddress);

      return {
        connected: true,
        network: network.name,
        chainId: network.chainId.toString(),
        blockNumber,
        contractAddress,
        walletAddress,
        walletBalance: ethers.formatEther(balance) + ' ETH',
      };
    } catch (error) {
      this.logger.error(
        `Blockchain connection test failed: ${error.message}`,
        error.stack,
      );
      return {
        connected: false,
        network: 'Unknown',
        chainId: 'Unknown',
        blockNumber: 0,
        contractAddress: 'Unknown',
        walletAddress: 'Unknown',
        walletBalance: '0 ETH',
      };
    }
  }

  /**
   * Send a test transaction to diagnose transaction receipt structure issues
   * @returns Detailed information about the transaction and receipt
   */
  async sendDiagnosticTransaction(): Promise<any> {
    try {
      // Create a simple transaction (calling the owner function)
      this.logger.log(`Sending diagnostic transaction...`);
      const tx = await this.contract.owner();

      this.logger.log(`Diagnostic transaction sent with hash: ${tx.hash}`);

      // Wait for receipt
      const receipt = await tx.wait();

      // Extract transaction hash using our helper
      const transactionHash = this.getTransactionHashFromReceipt(receipt, tx);

      // Return detailed diagnostics
      return {
        success: true,
        originalTxHash: tx.hash,
        extractedHash: transactionHash,
        receiptStructure: {
          directHash: receipt?.hash,
          transactionHash: receipt?.transactionHash,
          receiptKeys: receipt ? Object.keys(receipt) : [],
          hasTransactionObject: !!receipt?.transaction,
          rawReceipt: receipt,
        },
      };
    } catch (error) {
      this.logger.error(`Diagnostic transaction failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        errorType: typeof error,
        errorKeys: Object.keys(error),
        errorData: error.data || null,
      };
    }
  }

  /**
   * Helper method to safely extract transaction hash from receipt
   * @param receipt Transaction receipt from ethers.js
   * @param tx Original transaction
   */
  private getTransactionHashFromReceipt(receipt: any, tx: any): string {
    // Log the structure of the receipt for debugging
    try {
      this.logger.debug(
        `Receipt structure: ${JSON.stringify(
          {
            receiptKeys: receipt ? Object.keys(receipt) : [],
            receiptType: receipt ? typeof receipt : 'undefined',
            txType: tx ? typeof tx : 'undefined',
            txHash: tx?.hash,
          },
          null,
          2,
        )}`,
      );

      // In ethers.js v6, the transaction hash might be in different locations
      // depending on network and provider implementations

      // First try with the standard properties
      if (receipt?.hash) return receipt.hash;
      if (receipt?.transactionHash) return receipt.transactionHash;

      // If the receipt has a transaction property
      if (receipt?.transaction?.hash) return receipt.transaction.hash;

      // Try accessing as array if receipt looks like an array response
      if (Array.isArray(receipt) && receipt[0]?.hash) return receipt[0].hash;

      // Fall back to the original transaction's hash
      if (tx?.hash) return tx.hash;

      // Check if receipt is actually the hash itself (some providers might return just the hash)
      if (typeof receipt === 'string' && receipt.startsWith('0x'))
        return receipt;

      // Log a detailed warning for debugging
      this.logger.warn(
        `Could not extract transaction hash from receipt: ${JSON.stringify(receipt)}`,
      );

      // If we can't find a hash, generate a temporary identifier
      return `pending-${Date.now()}`;
    } catch (error) {
      this.logger.error(`Error extracting transaction hash: ${error.message}`);
      return tx?.hash || `pending-${Date.now()}`;
    }
  }

  /**
   * Helper method to analyze and log blockchain errors
   * @param error The error that occurred
   * @param operation The operation that was being performed
   * @returns A standardized error message
   */
  private handleBlockchainError(error: any, operation: string): Error {
    // Extract the most useful information from the error
    const errorMessage = error.message || 'Unknown error';
    const errorCode = error.code || 'UNKNOWN';
    const errorData = error.data || {};

    // Log detailed error information
    this.logger.error(`Blockchain ${operation} failed: ${errorMessage}`, {
      code: errorCode,
      data: errorData,
      stack: error.stack,
    });

    // Check for specific error types
    if (errorMessage.includes('insufficient funds')) {
      return new Error(
        `Blockchain transaction failed: Insufficient funds for gas`,
      );
    }

    if (errorMessage.includes('nonce')) {
      return new Error(
        `Blockchain transaction failed: Nonce issue - try again`,
      );
    }

    if (errorMessage.includes('gas')) {
      return new Error(
        `Blockchain transaction failed: Gas estimation or limit issue`,
      );
    }

    // Default error message
    return new Error(`Blockchain transaction failed: ${errorMessage}`);
  }

  /**
   * Get the status of the blockchain connection and contract
   * @returns Basic blockchain connection status
   */
  async getStatus(): Promise<any> {
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      const contractAddress = await this.contract.getAddress();
      
      // Get SSI keys info if available
      let ssiStatus = 'not_available';
      try {
        // Check if SSI environment variables exist
        if (process.env.SSI_KEY_ID && process.env.SSI_KEY_GENERATED_AT) {
          ssiStatus = 'available';
        }
      } catch (ssiError) {
        // Ignore SSI errors
      }

      return {
        status: 'connected',
        networkName: network.name,
        chainId: network.chainId.toString(),
        blockNumber,
        contractAddress,
        ssiKeys: ssiStatus
      };
    } catch (error) {
      this.logger.error(`Failed to get blockchain status: ${error.message}`, error.stack);
      
      return {
        status: 'disconnected',
        error: error.message,
      };
    }
  }

  /**
   * Get detailed status of the blockchain connection, contract and system
   * @returns Detailed blockchain status information
   */
  async getDetailedStatus(): Promise<any> {
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      const latestBlock = await this.provider.getBlock(blockNumber);
      const contractAddress = await this.contract.getAddress();
      const walletAddress = await this.wallet.getAddress();
      const balance = await this.provider.getBalance(walletAddress);

      // Get some basic statistics
      const gasPrice = await this.provider.getFeeData();

      return {
        connection: {
          status: 'connected',
          networkName: network.name,
          chainId: network.chainId.toString(),
        },
        blockchain: {
          currentBlock: blockNumber,
          latestBlockTime: latestBlock?.timestamp ? new Date(Number(latestBlock.timestamp) * 1000).toISOString() : null,
          gasPrice: {
            standard: ethers.formatUnits(gasPrice.gasPrice || 0n, 'gwei') + ' Gwei',
            maxFeePerGas: gasPrice.maxFeePerGas ? ethers.formatUnits(gasPrice.maxFeePerGas, 'gwei') + ' Gwei' : 'N/A',
            maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas ? ethers.formatUnits(gasPrice.maxPriorityFeePerGas, 'gwei') + ' Gwei' : 'N/A',
          },
        },
        contract: {
          address: contractAddress,
        },
        wallet: {
          address: walletAddress,
          balance: ethers.formatEther(balance) + ' ETH',
        },
        performance: {
          averageTransactionTime: '15 seconds', // Placeholder value
          successRate: '99.5%',  // Placeholder value
          pendingTransactions: 0, // Placeholder value
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get detailed blockchain status: ${error.message}`, error.stack);
      
      return {
        connection: {
          status: 'disconnected',
          error: error.message,
        },
      };
    }
  }
}
