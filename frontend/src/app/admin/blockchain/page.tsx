'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageHeader from '@/components/PageHeader';
import { Card, StatCard } from '@/components/Card';
import Button from '@/components/Button';
import { 
  BlockchainApiService, 
  BlockchainStats, 
  BlockchainTransaction,
  ApiErrorClass 
} from '@/lib/services/blockchain.service';
import { 
  Database, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  Hash,
  Link,
  Zap,
  RefreshCw,
  ExternalLink,
  Copy
} from 'lucide-react';

export default function BlockchainStatusPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<BlockchainStats | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<BlockchainTransaction[]>([]);
  const [transactionSummary, setTransactionSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load blockchain data on component mount
  useEffect(() => {
    loadBlockchainData();
  }, []);

  const loadBlockchainData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load both blockchain status and real wallet transactions in parallel
      const [blockchainStatus, walletTransactions] = await Promise.all([
        BlockchainApiService.getAdminBlockchainStatus(),
        BlockchainApiService.getAllWalletTransactions({ limit: 20 })
      ]);
      
      // Transform the API response to match our component expectations
      const transformedStats: BlockchainStats = {
        totalTransactions: walletTransactions.summary?.totalTransactions || blockchainStatus.transactions?.month || 0,
        pendingTransactions: blockchainStatus.transactions?.pending || 0,
        successfulTransactions: (walletTransactions.summary?.totalTransactions || blockchainStatus.transactions?.month || 0) - (blockchainStatus.transactions?.failed || 0),
        failedTransactions: blockchainStatus.transactions?.failed || 0,
        averageBlockTime: 2.1, // Default for Polygon
        networkStatus: blockchainStatus.network?.rpcStatus === 'connected' ? 'healthy' : 'degraded',
        lastBlockHeight: blockchainStatus.network?.latestBlock || 0,
        gasPrice: parseInt(blockchainStatus.network?.gasPrice?.replace(' gwei', '') || '0'),
        networkName: blockchainStatus.network?.name || 'Polygon',
        chainId: parseInt(blockchainStatus.network?.chainId || '137'),
        contractAddresses: {
          mediChainRegistry: blockchainStatus.contract?.address || '0x0303B82244eBDaB045E336314770b13f652BE284',
          accessControl: blockchainStatus.contract?.address || '0x0303B82244eBDaB045E336314770b13f652BE284'
        }
      };
      
      setStats(transformedStats);
      
      // Store transaction summary for display
      setTransactionSummary(walletTransactions.summary);
      
      // Transform wallet transactions to BlockchainTransaction format
      const transformedTransactions: BlockchainTransaction[] = walletTransactions.transactions.map((tx: any) => {
        // Determine transaction type based on description and type
        let transactionType: 'record_hash' | 'access_grant' | 'revoke_access' | 'user_registration' = 'access_grant';
        
        if (tx.description?.toLowerCase().includes('contract interaction')) {
          transactionType = 'record_hash';
        } else if (tx.type === 'received') {
          transactionType = 'access_grant';
        } else if (tx.type === 'sent') {
          transactionType = 'revoke_access';
        } else if (tx.description?.toLowerCase().includes('registration')) {
          transactionType = 'user_registration';
        }

        // Format gas amount (extract numeric value from gas string like "0.000032 ETH")
        const gasValue = tx.gas ? parseFloat(tx.gas.replace(/[^\d.]/g, '')) : 0;
        // Convert ETH gas value to a reasonable display number (multiply by 1000000 to show as micro-units)
        const gasUsedDisplay = gasValue > 0 ? Math.round(gasValue * 1000000) : 0;

        // Create proper description
        const description = tx.description?.toLowerCase().includes('contract interaction') 
          ? `${tx.user?.name || 'User'} (${tx.user?.role || 'unknown'}): ${tx.description}`
          : `${tx.user?.name || 'User'} (${tx.user?.role || 'unknown'}): ${tx.description}`;

        return {
          id: tx.id || `tx_${Date.now()}_${Math.random()}`,
          hash: tx.id || '0x0000000000000000000000000000000000000000000000000000000000000000',
          blockNumber: 0, // Not available from wallet API
          timestamp: tx.timestamp || new Date().toISOString(),
          type: transactionType,
          status: tx.status as 'confirmed' | 'pending' | 'failed',
          gasUsed: gasUsedDisplay,
          gasPrice: 0,
          fromAddress: tx.from || '',
          toAddress: tx.to || tx.user?.walletAddress || '',
          description: description,
          recordId: undefined,
          userId: tx.user?.id,
          errorMessage: tx.status === 'failed' ? 'Transaction failed' : undefined,
          amount: tx.amount || '0 ETH' // Store the original amount string
        };
      });
      
      setRecentTransactions(transformedTransactions);
      
    } catch (error) {
      console.error('Error loading blockchain data:', error);
      setError(error instanceof ApiErrorClass ? error.message : 'Failed to load blockchain data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'record_hash':
        return 'bg-blue-100 text-blue-800';
      case 'access_grant':
        return 'bg-green-100 text-green-800';
      case 'revoke_access':
        return 'bg-red-100 text-red-800';
      case 'user_registration':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case 'record_hash':
        return 'record hash';
      case 'access_grant':
        return 'access grant';
      case 'revoke_access':
        return 'revoke access';
      case 'user_registration':
        return 'user registration';
      default:
        return type.replace('_', ' ');
    }
  };

  const getNetworkStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'congested':
        return 'text-yellow-600';
      case 'degraded':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBlockchainData();
    setRefreshing(false);
  };

  const copyToClipboard = async (text: string) => {
    const success = await BlockchainApiService.copyToClipboard(text);
    if (success) {
      // You could show a toast notification here
      console.log('Copied to clipboard:', text);
    }
  };

  if (loading && !stats) {
    return (
      <ProtectedRoute allowedRoles={['system_admin']}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error && !stats) {
    return (
      <ProtectedRoute allowedRoles={['system_admin']}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load blockchain data</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Retry
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['system_admin']}>
      <div className="space-y-6">
        <PageHeader
          title="Blockchain Status"
          description="Monitor Polygon blockchain integration and transaction status"
        >
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="primary">
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Explorer
            </Button>
          </div>
        </PageHeader>

        {/* Network Status */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Activity className={`w-5 h-5 ${stats ? getNetworkStatusColor(stats.networkStatus) : 'text-gray-400'}`} />
                <span className="text-lg font-semibold">Network Status</span>
              </div>
              <span className={`text-lg font-bold capitalize ${stats ? getNetworkStatusColor(stats.networkStatus) : 'text-gray-400'}`}>
                {stats ? stats.networkStatus : 'Loading...'}
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Latest Block</div>
              <div className="text-lg font-semibold text-gray-900">
                #{stats ? stats.lastBlockHeight.toLocaleString() : 'Loading...'}
              </div>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Transactions"
            value={stats ? stats.totalTransactions.toLocaleString() : '0'}
            change={{ value: "+123 today", trend: "up" }}
            icon={<Database className="w-6 h-6 text-blue-600" />}
          />
          <StatCard
            title="Pending Transactions"
            value={stats ? stats.pendingTransactions.toString() : '0'}
            change={{ value: "In mempool", trend: "neutral" }}
            icon={<Clock className="w-6 h-6 text-yellow-600" />}
          />
          <StatCard
            title="Success Rate"
            value={stats ? `${Math.round((stats.successfulTransactions / stats.totalTransactions) * 100)}%` : '0%'}
            change={{ value: "High reliability", trend: "up" }}
            icon={<CheckCircle className="w-6 h-6 text-green-600" />}
          />
          <StatCard
            title="Avg Block Time"
            value={stats ? `${stats.averageBlockTime}s` : '0s'}
            change={{ value: "Optimal performance", trend: "up" }}
            icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
          />
        </div>

        {/* Network Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Network Information">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Network</span>
                <span className="font-medium">Polygon Mainnet</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Chain ID</span>
                <span className="font-medium">137</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Current Gas Price</span>
                <span className="font-medium">{stats ? stats.gasPrice : 0} Gwei</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Block Height</span>
                <span className="font-medium">#{stats ? stats.lastBlockHeight.toLocaleString() : '0'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average Block Time</span>
                <span className="font-medium">{stats ? stats.averageBlockTime : 0} seconds</span>
              </div>
            </div>
          </Card>

          <Card title="Transaction Summary">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Value</span>
                <span className="font-medium">{transactionSummary?.totalValue || '0 ETH'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Users</span>
                <span className="font-medium">{transactionSummary?.totalUsers || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Patients</span>
                <span className="font-medium">{transactionSummary?.usersByRole?.patient || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Doctors</span>
                <span className="font-medium">{transactionSummary?.usersByRole?.doctor || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Hospital Admins</span>
                <span className="font-medium">{transactionSummary?.usersByRole?.hospital_admin || 0}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card title="Recent Wallet Transactions">
          <div className="overflow-x-auto">
            {recentTransactions.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction Hash
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User & Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gas Used
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Hash className="w-4 h-4 text-gray-400" />
                          <span className="font-mono text-sm text-gray-900">
                            {BlockchainApiService.formatHash(tx.hash)}
                          </span>
                          <button 
                            onClick={() => copyToClipboard(tx.hash)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{tx.description}</div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(tx.type)}`}>
                          {getTypeDisplayName(tx.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(tx.status)}
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(tx.status)}`}>
                            {tx.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tx.amount || '0 ETH'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Zap className="w-4 h-4 text-gray-400 mr-1" />
                          {tx.gasUsed ? (tx.gasUsed < 1000 ? tx.gasUsed.toString() : tx.gasUsed.toLocaleString()) : '0'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(tx.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          onClick={() => window.open(BlockchainApiService.getExplorerUrl(tx.hash), '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button 
                          className="text-gray-600 hover:text-gray-900"
                          onClick={() => copyToClipboard(tx.hash)}
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8">
                <Hash className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No wallet transactions found</p>
                <p className="text-sm text-gray-400">Transactions will appear here when users connect their wallets and make transactions</p>
              </div>
            )}
          </div>
        </Card>

        {/* Pending Transactions Alert */}
        {stats && stats.pendingTransactions > 20 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <div className="flex items-start">
              <Clock className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">High Pending Transactions</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  There are {stats.pendingTransactions} pending transactions. Network may be congested.
                </p>
                <div className="mt-3">
                  <Button size="sm" variant="outline">
                    Monitor Network Status
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Contract Addresses */}
        <Card title="Smart Contract Addresses">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-900">MediChain Registry</div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm text-gray-600">
                  {stats?.contractAddresses ? 
                    BlockchainApiService.formatHash(stats.contractAddresses.mediChainRegistry) : 
                    '0x1234...5678'
                  }
                </span>
                <button 
                  onClick={() => copyToClipboard(stats?.contractAddresses?.mediChainRegistry || '0x1234567890abcdef1234567890abcdef12345678')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button 
                  className="text-blue-600 hover:text-blue-800"
                  onClick={() => window.open(BlockchainApiService.getExplorerUrl(stats?.contractAddresses?.mediChainRegistry || '', 'address'), '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-900">Access Control</div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm text-gray-600">
                  {stats?.contractAddresses ? 
                    BlockchainApiService.formatHash(stats.contractAddresses.accessControl) : 
                    '0xabcd...ef01'
                  }
                </span>
                <button 
                  onClick={() => copyToClipboard(stats?.contractAddresses?.accessControl || '0xabcdef0123456789abcdef0123456789abcdef01')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button 
                  className="text-blue-600 hover:text-blue-800"
                  onClick={() => window.open(BlockchainApiService.getExplorerUrl(stats?.contractAddresses?.accessControl || '', 'address'), '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
