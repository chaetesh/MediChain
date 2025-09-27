'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageHeader from '@/components/PageHeader';
import { Card, StatCard } from '@/components/Card';
import Button from '@/components/Button';
import { useMetaMaskWithSelf } from '@/lib/hooks/useMetaMaskWithSelf';
import { WalletApiService } from '@/lib/services/wallet.service';
import { UserRole } from '@/lib/types/auth.types';
import { 
  Wallet, 
  Plus, 
  Minus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  Gift,
  Shield,
  Zap,
  Eye,
  EyeOff,
  Copy,
  Send,
  Download,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

// Get block explorer URL for current network
const getBlockExplorerUrl = (chainId: string | null): string => {
  switch (chainId) {
    case '0x1': return 'https://etherscan.io';
    case '0xaa36a7': return 'https://sepolia.etherscan.io';
    case '0x89': return 'https://polygonscan.com';
    case '0x13882': return 'https://amoy.polygonscan.com';
    case '0xa4ec': return 'https://explorer.celo.org';
    case '0xaef3': return 'https://alfajores-blockscout.celo-testnet.org';
    default: return 'https://etherscan.io'; // fallback to mainnet
  }
};

// Get network name for display
const getNetworkName = (chainId: string | null): string => {
  switch (chainId) {
    case '0x1': return 'Ethereum Mainnet';
    case '0xaa36a7': return 'Sepolia Testnet';
    case '0x89': return 'Polygon Mainnet';
    case '0x13882': return 'Polygon Amoy';
    case '0x13881': return 'Mumbai Testnet';
    case '0xa4ec': return 'Celo Mainnet';
    case '0xaef3': return 'Celo Alfajores Testnet';
    default: return `Chain ID: ${chainId ? parseInt(chainId, 16) : 'Unknown'}`;
  }
};

// Get native currency name for display
const getNativeCurrency = (chainId: string | null): string => {
  switch (chainId) {
    case '0x1': return 'ETH';
    case '0xaa36a7': return 'SepoliaETH';
    case '0x89': return 'MATIC';
    case '0x13882': return 'MATIC';
    case '0x13881': return 'MATIC';
    case '0xa4ec': return 'CELO';
    case '0xaef3': return 'CELO';
    default: return 'ETH';
  }
};

// Check if current network is a testnet
const isTestnet = (chainId: string | null): boolean => {
  return chainId === '0xaa36a7' || chainId === '0x13882' || chainId === '0x13881' || chainId === '0xaef3';
};

// Exchange rates (in a real app, fetch from an API)
const EXCHANGE_RATES = {
  ETH_TO_INR: 200000, // 1 ETH = ₹200,000 (example rate)
  MATIC_TO_INR: 60, // 1 MATIC = ₹60 (example rate)
  CELO_TO_INR: 45, // 1 CELO = ₹45 (example rate)
};

// Mock balances for demonstration (since token fetching might fail on testnet)
const MOCK_BALANCES = {
  pol: '0.0000',
  polInr: '₹0.00',
};

interface Transaction {
  id: string;
  type: 'payment' | 'receipt' | 'reward' | 'fee' | 'refund';
  amount: number;
  currency: 'MEDI' | 'ETH' | 'USD' | 'POL';
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  from?: string;
  to?: string;
  txHash?: string;
  gasFee?: number;
}

interface WalletState {
  isConnectedToBackend: boolean;
  backendWalletData: any;
  isLoadingBackendData: boolean;
  backendError: string | null;
}

interface SendPaymentForm {
  recipientAddress: string;
  amount: string;
  note: string;
}

export default function PatientWalletPage() {
  const [showBalance, setShowBalance] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [sendForm, setSendForm] = useState<SendPaymentForm>({
    recipientAddress: '',
    amount: '',
    note: ''
  });
  const [isEstimatingGas, setIsEstimatingGas] = useState(false);
  const [isSendingTransaction, setIsSendingTransaction] = useState(false);
  const [estimatedGas, setEstimatedGas] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [walletState, setWalletState] = useState<WalletState>({
    isConnectedToBackend: false,
    backendWalletData: null,
    isLoadingBackendData: false,
    backendError: null,
  });
  
  const [balances, setBalances] = useState({
    eth: '0.0000',
    ethInr: '₹0.00',
    isLoading: false
  });

  // MetaMask integration
  const {
    isConnected: isMetaMaskConnected,
    account: metaMaskAccount,
    isLoading: isMetaMaskLoading,
    error: metaMaskError,
    chainId,
    isCeloNetwork,
    connect: connectMetaMask,
    disconnect: disconnectMetaMask,
    getBalance: getMetaMaskBalance,
    getTokenBalance,
    switchToMainnet,
    switchToSepolia,
    switchToAmoy,
    switchToCelo,
    switchToCeloAlfajores,
    sendTransaction,
    estimateGas,
    getCeloBalance,
    isCeloTestnet,
    isCeloMainnet,
    getCeloTestnetFaucetInfo,
  } = useMetaMaskWithSelf();

  // Load backend wallet data
  const loadBackendWalletData = async () => {
    if (!isMetaMaskConnected || !metaMaskAccount) {
      console.log('No MetaMask connection, skipping backend wallet data load');
      return;
    }

    setWalletState(prev => ({ ...prev, isLoadingBackendData: true, backendError: null }));

    try {
      console.log('Loading backend wallet data...');
      const walletData = await WalletApiService.getUserWallet();
      console.log('Backend wallet data loaded:', walletData);
      
      setWalletState(prev => ({
        ...prev,
        backendWalletData: walletData,
        isConnectedToBackend: !!walletData.address && walletData.address.toLowerCase() === metaMaskAccount.address.toLowerCase(),
        isLoadingBackendData: false,
      }));
    } catch (error) {
      console.error('Failed to load backend wallet data:', error);
      setWalletState(prev => ({
        ...prev,
        backendError: error instanceof Error ? error.message : 'Failed to load wallet data from backend',
        isLoadingBackendData: false,
        isConnectedToBackend: false, // Set to false if we can't load wallet data
      }));
    }
  };

  // Direct MetaMask network check
  const checkActualNetwork = async () => {
    if (window.ethereum) {
      const actualChainId = await window.ethereum.request({ method: 'eth_chainId' });
      console.log('🔍 DIRECT CHECK:');
      console.log('  App chainId:', chainId);
      console.log('  MetaMask actual:', actualChainId);
      console.log('  Match?', actualChainId === chainId);
      
      if (actualChainId !== chainId) {
        console.log('🚨 MISMATCH! Reloading page...');
        window.location.reload();
      }
      return actualChainId;
    }
    return chainId;
  };

  // Load wallet balances with FORCE network check
  const loadWalletBalances = async () => {
    // Force check actual network first
    await checkActualNetwork();
    
    if (!isMetaMaskConnected || !metaMaskAccount) {
      // If not connected, show zero values
      setBalances({
        eth: '0.0000',
        ethInr: '₹0.00',
        isLoading: false
      });
      return;
    }
    
    setBalances(prev => ({ ...prev, isLoading: true }));
    
    try {
      console.log('Loading balances for address:', metaMaskAccount.address);
      console.log('Current chain ID:', chainId);
      
      // Get real balance for current network
      const balance = await getMetaMaskBalance();
      console.log('Balance:', balance, 'for chain:', chainId);
      
      // Calculate value in INR based on network
      const balanceNum = parseFloat(balance || '0');
      let balanceInr = '₹0.00';
      
      if (balanceNum > 0) {
        if (chainId === '0x89' || chainId === '0x13882' || chainId === '0x13881') {
          // Polygon networks use MATIC
          balanceInr = `₹${(balanceNum * EXCHANGE_RATES.MATIC_TO_INR).toFixed(2)}`;
        } else if (chainId === '0x1') {
          // Ethereum mainnet
          balanceInr = `₹${(balanceNum * EXCHANGE_RATES.ETH_TO_INR).toFixed(2)}`;
        } else if (chainId === '0xa4ec') {
          // Celo mainnet
          balanceInr = `₹${(balanceNum * EXCHANGE_RATES.CELO_TO_INR).toFixed(2)}`;
        }
        // Testnets don't show conversion rates
      }
      
      const finalBalances = {
        eth: balance || '0.0000',
        ethInr: balanceInr,
        isLoading: false
      };
      
      console.log('Final balances to set:', finalBalances);
      setBalances(finalBalances);
    } catch (error) {
      console.error('Failed to load balances:', error);
      // Set zero values on error
      const errorBalances = {
        eth: '0.0000',
        ethInr: '₹0.00',
        isLoading: false
      };
      
      setBalances(errorBalances);
    }
  };

  // Connect wallet to backend
  const connectWalletToBackend = async () => {
    if (!metaMaskAccount?.address) {
      console.error('No MetaMask account connected');
      return;
    }

    setWalletState(prev => ({ ...prev, isLoadingBackendData: true, backendError: null }));

    try {
      console.log('Connecting wallet to backend:', metaMaskAccount.address);
      const result = await WalletApiService.connectWallet(metaMaskAccount.address);
      console.log('Wallet connection result:', result);
      
      setWalletState(prev => ({
        ...prev,
        isConnectedToBackend: true,
        isLoadingBackendData: false,
      }));
      
      // Reload wallet data after connecting
      await loadBackendWalletData();
      
      // Show success message (you could add a toast notification here)
      console.log('✅ Wallet connected successfully to backend');
    } catch (error) {
      console.error('❌ Failed to connect wallet to backend:', error);
      setWalletState(prev => ({
        ...prev,
        backendError: error instanceof Error ? error.message : 'Failed to connect wallet to backend',
        isLoadingBackendData: false,
      }));
    }
  };

  // Disconnect wallet from backend
  const disconnectWalletFromBackend = async () => {
    setWalletState(prev => ({ ...prev, isLoadingBackendData: true, backendError: null }));

    try {
      await WalletApiService.disconnectWallet();
      setWalletState(prev => ({
        ...prev,
        isConnectedToBackend: false,
        backendWalletData: null,
        isLoadingBackendData: false,
      }));
    } catch (error) {
      setWalletState(prev => ({
        ...prev,
        backendError: error instanceof Error ? error.message : 'Failed to disconnect wallet',
        isLoadingBackendData: false,
      }));
    }
  };

  // Load data when MetaMask is connected OR when chain changes
  useEffect(() => {
    if (isMetaMaskConnected && metaMaskAccount) {
      console.log('MetaMask connected or chain changed, loading fresh data...');
      console.log('Current chain ID in useEffect:', chainId);
      loadBackendWalletData();
      loadWalletBalances(); // Load real balances when wallet connects or chain changes
    }
  }, [isMetaMaskConnected, metaMaskAccount, chainId]); // Added chainId dependency

  // Handle send form changes
  const handleSendFormChange = (field: keyof SendPaymentForm, value: string) => {
    setSendForm(prev => ({ ...prev, [field]: value }));
    
    // Clear previous gas estimation when amount or recipient changes
    if (field === 'amount' || field === 'recipientAddress') {
      setEstimatedGas(null);
    }
  };

  // Estimate gas for transaction
  const handleEstimateGas = async () => {
    if (!sendForm.recipientAddress || !sendForm.amount || !isValidEthereumAddress(sendForm.recipientAddress)) {
      return;
    }

    setIsEstimatingGas(true);
    try {
      const gas = await estimateGas(sendForm.recipientAddress, sendForm.amount);
      setEstimatedGas(gas);
    } catch (error) {
      console.error('Gas estimation failed:', error);
      setEstimatedGas(null);
    } finally {
      setIsEstimatingGas(false);
    }
  };

  // Handle send payment
  const handleSendPayment = async () => {
    if (!sendForm.recipientAddress || !sendForm.amount || !isValidEthereumAddress(sendForm.recipientAddress)) {
      alert('Please enter a valid recipient address and amount');
      return;
    }

    if (parseFloat(sendForm.amount) <= 0) {
      alert('Amount must be greater than 0');
      return;
    }

    setIsSendingTransaction(true);
    try {
      const txHash = await sendTransaction(sendForm.recipientAddress, sendForm.amount);
      if (txHash) {
        setTransactionHash(txHash);
        
        // Record the real transaction in the backend
        if (walletState.isConnectedToBackend && metaMaskAccount?.address) {
          try {
            await WalletApiService.addTransaction({
              transactionHash: txHash,
              type: 'sent',
              amount: `${sendForm.amount} ETH`,
              from: metaMaskAccount.address,
              to: sendForm.recipientAddress,
              description: sendForm.note || 'Payment sent'
            });
            
            // Refresh wallet data to show the new transaction
            await loadBackendWalletData();
          } catch (error) {
            console.error('Failed to record transaction:', error);
          }
        }
        
        // Reset form
        setSendForm({ recipientAddress: '', amount: '', note: '' });
        setEstimatedGas(null);
        alert(`Transaction sent successfully! Hash: ${txHash.substring(0, 10)}...`);
        setShowSendModal(false);
      } else {
        alert('Transaction failed. Please try again.');
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      alert('Transaction failed. Please try again.');
    } finally {
      setIsSendingTransaction(false);
    }
  };

  // Validate Ethereum address
  const isValidEthereumAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  // Reset send modal when closing
  const closeSendModal = () => {
    setShowSendModal(false);
    setSendForm({ recipientAddress: '', amount: '', note: '' });
    setEstimatedGas(null);
    setTransactionHash(null);
  };

  // Mock data - will be replaced with real data from MetaMask and backend
  
  // Convert backend transactions to frontend format
  const convertBackendTransaction = (backendTx: any): Transaction => {
    return {
      id: backendTx.id,
      type: backendTx.type === 'received' ? 'receipt' : 
            backendTx.type === 'sent' ? 'payment' :
            backendTx.type === 'reward' ? 'reward' : 'fee',
      amount: parseFloat(backendTx.amount.split(' ')[0]),
      currency: backendTx.amount.includes('POL') ? 'POL' as const : 
                backendTx.amount.includes('ETH') ? 'ETH' as const : 'USD' as const,
      description: backendTx.description || 'Transaction',
      date: backendTx.timestamp,
      status: backendTx.status === 'confirmed' ? 'completed' as const : 
              backendTx.status === 'pending' ? 'pending' as const : 'failed' as const,
      from: backendTx.from,
      to: backendTx.to,
      txHash: backendTx.id,
      gasFee: backendTx.gas ? parseFloat(backendTx.gas.split(' ')[0]) : undefined,
    };
  };

  const backendTransactions = walletState.backendWalletData?.transactions?.map(convertBackendTransaction) || [];
  
  // Only show transactions when wallet is connected to backend, otherwise show empty array
  const transactions: Transaction[] = walletState.isConnectedToBackend && backendTransactions.length > 0 
    ? backendTransactions 
    : []; // Don't show mock transactions, wait for real connection

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <ArrowUpRight className="w-4 h-4 text-red-600" />;
      case 'receipt':
        return <ArrowDownLeft className="w-4 h-4 text-green-600" />;
      case 'reward':
        return <Gift className="w-4 h-4 text-purple-600" />;
      case 'fee':
        return <Zap className="w-4 h-4 text-orange-600" />;
      case 'refund':
        return <RefreshCw className="w-4 h-4 text-blue-600" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'payment':
      case 'fee':
        return 'text-red-600';
      case 'receipt':
      case 'reward':
      case 'refund':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // TODO: Show toast notification
  };

  // Get current wallet address (MetaMask or backend)
  const walletAddress = metaMaskAccount?.address || walletState.backendWalletData?.address || null;
  
  // Calculate stats from actual transactions
  const completedTransactions = transactions.filter(t => t.status === 'completed').length;
  const pendingTransactions = transactions.filter(t => t.status === 'pending').length;
  const totalRewards = transactions
    .filter(t => t.type === 'reward' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <ProtectedRoute allowedRoles={[UserRole.PATIENT]}>
      <div className="space-y-6">
        <PageHeader
          title="Digital Wallet"
          description="Connect your MetaMask wallet and manage your MediChain tokens"
        >
          <div className="flex space-x-3">
            {!isMetaMaskConnected ? (
              <Button 
                variant="primary" 
                onClick={connectMetaMask}
                disabled={isMetaMaskLoading}
              >
                {isMetaMaskLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect MetaMask
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={disconnectMetaMask}>
                  <ArrowDownLeft className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
                {!walletState.isConnectedToBackend && (
                  <Button 
                    variant="primary" 
                    onClick={connectWalletToBackend}
                    disabled={walletState.isLoadingBackendData}
                  >
                    {walletState.isLoadingBackendData ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Connect to MediChain
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </div>
        </PageHeader>

        {/* Error Messages */}
        {metaMaskError && (
          <Card>
            <div className="flex items-center p-4 text-red-600 bg-red-50 rounded-lg">
              <AlertCircle className="w-5 h-5 mr-3" />
              <div>
                <p className="font-medium">MetaMask Error</p>
                <p className="text-sm">{metaMaskError}</p>
              </div>
            </div>
          </Card>
        )}

        {walletState.backendError && (
          <Card>
            <div className="flex items-center p-4 text-red-600 bg-red-50 rounded-lg">
              <AlertCircle className="w-5 h-5 mr-3" />
              <div>
                <p className="font-medium">Backend Connection Error</p>
                <p className="text-sm">{walletState.backendError}</p>
              </div>
            </div>
          </Card>
        )}

        {!isMetaMaskConnected ? (
          /* MetaMask Not Connected State */
          <Card>
            <div className="text-center py-12">
              <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
              <p className="text-gray-600 mb-6">
                Connect your MetaMask wallet to access MediChain features and manage your tokens.
              </p>
              <Button variant="primary" onClick={connectMetaMask} disabled={isMetaMaskLoading}>
                {isMetaMaskLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Connecting to MetaMask...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect MetaMask
                  </>
                )}
              </Button>
            </div>
          </Card>
        ) : (
          /* Connected State */
          <>
            {/* Wallet Balance Display */}
            <Card title="Wallet Balance">
              <div className="space-y-4">
                {/* ETH Balance - Main Display */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">Ξ</span>
                      </div>
                      <span className="text-lg font-semibold text-gray-900">
                        {getNativeCurrency(chainId)}
                      </span>
                      {chainId && chainId !== '0x1' && (
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                          {getNetworkName(chainId)}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setShowBalance(!showBalance)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-gray-900">
                      {balances.isLoading ? (
                        <div className="animate-pulse">Loading...</div>
                      ) : showBalance ? (
                        `${balances.eth} ${getNativeCurrency(chainId)}`
                      ) : (
                        '****'
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {balances.isLoading ? '' : showBalance ? (
                        isTestnet(chainId) ? 'No conversion rate available' : 
                        balances.ethInr === '₹0.00' ? 'No balance' : balances.ethInr
                      ) : '****'}
                      {chainId !== '0x1' && showBalance && (
                        <span className="ml-2 text-xs text-blue-600">
                          (Testnet)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Refresh Button */}
                <button
                  onClick={loadWalletBalances}
                  disabled={balances.isLoading}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${balances.isLoading ? 'animate-spin' : ''}`} />
                  <span>
                    {balances.isLoading ? 'Loading...' : 'Refresh Real Balances'}
                  </span>
                </button>
                
                {/* Network Status Debug */}
                <div className="bg-gray-50 border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div className="text-xs text-gray-600 space-y-1">
                      <div><strong>Chain ID:</strong> {chainId || 'Not detected'}</div>
                      <div><strong>Network:</strong> {getNetworkName(chainId)}</div>
                      <div><strong>Status:</strong> {(chainId === '0xaa36a7' || chainId === '0x13882') ? '✅ Supported testnet' : '⚠️ Switch to Sepolia or Amoy'}</div>
                      <div><strong>Balance:</strong> {balances.eth} {getNativeCurrency(chainId)}</div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={checkActualNetwork}
                        className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 rounded"
                      >
                        🔄 Force Network Check
                      </button>
                      
                      {/* Network Switch Buttons */}
                      {chainId !== '0xaa36a7' && (
                        <button
                          onClick={switchToSepolia}
                          className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-800 rounded"
                        >
                          🔄 Switch to Sepolia
                        </button>
                      )}
                      
                      {chainId !== '0x13882' && (
                        <button
                          onClick={switchToAmoy}
                          className="px-2 py-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 rounded"
                        >
                          🔄 Switch to Amoy
                        </button>
                      )}
                      
                      {chainId !== '0x1' && (
                        <button
                          onClick={switchToMainnet}
                          className="px-2 py-1 text-xs bg-orange-100 hover:bg-orange-200 text-orange-800 rounded"
                        >
                          🔄 Switch to Mainnet
                        </button>
                      )}
                      
                      {/* Celo Network Switch Buttons */}
                      {chainId !== '0xa4ec' && (
                        <button
                          onClick={switchToCelo}
                          className="px-2 py-1 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded"
                        >
                          🌟 Switch to Celo
                        </button>
                      )}
                      
                      {chainId !== '0xaef3' && (
                        <button
                          onClick={switchToCeloAlfajores}
                          className="px-2 py-1 text-xs bg-teal-100 hover:bg-teal-200 text-teal-800 rounded"
                        >
                          🧪 Switch to Celo Testnet
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Quick Fix: Disconnect/Reconnect */}
                  {chainId !== '0xaa36a7' && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-xs text-yellow-700 mb-2">Network not updating? Try disconnecting and reconnecting:</p>
                      <button
                        onClick={() => {
                          disconnectMetaMask();
                          setTimeout(() => connectMetaMask(), 1000);
                        }}
                        className="px-2 py-1 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded"
                      >
                        🔌 Reconnect Wallet
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Wallet Status"
                value={walletState.isConnectedToBackend ? "Connected" : "Disconnected"}
                change={{ 
                  value: walletState.isConnectedToBackend ? "to MediChain" : "Connect to earn rewards", 
                  trend: walletState.isConnectedToBackend ? "up" : "neutral" 
                }}
                icon={<Wallet className={`w-6 h-6 ${walletState.isConnectedToBackend ? 'text-green-600' : 'text-gray-400'}`} />}
              />
              <StatCard
                title="MEDI Rewards"
                value={showBalance ? totalRewards.toString() : '****'}
                change={{ value: "Total earned", trend: "up" }}
                icon={<Gift className="w-6 h-6 text-purple-600" />}
              />
              <StatCard
                title="Transactions"
                value={completedTransactions.toString()}
                change={{ value: `${pendingTransactions} pending`, trend: "neutral" }}
                icon={<TrendingUp className="w-6 h-6 text-green-600" />}
              />
              <StatCard
                title="Network"
                value={getNetworkName(chainId)}
                change={{ value: chainId === '0x1' ? "Mainnet" : "Testnet/L2", trend: chainId === '0x1' ? "up" : "neutral" }}
                icon={<Shield className="w-6 h-6 text-blue-600" />}
              />
            </div>

            {/* Wallet Info */}
            <Card title="Wallet Information">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Wallet Address:</div>
                    <div className="font-mono text-gray-900 text-sm">
                      {walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}` : 'N/A'}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {walletAddress && (
                      <>
                        <button 
                          onClick={() => copyToClipboard(walletAddress)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="Copy address"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <a
                          href={`${getBlockExplorerUrl(chainId)}/address/${walletAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                          title={`View on ${chainId === '0xaa36a7' ? 'Sepolia Etherscan' : 'Etherscan'}`}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </>
                    )}
                  </div>
                </div>

                {walletState.isConnectedToBackend && walletState.backendWalletData && (
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div>
                      <div className="text-sm text-green-700 mb-1">Backend Status:</div>
                      <div className="font-medium text-green-900">Connected to MediChain</div>
                    </div>
                    <button 
                      onClick={disconnectWalletFromBackend}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-200 hover:border-red-300 rounded"
                    >
                      Disconnect
                    </button>
                  </div>
                )}

                {/* Show network warning only if user should be on a different network */}
                {chainId && chainId !== '0xaa36a7' && (
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <div className="text-sm text-blue-700 mb-1">Recommended Network:</div>
                      <div className="font-medium text-blue-900">Switch to Sepolia Testnet for testing</div>
                    </div>
                    <Button variant="outline" onClick={switchToSepolia}>
                      Switch to Sepolia
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Recent Transactions */}
            {transactions.length > 0 ? (
              <Card title="Recent Transactions">
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{transaction.description}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(transaction.date).toLocaleDateString()} • {new Date(transaction.date).toLocaleTimeString()}
                          </div>
                          {transaction.txHash && (
                            <div className="text-xs text-gray-400 flex items-center mt-1">
                              <span className="mr-1">TX:</span>
                              <a
                                href={`${getBlockExplorerUrl(chainId)}/tx/${transaction.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {transaction.txHash.substring(0, 10)}...{transaction.txHash.substring(transaction.txHash.length - 6)}
                              </a>
                              <button 
                                onClick={() => copyToClipboard(transaction.txHash!)}
                                className="ml-1 text-blue-600 hover:text-blue-800"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className={`font-medium ${getTransactionColor(transaction.type)}`}>
                            {transaction.type === 'payment' || transaction.type === 'fee' ? '-' : '+'}
                            {transaction.amount} {transaction.currency}
                          </div>
                          {transaction.gasFee && (
                            <div className="text-xs text-gray-500">Gas: {transaction.gasFee} ETH</div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(transaction.status)}
                          <span className="text-sm text-gray-500 capitalize">{transaction.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : isMetaMaskConnected && !walletState.isConnectedToBackend ? (
              <Card title="Recent Transactions">
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <TrendingUp className="w-12 h-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Connect to MediChain</h3>
                  <p className="text-gray-600 mb-4">
                    Connect your wallet to MediChain backend to see your transaction history.
                  </p>
                  <Button 
                    variant="primary" 
                    onClick={connectWalletToBackend}
                    disabled={walletState.isLoadingBackendData}
                  >
                    {walletState.isLoadingBackendData ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Connect to MediChain
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            ) : isMetaMaskConnected && walletState.isConnectedToBackend && transactions.length === 0 ? (
              <Card title="Recent Transactions">
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <Clock className="w-12 h-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Yet</h3>
                  <p className="text-gray-600 mb-4">
                    Your transaction history will appear here when you make actual transactions from this wallet.
                  </p>
                  <div className="text-sm text-gray-500">
                    <p>Transactions will show when you:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Send payments to hospitals</li>
                      <li>Receive medical consultation rewards</li>
                      <li>Get health data sharing rewards</li>
                      <li>Pay network transaction fees</li>
                    </ul>
                  </div>
                </div>
              </Card>
            ) : null}

            {/* Quick Actions */}
            <Card title="Quick Actions">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button 
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  disabled={!isMetaMaskConnected}
                  onClick={() => {
                    console.log('Send payment clicked', {
                      isMetaMaskConnected,
                      walletState,
                      metaMaskAccount
                    });
                    setShowSendModal(true);
                  }}
                >
                  <Send className={`w-8 h-8 mb-2 ${isMetaMaskConnected ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${isMetaMaskConnected ? 'text-gray-900' : 'text-gray-400'}`}>
                    Send Payment
                  </span>
                  {!isMetaMaskConnected && (
                    <span className="text-xs text-gray-400 mt-1">Connect MetaMask first</span>
                  )}
                </button>
                <button 
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
                  onClick={() => walletAddress && copyToClipboard(walletAddress)}
                  disabled={!walletAddress}
                >
                  <ArrowDownLeft className={`w-8 h-8 mb-2 ${walletAddress ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${walletAddress ? 'text-gray-900' : 'text-gray-400'}`}>
                    Copy Address
                  </span>
                </button>
                <button 
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
                  disabled
                >
                  <Plus className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-400">Buy MEDI</span>
                  <span className="text-xs text-gray-400">(Coming Soon)</span>
                </button>
                <button 
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
                  disabled
                >
                  <TrendingUp className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-400">Stake Tokens</span>
                  <span className="text-xs text-gray-400">(Coming Soon)</span>
                </button>
              </div>
            </Card>
          </>
        )}

        {/* Send Payment Modal */}
        {showSendModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Send ETH Payment</h3>
                
                {transactionHash && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      <div className="text-sm">
                        <p className="font-medium text-green-800">Transaction Sent!</p>
                        <p className="text-green-600 font-mono text-xs">
                          {transactionHash.substring(0, 10)}...{transactionHash.substring(transactionHash.length - 6)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recipient Address *
                    </label>
                    <input
                      type="text"
                      value={sendForm.recipientAddress}
                      onChange={(e) => handleSendFormChange('recipientAddress', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm ${
                        sendForm.recipientAddress && !isValidEthereumAddress(sendForm.recipientAddress) 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-gray-300'
                      }`}
                      placeholder="0x..."
                    />
                    {sendForm.recipientAddress && !isValidEthereumAddress(sendForm.recipientAddress) && (
                      <p className="text-xs text-red-600 mt-1">Invalid Ethereum address</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (ETH) *
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={sendForm.amount}
                      onChange={(e) => handleSendFormChange('amount', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Note (optional)
                    </label>
                    <input
                      type="text"
                      value={sendForm.note}
                      onChange={(e) => handleSendFormChange('note', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Payment for..."
                    />
                  </div>

                  {/* Gas Estimation */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Estimated Gas Fee:</span>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={handleEstimateGas}
                          disabled={!sendForm.recipientAddress || !sendForm.amount || !isValidEthereumAddress(sendForm.recipientAddress) || isEstimatingGas}
                          className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                        >
                          {isEstimatingGas ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin inline mr-1" />
                              Estimating...
                            </>
                          ) : (
                            'Estimate'
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="text-sm">
                      {estimatedGas ? (
                        <span className="text-gray-900 font-medium">~{estimatedGas} ETH</span>
                      ) : (
                        <span className="text-gray-500">Click estimate to calculate</span>
                      )}
                    </div>
                  </div>

                  {/* Transaction Summary */}
                  {sendForm.amount && estimatedGas && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Transaction Summary</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Amount:</span>
                          <span className="font-medium">{sendForm.amount} ETH</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Gas Fee:</span>
                          <span className="font-medium">~{estimatedGas} ETH</span>
                        </div>
                        <div className="flex justify-between border-t pt-1">
                          <span className="text-gray-900 font-medium">Total:</span>
                          <span className="font-bold">~{(parseFloat(sendForm.amount) + parseFloat(estimatedGas)).toFixed(6)} ETH</span>
                        </div>
                      </div>
                    </div>
                  )}
                </form>

                <div className="flex space-x-3 mt-6">
                  <Button 
                    variant="outline" 
                    onClick={closeSendModal}
                    disabled={isSendingTransaction}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={handleSendPayment}
                    disabled={
                      !sendForm.recipientAddress || 
                      !sendForm.amount || 
                      !isValidEthereumAddress(sendForm.recipientAddress) ||
                      parseFloat(sendForm.amount) <= 0 ||
                      isSendingTransaction
                    }
                    className="flex-1"
                  >
                    {isSendingTransaction ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Payment
                      </>
                    )}
                  </Button>
                </div>

                <div className="mt-4 text-xs text-gray-500 text-center">
                  This will open MetaMask to confirm the transaction
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
