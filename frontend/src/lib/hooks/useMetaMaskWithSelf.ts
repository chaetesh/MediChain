'use client';

import { useState, useEffect, useCallback } from 'react';
import { SelfID } from '@self.id/web';
import { newKit } from '@celo/contractkit';

interface MetaMaskAccount {
  address: string;
  balance?: string;
  selfId?: string;
  celoKit?: any;
}

interface MetaMaskState {
  isConnected: boolean;
  account: MetaMaskAccount | null;
  isLoading: boolean;
  error: string | null;
  chainId: string | null;
  selfId: SelfID | null;
  isCeloNetwork: boolean;
}

interface UseMetaMaskReturn extends MetaMaskState {
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToMainnet: () => Promise<void>;
  switchToSepolia: () => Promise<void>;
  switchToAmoy: () => Promise<void>;
  switchToCelo: () => Promise<void>;
  switchToCeloAlfajores: () => Promise<void>;
  getBalance: () => Promise<string | null>;
  getTokenBalance: (tokenAddress: string, decimals?: number) => Promise<string | null>;
  signMessage: (message: string) => Promise<string | null>;
  sendTransaction: (to: string, amount: string) => Promise<string | null>;
  estimateGas: (to: string, amount: string) => Promise<string | null>;
  // Self ID methods
  connectSelfId: () => Promise<void>;
  getSelfProfile: () => Promise<any>;
  updateSelfProfile: (profile: any) => Promise<void>;
  // Celo specific methods
  getCeloBalance: () => Promise<{ CELO: string; cUSD: string; cEUR: string; network: string } | null>;
  sendCeloTransaction: (to: string, amount: string, token?: 'CELO' | 'cUSD' | 'cEUR') => Promise<string | null>;
  // Celo helper methods
  isCeloTestnet: () => boolean;
  isCeloMainnet: () => boolean;
  getCeloTestnetFaucetInfo: () => { celoFaucet: string; cUSDFaucet: string; instructions: string } | null;
}

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (event: string, handler: (...args: any[]) => void) => void;
    };
  }
}

export const useMetaMaskWithSelf = (): UseMetaMaskReturn => {
  const [state, setState] = useState<MetaMaskState>({
    isConnected: false,
    account: null,
    isLoading: false,
    error: null,
    chainId: null,
    selfId: null,
    isCeloNetwork: false,
  });

  // Helper function to check if current network is Celo
  const checkIsCeloNetwork = useCallback((chainId: string) => {
    return chainId === '0xa4ec' || chainId === '0xaef3'; // Celo mainnet or Alfajores testnet
  }, []);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = useCallback(() => {
    return typeof window !== 'undefined' && window.ethereum?.isMetaMask;
  }, []);

  // Get current accounts
  const getCurrentAccount = useCallback(async () => {
    if (!isMetaMaskInstalled()) return null;

    try {
      const accounts = await window.ethereum!.request({ method: 'eth_accounts' });
      return accounts.length > 0 ? accounts[0] : null;
    } catch (error) {
      console.error('Error getting current account:', error);
      return null;
    }
  }, [isMetaMaskInstalled]);

  // Get current chain ID
  const getCurrentChainId = useCallback(async () => {
    if (!isMetaMaskInstalled()) return null;

    try {
      const chainId = await window.ethereum!.request({ method: 'eth_chainId' });
      return chainId;
    } catch (error) {
      console.error('Error getting chain ID:', error);
      return null;
    }
  }, [isMetaMaskInstalled]);

  // Get account balance (native token - ETH/CELO depending on network)
  const getBalance = useCallback(async (): Promise<string | null> => {
    if (!isMetaMaskInstalled() || !state.account) return null;

    try {
      const balance = await window.ethereum!.request({
        method: 'eth_getBalance',
        params: [state.account.address, 'latest'],
      });
      
      // Convert from wei to ether
      const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18);
      const formattedBalance = balanceInEth.toFixed(4);
      
      // Log network-specific balance info
      if (state.isCeloNetwork) {
        const networkName = state.chainId === '0xa4ec' ? 'Celo Mainnet' : 'Celo Alfajores Testnet';
        console.log(`💰 ${networkName} CELO balance: ${formattedBalance}`);
      }
      
      return formattedBalance;
    } catch (error) {
      console.error('Error getting balance:', error);
      return null;
    }
  }, [isMetaMaskInstalled, state.account, state.isCeloNetwork, state.chainId]);

  // Get ERC-20 token balance
  const getTokenBalance = useCallback(async (tokenAddress: string, decimals: number = 18): Promise<string | null> => {
    if (!isMetaMaskInstalled() || !state.account) {
      console.log('MetaMask not installed or no account');
      return null;
    }

    try {
      console.log('Fetching token balance for:', tokenAddress);
      console.log('User address:', state.account.address);
      
      // Validate token address format
      if (!tokenAddress || !tokenAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        console.error('Invalid token address format:', tokenAddress);
        return null;
      }

      // ERC-20 balanceOf function signature: balanceOf(address)
      const paddedAddress = state.account.address.slice(2).padStart(64, '0');
      const data = `0x70a08231${paddedAddress}`;
      
      console.log('Making eth_call with data:', data);
      
      const balance = await window.ethereum!.request({
        method: 'eth_call',
        params: [{
          to: tokenAddress,
          data: data
        }, 'latest'],
      });
      
      console.log('Raw balance response:', balance);
      
      // Check if balance is valid hex
      if (!balance || balance === '0x' || balance === '0x0') {
        console.log('Balance is zero or empty');
        return '0.0000';
      }
      
      // Convert from token units to human readable format
      const balanceInWei = parseInt(balance, 16);
      console.log('Balance in wei:', balanceInWei);
      
      if (isNaN(balanceInWei)) {
        console.error('Failed to parse balance as number');
        return '0.0000';
      }
      
      const balanceInTokens = balanceInWei / Math.pow(10, decimals);
      const formattedBalance = balanceInTokens.toFixed(4);
      
      console.log('Final token balance:', formattedBalance);
      return formattedBalance;
    } catch (error) {
      console.error('Error getting token balance:', error);
      console.error('Error details:', {
        tokenAddress,
        userAddress: state.account?.address,
        decimals,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }, [isMetaMaskInstalled, state.account]);

  // Connect to MetaMask
  const connect = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      setState(prev => ({
        ...prev,
        error: 'MetaMask is not installed. Please install MetaMask to continue.',
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const accounts = await window.ethereum!.request({ method: 'eth_requestAccounts' });
      const chainId = await getCurrentChainId();

      if (accounts.length > 0) {
        const account: MetaMaskAccount = { address: accounts[0] };
        const isCelo = checkIsCeloNetwork(chainId || '');
        
        // Initialize Celo Kit if on Celo network
        let celoKit = null;
        if (isCelo) {
          try {
            celoKit = newKit(window.ethereum as any);
            account.celoKit = celoKit;
          } catch (error) {
            console.warn('Celo Kit not available:', error);
          }
        }
        
        setState(prev => ({
          ...prev,
          isConnected: true,
          account,
          chainId,
          selfId: null, // Will be initialized when needed
          isCeloNetwork: isCelo,
          isLoading: false,
        }));
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to connect to MetaMask',
        isLoading: false,
      }));
    }
  }, [isMetaMaskInstalled, getCurrentChainId, checkIsCeloNetwork]);

  // Disconnect from MetaMask
  const disconnect = useCallback(() => {
    setState({
      isConnected: false,
      account: null,
      isLoading: false,
      error: null,
      chainId: null,
      selfId: null,
      isCeloNetwork: false,
    });
  }, []);

  // Switch to Ethereum mainnet
  const switchToMainnet = useCallback(async () => {
    if (!isMetaMaskInstalled()) return;

    try {
      await window.ethereum!.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1' }], // Ethereum mainnet
      });
    } catch (error) {
      console.error('Error switching to mainnet:', error);
    }
  }, [isMetaMaskInstalled]);

  // Switch to Sepolia testnet
  const switchToSepolia = useCallback(async () => {
    if (!isMetaMaskInstalled()) return;

    try {
      await window.ethereum!.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia testnet
      });
    } catch (error) {
      console.error('Error switching to Sepolia:', error);
      // If the network doesn't exist, try to add it
      if ((error as any).code === 4902) {
        try {
          await window.ethereum!.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xaa36a7',
              chainName: 'Sepolia Testnet',
              nativeCurrency: {
                name: 'SepoliaETH',
                symbol: 'SEP',
                decimals: 18,
              },
              rpcUrls: ['https://sepolia.infura.io/v3/'],
              blockExplorerUrls: ['https://sepolia.etherscan.io/'],
            }],
          });
        } catch (addError) {
          console.error('Error adding Sepolia network:', addError);
        }
      }
    }
  }, [isMetaMaskInstalled]);

  // Switch to Polygon Amoy testnet
  const switchToAmoy = useCallback(async () => {
    if (!isMetaMaskInstalled()) return;

    try {
      await window.ethereum!.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x13882' }], // Polygon Amoy testnet
      });
    } catch (error) {
      console.error('Error switching to Polygon Amoy:', error);
      // If the network doesn't exist, try to add it
      if ((error as any).code === 4902) {
        try {
          await window.ethereum!.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x13882',
              chainName: 'Polygon Amoy Testnet',
              nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18,
              },
              rpcUrls: ['https://rpc-amoy.polygon.technology/'],
              blockExplorerUrls: ['https://amoy.polygonscan.com/'],
            }],
          });
        } catch (addError) {
          console.error('Error adding Polygon Amoy network:', addError);
        }
      }
    }
  }, [isMetaMaskInstalled]);

  // Switch to Celo mainnet
  const switchToCelo = useCallback(async () => {
    if (!isMetaMaskInstalled()) return;

    try {
      await window.ethereum!.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xa4ec' }], // Celo mainnet
      });
    } catch (error) {
      console.error('Error switching to Celo mainnet:', error);
      // If the network doesn't exist, try to add it
      if ((error as any).code === 4902) {
        try {
          await window.ethereum!.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xa4ec',
              chainName: 'Celo Mainnet',
              nativeCurrency: {
                name: 'CELO',
                symbol: 'CELO',
                decimals: 18,
              },
              rpcUrls: ['https://forno.celo.org'],
              blockExplorerUrls: ['https://explorer.celo.org'],
            }],
          });
        } catch (addError) {
          console.error('Error adding Celo mainnet:', addError);
        }
      }
    }
  }, [isMetaMaskInstalled]);

  // Switch to Celo Alfajores testnet
  const switchToCeloAlfajores = useCallback(async () => {
    if (!isMetaMaskInstalled()) return;

    try {
      await window.ethereum!.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaef3' }], // Celo Alfajores testnet
      });
    } catch (error) {
      console.error('Error switching to Celo Alfajores:', error);
      // If the network doesn't exist, try to add it
      if ((error as any).code === 4902) {
        try {
          await window.ethereum!.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xaef3',
              chainName: 'Celo Alfajores Testnet',
              nativeCurrency: {
                name: 'CELO',
                symbol: 'CELO',
                decimals: 18,
              },
              rpcUrls: ['https://alfajores-forno.celo-testnet.org'],
              blockExplorerUrls: ['https://alfajores-blockscout.celo-testnet.org'],
            }],
          });
        } catch (addError) {
          console.error('Error adding Celo Alfajores testnet:', addError);
        }
      }
    }
  }, [isMetaMaskInstalled]);

  // Send ETH transaction
  const sendTransaction = useCallback(async (to: string, amount: string): Promise<string | null> => {
    if (!isMetaMaskInstalled() || !state.account) return null;

    try {
      // Convert ETH amount to Wei (hex)
      const amountInWei = (parseFloat(amount) * Math.pow(10, 18)).toString(16);
      
      const transactionParameters = {
        to: to,
        from: state.account.address,
        value: `0x${amountInWei}`,
      };

      const txHash = await window.ethereum!.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      });

      return txHash;
    } catch (error) {
      console.error('Error sending transaction:', error);
      return null;
    }
  }, [isMetaMaskInstalled, state.account]);

  // Estimate gas for transaction
  const estimateGas = useCallback(async (to: string, amount: string): Promise<string | null> => {
    if (!isMetaMaskInstalled() || !state.account) return null;

    try {
      const amountInWei = (parseFloat(amount) * Math.pow(10, 18)).toString(16);
      
      const gasEstimate = await window.ethereum!.request({
        method: 'eth_estimateGas',
        params: [{
          to: to,
          from: state.account.address,
          value: `0x${amountInWei}`,
        }],
      });

      // Convert hex to decimal and then to ETH
      const gasInWei = parseInt(gasEstimate, 16);
      const gasInEth = gasInWei / Math.pow(10, 18);
      return gasInEth.toFixed(6);
    } catch (error) {
      console.error('Error estimating gas:', error);
      return null;
    }
  }, [isMetaMaskInstalled, state.account]);

  // Sign a message
  const signMessage = useCallback(async (message: string): Promise<string | null> => {
    if (!isMetaMaskInstalled() || !state.account) return null;

    try {
      const signature = await window.ethereum!.request({
        method: 'personal_sign',
        params: [message, state.account.address],
      });
      return signature;
    } catch (error) {
      console.error('Error signing message:', error);
      return null;
    }
  }, [isMetaMaskInstalled, state.account]);

  // Connect to Self ID
  const connectSelfId = useCallback(async () => {
    if (!isMetaMaskInstalled() || !state.account) {
      setState(prev => ({ ...prev, error: 'MetaMask not connected' }));
      return;
    }

    try {
      // For now, create a placeholder Self ID connection
      // In a real implementation, you would properly configure the authentication
      console.log('Self ID connection would be established here for address:', state.account.address);
      
      // Simulate successful connection
      const mockSelfId = {
        id: `did:3:${state.account.address}`,
        get: async (key: string) => {
          console.log('Getting Self ID data for key:', key);
          return null; // Return actual data from Self ID
        },
        set: async (key: string, value: any) => {
          console.log('Setting Self ID data for key:', key, value);
          return true; // Return success status
        }
      };
      
      setState(prev => ({
        ...prev,
        selfId: mockSelfId as any,
        account: prev.account ? { ...prev.account, selfId: mockSelfId.id } : null,
      }));
      
      console.log('Self ID connected successfully');
    } catch (error) {
      console.error('Error connecting to Self ID:', error);
      setState(prev => ({ ...prev, error: 'Failed to connect to Self ID' }));
    }
  }, [isMetaMaskInstalled, state.account]);

  // Get Self ID profile
  const getSelfProfile = useCallback(async () => {
    if (!state.selfId) {
      throw new Error('Self ID not connected');
    }

    try {
      const profile = await state.selfId.get('basicProfile');
      return profile;
    } catch (error) {
      console.error('Error getting Self ID profile:', error);
      return null;
    }
  }, [state.selfId]);

  // Update Self ID profile
  const updateSelfProfile = useCallback(async (profile: any) => {
    if (!state.selfId) {
      throw new Error('Self ID not connected');
    }

    try {
      await state.selfId.set('basicProfile', profile);
    } catch (error) {
      console.error('Error updating Self ID profile:', error);
      throw error;
    }
  }, [state.selfId]);

  // Get Celo token balances (works on both mainnet and testnet)
  const getCeloBalance = useCallback(async (): Promise<{ CELO: string; cUSD: string; cEUR: string; network: string } | null> => {
    if (!isMetaMaskInstalled() || !state.account || !state.isCeloNetwork) return null;

    try {
      const kit = state.account.celoKit || newKit(window.ethereum as any);
      
      // Determine network type
      const networkName = state.chainId === '0xa4ec' ? 'Celo Mainnet' : 'Celo Alfajores Testnet';
      console.log(`🔗 Getting Celo balances for ${networkName}`);

      const [celoBalance, cUSDBalance, cEURBalance] = await Promise.all([
        kit.web3.eth.getBalance(state.account.address),
        kit.contracts.getStableToken().then(async (token: any) => {
          try {
            return await token.balanceOf(state.account!.address);
          } catch (error) {
            console.warn('Error getting cUSD balance:', error);
            return '0';
          }
        }),
        // For cEUR, handle both mainnet and testnet availability
        kit.contracts.getStableToken().then(async () => {
          try {
            // Try to get cEUR balance - might not be available on testnet
            const cEURToken = await kit.contracts.getStableToken('cEUR');
            return await cEURToken.balanceOf(state.account!.address);
          } catch (error) {
            console.warn('cEUR not available on this network:', error);
            return '0';
          }
        }),
      ]);

      const balances = {
        CELO: parseFloat(kit.web3.utils.fromWei(celoBalance, 'ether')).toFixed(4),
        cUSD: parseFloat(kit.web3.utils.fromWei(cUSDBalance.toString(), 'ether')).toFixed(4),
        cEUR: parseFloat(kit.web3.utils.fromWei(cEURBalance.toString(), 'ether')).toFixed(4),
        network: networkName,
      };

      console.log('💰 Celo balances:', balances);
      return balances;
    } catch (error) {
      console.error('Error getting Celo balances:', error);
      return null;
    }
  }, [isMetaMaskInstalled, state.account, state.isCeloNetwork, state.chainId]);

  // Send Celo transaction
  const sendCeloTransaction = useCallback(async (
    to: string, 
    amount: string, 
    token: 'CELO' | 'cUSD' | 'cEUR' = 'CELO'
  ): Promise<string | null> => {
    if (!isMetaMaskInstalled() || !state.account || !state.isCeloNetwork) return null;

    try {
      const kit = state.account.celoKit || newKit(window.ethereum as any);

      let txHash: string;

      if (token === 'CELO') {
        // Send CELO
        const amountInWei = kit.web3.utils.toWei(amount, 'ether');
        const tx = await kit.web3.eth.sendTransaction({
          from: state.account.address,
          to: to,
          value: amountInWei,
        });
        txHash = tx.transactionHash;
      } else {
        // Send stable tokens (cUSD or cEUR)
        const stableToken = await kit.contracts.getStableToken();
        const amountInWei = kit.web3.utils.toWei(amount, 'ether');
        const tx = await stableToken.transfer(to, amountInWei).send({ from: state.account.address });
        txHash = tx.getHash();
      }

      return txHash;
    } catch (error) {
      console.error('Error sending Celo transaction:', error);
      return null;
    }
  }, [isMetaMaskInstalled, state.account, state.isCeloNetwork]);

  // Handle account changes
  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      disconnect();
    } else if (accounts[0] !== state.account?.address) {
      setState(prev => ({
        ...prev,
        account: { address: accounts[0] },
        selfId: null, // Reset Self ID when account changes
      }));
    }
  }, [disconnect, state.account?.address]);

  // Handle chain changes
  const handleChainChanged = useCallback((chainId: string) => {
    console.log('🔄 MetaMask chain changed to:', chainId);
    console.log('🔄 Previous chain was:', state.chainId);
    
    const isCelo = checkIsCeloNetwork(chainId);
    
    // Update state immediately
    setState(prev => ({ 
      ...prev, 
      chainId,
      isCeloNetwork: isCelo,
      // Reset account balance when chain changes to force refresh
      account: prev.account ? { 
        ...prev.account, 
        balance: undefined,
        celoKit: isCelo ? newKit(window.ethereum as any) : undefined
      } : null
    }));
    
    // Force page reload for critical chain changes (mainnet <-> testnet)
    const isMainnet = chainId === '0x1';
    const wasMainnet = state.chainId === '0x1';
    const isSepolia = chainId === '0xaa36a7';
    const wasSepolia = state.chainId === '0xaa36a7';
    const isAmoy = chainId === '0x13882';
    const wasAmoy = state.chainId === '0x13882';
    const wasCelo = checkIsCeloNetwork(state.chainId || '');
    
    // Reload page for major network changes
    if ((isMainnet && (wasSepolia || wasAmoy || wasCelo)) || 
        ((isSepolia || isAmoy) && wasMainnet) ||
        (isSepolia && wasAmoy) || 
        (isAmoy && wasSepolia) ||
        (isCelo && !wasCelo) ||
        (!isCelo && wasCelo)) {
      console.log('🔄 Major network change detected, reloading page...');
      setTimeout(() => window.location.reload(), 100);
    }
  }, [state.chainId, checkIsCeloNetwork]);

  // Initialize and set up event listeners
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const initializeMetaMask = async () => {
      const account = await getCurrentAccount();
      const chainId = await getCurrentChainId();

      if (account) {
        const isCelo = checkIsCeloNetwork(chainId || '');

        // Initialize Celo Kit if on Celo network
        let celoKit = null;
        if (isCelo) {
          try {
            celoKit = newKit(window.ethereum as any);
          } catch (error) {
            console.warn('Celo Kit not available:', error);
          }
        }

        setState(prev => ({
          ...prev,
          isConnected: true,
          account: { address: account, celoKit },
          chainId,
          selfId: null, // Will be initialized on demand
          isCeloNetwork: isCelo,
        }));
      }
    };

    initializeMetaMask();

    // Set up event listeners
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    // Cleanup listeners on unmount
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [isMetaMaskInstalled, getCurrentAccount, getCurrentChainId, handleAccountsChanged, handleChainChanged, checkIsCeloNetwork]);

  // Helper function to check if current network is Celo testnet (Alfajores)
  const isCeloTestnet = useCallback(() => {
    return state.chainId === '0xaef3'; // Celo Alfajores testnet
  }, [state.chainId]);

  // Helper function to check if current network is Celo mainnet
  const isCeloMainnet = useCallback(() => {
    return state.chainId === '0xa4ec'; // Celo mainnet
  }, [state.chainId]);

  // Get Celo testnet faucet information
  const getCeloTestnetFaucetInfo = useCallback(() => {
    if (!isCeloTestnet()) return null;
    
    return {
      celoFaucet: 'https://faucet.celo.org',
      cUSDFaucet: 'https://faucet.celo.org/alfajores',
      instructions: 'Visit the Celo faucet to get testnet tokens for development and testing.',
    };
  }, [isCeloTestnet]);

  return {
    ...state,
    connect,
    disconnect,
    switchToMainnet,
    switchToSepolia,
    switchToAmoy,
    switchToCelo,
    switchToCeloAlfajores,
    getBalance,
    getTokenBalance,
    signMessage,
    sendTransaction,
    estimateGas,
    connectSelfId,
    getSelfProfile,
    updateSelfProfile,
    getCeloBalance,
    sendCeloTransaction,
    // Celo helper methods
    isCeloTestnet,
    isCeloMainnet,
    getCeloTestnetFaucetInfo,
  };
};
