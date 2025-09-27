import { config } from '../config/env';
import { AuthApiService, ApiErrorClass } from './auth.service';

// API configuration
const API_BASE_URL = config.api.baseUrl;

// Blockchain types
export interface BlockchainStats {
  totalTransactions: number;
  pendingTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  averageBlockTime: number;
  networkStatus: 'healthy' | 'congested' | 'degraded';
  lastBlockHeight: number;
  gasPrice: number;
  networkName: string;
  chainId: number;
  contractAddresses: {
    mediChainRegistry: string;
    accessControl: string;
  };
}

export interface BlockchainTransaction {
  id: string;
  hash: string;
  blockNumber: number;
  timestamp: string;
  type: 'record_hash' | 'access_grant' | 'revoke_access' | 'user_registration';
  status: 'confirmed' | 'pending' | 'failed';
  gasUsed: number;
  gasPrice: number;
  fromAddress: string;
  toAddress?: string;
  description: string;
  recordId?: string;
  userId?: string;
  errorMessage?: string;
  amount?: string; // Add amount field for display
}

export interface NetworkInfo {
  chainId: number;
  networkName: string;
  rpcUrl: string;
  blockExplorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface ContractInfo {
  address: string;
  name: string;
  abi?: any[];
  deployedAt: string;
  version: string;
  verified: boolean;
}

// Generic API request handler with proper error handling
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Add /api prefix to all endpoints since backend uses global prefix 'api'
  const url = `${API_BASE_URL}/api${endpoint}`;
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Get token from localStorage if available
  const token = AuthApiService.getToken();
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new ApiErrorClass(
        data.message || `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiErrorClass) {
      throw error;
    }
    
    // Network or other errors
    throw new ApiErrorClass(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      0
    );
  }
}

// Blockchain API service
export class BlockchainApiService {
  /**
   * Get blockchain network statistics (using admin endpoint)
   */
  static async getBlockchainStats(): Promise<BlockchainStats> {
    // Use the admin blockchain status endpoint
    const adminStatus = await apiRequest<any>('/admin/blockchain/status', {
      method: 'GET',
    });

    // Transform the admin response to match BlockchainStats interface
    return {
      totalTransactions: adminStatus.transactions?.month || 0,
      pendingTransactions: adminStatus.transactions?.pending || 0,
      successfulTransactions: (adminStatus.transactions?.month || 0) - (adminStatus.transactions?.failed || 0),
      failedTransactions: adminStatus.transactions?.failed || 0,
      averageBlockTime: 2.1, // Default for Polygon
      networkStatus: adminStatus.network?.rpcStatus === 'connected' ? 'healthy' : 'degraded',
      lastBlockHeight: adminStatus.network?.latestBlock || 0,
      gasPrice: parseInt(adminStatus.network?.gasPrice?.replace(' gwei', '') || '0'),
      networkName: adminStatus.network?.name || 'Polygon',
      chainId: parseInt(adminStatus.network?.chainId || '137'),
      contractAddresses: {
        mediChainRegistry: adminStatus.contract?.address || '0x0303B82244eBDaB045E336314770b13f652BE284',
        accessControl: adminStatus.contract?.address || '0x0303B82244eBDaB045E336314770b13f652BE284'
      }
    };
  }

  /**
   * Get recent blockchain transactions (not available in admin endpoint)
   */
  static async getRecentTransactions(limit: number = 10): Promise<BlockchainTransaction[]> {
    // Admin endpoint doesn't provide recent transactions, return empty array
    return [];
  }

  /**
   * Get transaction by hash
   */
  static async getTransaction(hash: string): Promise<BlockchainTransaction> {
    return apiRequest<BlockchainTransaction>(`/blockchain/transaction/${hash}`, {
      method: 'GET',
    });
  }

  /**
   * Get network information
   */
  static async getNetworkInfo(): Promise<NetworkInfo> {
    const adminStatus = await apiRequest<any>('/admin/blockchain/status', {
      method: 'GET',
    });

    return {
      chainId: parseInt(adminStatus.network?.chainId || '137'),
      networkName: adminStatus.network?.name || 'Polygon',
      rpcUrl: 'https://polygon-rpc.com', // Not provided in admin endpoint
      blockExplorerUrl: 'https://polygonscan.com', // Not provided in admin endpoint
      nativeCurrency: {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18
      }
    };
  }

  /**
   * Get contract information
   */
  static async getContractInfo(): Promise<ContractInfo[]> {
    const adminStatus = await apiRequest<any>('/admin/blockchain/status', {
      method: 'GET',
    });

    return [
      {
        address: adminStatus.contract?.address || '0x0303B82244eBDaB045E336314770b13f652BE284',
        name: adminStatus.contract?.name || 'MediChain',
        deployedAt: adminStatus.contract?.deployedAt || '2024-01-01T00:00:00.000Z',
        version: '1.0.0',
        verified: true
      }
    ];
  }

  /**
   * Retry failed blockchain transaction
   */
  static async retryTransaction(transactionId: string): Promise<{ 
    success: boolean; 
    newHash?: string; 
    message: string 
  }> {
    return apiRequest<{ success: boolean; newHash?: string; message: string }>(
      `/blockchain/transaction/${transactionId}/retry`, 
      {
        method: 'POST',
      }
    );
  }

  /**
   * Get transaction statistics by type (not available in admin endpoint)
   */
  static async getTransactionStats(): Promise<{
    [key: string]: {
      total: number;
      successful: number;
      failed: number;
      pending: number;
    }
  }> {
    const adminStatus = await apiRequest<any>('/admin/blockchain/status', {
      method: 'GET',
    });

    // Use the available transaction data from admin endpoint
    const totalTransactions = adminStatus.transactions?.month || 0;
    const failedTransactions = adminStatus.transactions?.failed || 0;
    const pendingTransactions = adminStatus.transactions?.pending || 0;
    const successfulTransactions = totalTransactions - failedTransactions;

    // Return simplified stats based on available data
    return {
      all_transactions: { 
        total: totalTransactions, 
        successful: successfulTransactions, 
        failed: failedTransactions, 
        pending: pendingTransactions 
      }
    };
  }

  /**
   * Get blockchain health status
   */
  static async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    lastBlockTime: number;
    syncStatus: 'synced' | 'syncing' | 'behind';
    issues: string[];
  }> {
    const adminStatus = await apiRequest<any>('/admin/blockchain/status', {
      method: 'GET',
    });

    return {
      status: adminStatus.network?.rpcStatus === 'connected' ? 'healthy' : 'down',
      responseTime: 0, // Not provided in admin endpoint
      lastBlockTime: 2.1, // Default for Polygon
      syncStatus: adminStatus.network?.syncStatus === 'synced' ? 'synced' : 'behind',
      issues: []
    };
  }

  /**
   * Format transaction hash for display
   */
  static formatHash(hash: string, startChars: number = 6, endChars: number = 4): string {
    if (hash.length <= startChars + endChars) {
      return hash;
    }
    return `${hash.slice(0, startChars)}...${hash.slice(-endChars)}`;
  }

  /**
   * Get blockchain explorer URL for transaction
   */
  static getExplorerUrl(hash: string, type: 'tx' | 'address' | 'block' = 'tx'): string {
    const baseUrl = 'https://polygonscan.com';
    switch (type) {
      case 'tx':
        return `${baseUrl}/tx/${hash}`;
      case 'address':
        return `${baseUrl}/address/${hash}`;
      case 'block':
        return `${baseUrl}/block/${hash}`;
      default:
        return `${baseUrl}/tx/${hash}`;
    }
  }

  /**
   * Get all wallet transactions from admin endpoint
   */
  static async getAllWalletTransactions(options: {
    page?: number;
    limit?: number;
    userRole?: string;
    walletAddress?: string;
  } = {}): Promise<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    transactions: any[];
    summary: any;
  }> {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.userRole) params.append('userRole', options.userRole);
    if (options.walletAddress) params.append('walletAddress', options.walletAddress);

    const queryString = params.toString();
    const endpoint = `/admin/blockchain/transactions${queryString ? `?${queryString}` : ''}`;

    return apiRequest<{
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      transactions: any[];
      summary: any;
    }>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get blockchain status from admin endpoint
   */
  static async getAdminBlockchainStatus(): Promise<any> {
    return apiRequest<any>('/admin/blockchain/status', {
      method: 'GET',
    });
  }

  /**
   * Copy text to clipboard
   */
  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }
}

// Export all types and the error class for use in components
export { ApiErrorClass };