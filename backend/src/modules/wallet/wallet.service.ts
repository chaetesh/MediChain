import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserRole } from '../users/schemas/user.schema';

export interface WalletTransaction {
  id: string;
  type: 'sent' | 'received' | 'reward' | 'fee';
  amount: string;
  from: string | null;
  to: string | null;
  timestamp: Date;
  status: 'confirmed' | 'pending' | 'failed';
  gas: string;
  description?: string;
}

export interface WalletData {
  address: string | null;
  balance: string;
  transactions: WalletTransaction[];
  isConnected: boolean;
  lastSync: Date | null;
}

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async getUserWallet(userId: string): Promise<WalletData> {
    const user = await this.userModel.findById(userId);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    const hasWallet = !!user.walletAddress;
    let transactions: WalletTransaction[] = [];
    let balance = '0.0000 ETH';
    
    if (hasWallet && user.walletAddress) {
      // Fetch real blockchain transactions
      transactions = await this.fetchRealTransactions(user.walletAddress);
      
      // Try to get real balance from blockchain (you could implement this)
      // For now, return a placeholder since balance fetching from backend is complex
      balance = '0.0500 ETH'; // This should be fetched from blockchain API
    }
    
    return {
      address: user.walletAddress || null,
      balance,
      transactions,
      isConnected: hasWallet,
      lastSync: hasWallet ? new Date() : null
    };
  }
  
  async connectWallet(userId: string, walletAddress: string): Promise<any> {
    // Validate wallet address format
    if (!this.isValidEthereumAddress(walletAddress)) {
      throw new BadRequestException('Invalid Ethereum wallet address');
    }

    // Check if wallet is already connected to another user
    const existingUser = await this.userModel.findOne({ 
      walletAddress, 
      _id: { $ne: userId } 
    });
    
    if (existingUser) {
      throw new BadRequestException('Wallet address is already connected to another account');
    }

    const user = await this.userModel.findById(userId);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    user.walletAddress = walletAddress;
    await user.save();
    
    return {
      success: true,
      message: 'Wallet connected successfully',
      address: walletAddress,
      connectedAt: new Date()
    };
  }
  
  async disconnectWallet(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    if (!user.walletAddress) {
      throw new BadRequestException('No wallet is currently connected');
    }

    const previousAddress = user.walletAddress;
    user.set('walletAddress', undefined);
    await user.save();
    
    return {
      success: true,
      message: 'Wallet disconnected successfully',
      previousAddress
    };
  }

  /**
   * Get wallet connection status
   */
  async getWalletStatus(userId: string): Promise<{
    isConnected: boolean;
    address: string | null;
    connectedSince?: Date;
  }> {
    const user = await this.userModel.findById(userId);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      isConnected: !!user.walletAddress,
      address: user.walletAddress || null,
      connectedSince: user.walletAddress ? new Date() : undefined
    };
  }

  private isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Fetch real blockchain transactions for a wallet address
   * Integrates with Etherscan API for mainnet and Sepolia testnet
   */
  private async fetchRealTransactions(walletAddress: string): Promise<WalletTransaction[]> {
    try {
      console.log('🔍 Fetching real transactions for:', walletAddress);
      
      // First, let's test the API endpoint directly
      console.log('🧪 Testing Sepolia API endpoint...');
      const testUrl = `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&sort=desc`;
      
      try {
        const testResponse = await fetch(testUrl);
        const testData = await testResponse.json();
        console.log('📊 Raw API test (no key):', { 
          status: testData.status, 
          message: testData.message,
          hasResult: !!testData.result,
          resultType: typeof testData.result,
          resultLength: Array.isArray(testData.result) ? testData.result.length : 'not array'
        });
        
        if (testData.status === '1' && Array.isArray(testData.result) && testData.result.length > 0) {
          console.log('✅ SUCCESS! API works without key, parsing transactions...');
          return this.parseEtherscanTransactions(testData.result, walletAddress, 'sepolia');
        }
      } catch (testError) {
        console.log('❌ Direct test failed:', testError.message);
      }
      
      // Try both Sepolia testnet and mainnet with keys
      const sepoliaTransactions = await this.fetchEtherscanTransactions(walletAddress, 'sepolia');
      const mainnetTransactions = await this.fetchEtherscanTransactions(walletAddress, 'mainnet');
      
      // Combine and sort by timestamp (newest first)
      const allTransactions = [...sepoliaTransactions, ...mainnetTransactions];
      allTransactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      console.log(`📝 Found ${allTransactions.length} total transactions`);
      return allTransactions.slice(0, 50); // Limit to 50 most recent transactions
      
    } catch (error) {
      console.error('💥 Error fetching real transactions:', error);
      return [];
    }
  }

  /**
   * Fetch transactions from Etherscan API
   */
  private async fetchEtherscanTransactions(walletAddress: string, network: 'mainnet' | 'sepolia'): Promise<WalletTransaction[]> {
    try {
      const baseUrl = network === 'sepolia' 
        ? 'https://api-sepolia.etherscan.io/api'
        : 'https://api.etherscan.io/api';
      
      // Try multiple API keys and methods
      const apiKeys = [
        'YourApiKeyToken', // Demo key
        'BHN71Y4ID1X1PF2CAWV8YET2MNUQ2GDVUD', // Your key
        'demo', // Another demo option
        '' // No key (some endpoints work without)
      ];
      
      for (const apiKey of apiKeys) {
        try {
          const url = `${baseUrl}?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;
          
          console.log(`🔍 Trying ${network} with key: ${apiKey ? apiKey.substring(0, 8) + '...' : 'none'}`);
          
          const response = await fetch(url);
          const data = await response.json();
          
          console.log(`${network} API response:`, { 
            status: data.status, 
            message: data.message, 
            resultCount: Array.isArray(data.result) ? data.result.length : 0
          });
          
          if (data.status === '1' && data.result && Array.isArray(data.result) && data.result.length > 0) {
            console.log(`✅ SUCCESS! Found ${data.result.length} ${network} transactions with key: ${apiKey || 'none'}`);
            return this.parseEtherscanTransactions(data.result, walletAddress, network);
          }
        } catch (keyError) {
          console.log(`Failed with key ${apiKey}:`, keyError.message);
        }
      }
      
      console.log(`❌ All API keys failed for ${network}`);
      return [];
      
    } catch (error) {
      console.error(`Error fetching ${network} transactions:`, error);
      return [];
    }
  }

  /**
   * Parse Etherscan transaction data into our format
   */
  private parseEtherscanTransactions(etherscanTxs: any[], walletAddress: string, network?: string): WalletTransaction[] {
    return etherscanTxs.map(tx => {
      const isOutgoing = tx.from.toLowerCase() === walletAddress.toLowerCase();
      const valueInEth = parseInt(tx.value) / Math.pow(10, 18);
      const gasUsed = parseInt(tx.gasUsed || '0') * parseInt(tx.gasPrice || '0') / Math.pow(10, 18);
      
      // Determine transaction type and description
      let type: 'sent' | 'received' | 'reward' | 'fee' = isOutgoing ? 'sent' : 'received';
      let description = '';
      
      // Check if it's a contract interaction (has input data)
      const isContract = tx.input && tx.input !== '0x';
      
      if (isOutgoing) {
        if (isContract) {
          description = 'Contract interaction';
        } else if (valueInEth > 0) {
          description = 'Sent';
        } else {
          description = 'Transaction fee';
          type = 'fee';
        }
      } else {
        if (isContract) {
          description = 'Contract interaction received';
        } else {
          description = 'Received';
        }
      }
      
      // Add network info to description
      const network = tx.chainId === '11155111' ? 'Sepolia' : 'Mainnet';
      
      // Add status to description for failed transactions
      if (tx.isError === '1') {
        description += ' (Failed)';
      }
      
      // Format amount properly - show SepoliaETH for testnet
      let amountStr = '';
      const ethSuffix = (network && network.toLowerCase() === 'sepolia') ? ' SepoliaETH' : ' ETH';
      
      if (valueInEth > 0) {
        if (valueInEth >= 0.001) {
          amountStr = valueInEth.toFixed(3) + ethSuffix;
        } else if (valueInEth > 0) {
          amountStr = valueInEth.toFixed(6) + ethSuffix;
        } else {
          amountStr = '0' + ethSuffix;
        }
      } else {
        // For contract interactions with 0 value, still show as transaction
        amountStr = '0' + ethSuffix;
      }
      
      return {
        id: tx.hash,
        type,
        amount: amountStr,
        from: tx.from,
        to: tx.to || null,
        timestamp: new Date(parseInt(tx.timeStamp) * 1000),
        status: tx.isError === '1' ? 'failed' as const : 'confirmed' as const,
        gas: gasUsed > 0 ? gasUsed.toFixed(6) + ' ETH' : '0 ETH',
        description
      };
    }).filter(tx => {
      // Include ALL transactions - both value transfers and contract interactions
      return true; // Show everything, including 0-value contract interactions
    });
  }

  /**
   * Add a transaction when it actually happens
   * This would be called when a real transaction is made through your dApp
   */
  async addTransaction(
    userId: string, 
    transactionHash: string, 
    type: 'sent' | 'received' | 'reward' | 'fee',
    amount: string,
    from: string,
    to: string,
    description?: string
  ): Promise<void> {
    const user = await this.userModel.findById(userId);
    
    if (!user || !user.walletAddress) {
      throw new NotFoundException('User or wallet not found');
    }

    // In a real implementation, you might store transactions in a separate collection
    // or fetch them from the blockchain in real-time
    // This is just a placeholder for the concept
    
    console.log(`Real transaction recorded: ${transactionHash} for user ${userId}`);
  }

  private getTransactionDescription(type: string): string {
    const descriptions = {
      reward: 'MediChain data sharing reward',
      fee: 'Network transaction fee',
      sent: 'Payment sent',
      received: 'Payment received'
    };
    
    return descriptions[type] || 'Transaction';
  }
  

}
