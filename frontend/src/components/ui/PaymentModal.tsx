// frontend/src/components/ui/PaymentModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { WalletApiService } from '../../lib/services/wallet.service';
import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: (transactionHash?: string) => void;
  amount: string;
  serviceName: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  onPaymentComplete,
  amount,
  serviceName
}) => {
  const [connecting, setConnecting] = useState<boolean>(false);
  const [walletConnected, setWalletConnected] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  
  // Use a ref to track if a transaction has been sent in this modal session
  // This will persist across renders and ensure we never send multiple transactions
  const transactionSentRef = useRef<boolean>(false);
  
  // Reset all states when the modal is closed or opened
  useEffect(() => {
    if (isOpen) {
      // Reset the transaction sent ref when the modal opens
      transactionSentRef.current = false;
    }
    
    if (!isOpen) {
      // Reset all states when modal closes
      setProcessing(false);
      setError(null);
      setPaymentSuccess(false);
      setTransactionHash('');
      // Make extra sure the transaction sent ref is reset when modal closes
      transactionSentRef.current = false;
    }
  }, [isOpen]);
  
  // Check if MetaMask is available
  const [hasMetaMask, setHasMetaMask] = useState<boolean>(false);

  useEffect(() => {
    // Check if MetaMask is installed
    if (typeof window !== 'undefined' && window.ethereum) {
      setHasMetaMask(true);
      
      // Check if already connected
      checkIfWalletIsConnected();
    }
  }, []);
  
  // Check if wallet is already connected
  const checkIfWalletIsConnected = async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length > 0) {
        setWalletConnected(true);
        setWalletAddress(accounts[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConnectWallet = async () => {
    try {
      setError(null);
      setConnecting(true);
      
      if (!hasMetaMask) {
        setError('MetaMask is not installed. Please install MetaMask to continue.');
        return;
      }
      
      // Request account access from MetaMask
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length > 0) {
        setWalletConnected(true);
        setWalletAddress(accounts[0]);
        
        // Register the wallet in our backend too
        try {
          const result = await WalletApiService.connectWallet(accounts[0]);
          if (!result.success) {
            console.warn('Wallet connected to MetaMask but failed to register with backend');
          }
        } catch (err) {
          console.error('Error registering wallet with backend:', err);
        }
      } else {
        setError('No accounts found or access denied');
      }
    } catch (err) {
      setError('Error connecting wallet: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setConnecting(false);
    }
  };

  const handleConfirmPayment = async () => {
    // CRITICAL: Check if we've already sent a transaction in this modal session
    // This is our primary defense against double payments
    if (transactionSentRef.current) {
      console.log('Transaction already sent in this modal session. Ignoring additional payment attempts.');
      return;
    }
    
    // Secondary check: Also prevent if we're already processing
    if (processing) {
      console.log('Payment already in progress, ignoring additional clicks');
      return;
    }
    
    try {
      setError(null);
      setProcessing(true);
      
      if (!hasMetaMask || !walletConnected) {
        setError('MetaMask is not connected. Please connect your wallet first.');
        setProcessing(false);
        return;
      }
      
      // Parse the amount from the display string (e.g. "$0.05 USDC" -> 0.05)
      const amountValue = parseFloat(amount.replace(/[^0-9.]/g, ''));
      
      if (isNaN(amountValue)) {
        setError('Invalid payment amount');
        setProcessing(false);
        return;
      }
      
      // Get the current network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      console.log('Current chainId:', chainId);
      
      // Check if we're on Polygon Amoy testnet (chainId 80002)
      if (chainId !== '0x13882') {
        try {
          // Try to switch to Polygon Amoy testnet
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x13882' }], // Polygon Amoy testnet
          });
        } catch (switchError: any) {
          // If the network doesn't exist in MetaMask, add it
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: '0x13882',
                    chainName: 'Polygon Amoy Testnet',
                    nativeCurrency: {
                      name: 'MATIC',
                      symbol: 'MATIC',
                      decimals: 18
                    },
                    rpcUrls: ['https://polygon-amoy.g.alchemy.com/v2/demo'],
                    blockExplorerUrls: ['https://www.oklink.com/amoy'],
                  },
                ],
              });
            } catch (addError) {
              console.error('Error adding Polygon network:', addError);
              setError('Failed to add Polygon network to MetaMask. Please try adding the network manually.');
              setProcessing(false);
              return;
            }
          } else {
            setError('Failed to switch network in MetaMask');
            setProcessing(false);
            return;
          }
        }
      }
      
      // MediChain payment receiver address
      const receiverAddress = '0x2f7062B183ffb69C16701b5Eb735ad92f4071fed';
      
      // Convert the amount to wei (18 decimals for POL/MATIC)
      const amountInWei = ethers.parseUnits(amountValue.toString(), 18);
      
      // We'll use native POL/MATIC tokens instead of USDC
      
      // Create a new provider and signer instance
      if (!window.ethereum) {
        setError('MetaMask is not available');
        setProcessing(false);
        return;
      }
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      
      // Get fee data to estimate gas costs
      const feeData = await provider.getFeeData();
      
      // Get user's balance to verify they have enough funds
      const userAddress = await signer.getAddress();
      const balance = await provider.getBalance(userAddress);
      
      console.log('User balance:', ethers.formatUnits(balance, 18), 'POL/MATIC');
      console.log('Payment amount:', ethers.formatUnits(amountInWei, 18), 'POL/MATIC');
      
      // Estimate gas for the transaction
      const gasLimit = 21000; // Standard gas limit for simple transfers
      
      // Prepare transaction parameters with gas settings
      const txParams = {
        to: receiverAddress,
        value: amountInWei,
        gasLimit: gasLimit
      };
      
      // Add gas price if available - helps with transaction success
      if (feeData.gasPrice) {
        // Use a slightly higher gas price (20% more) to increase chances of success
        const adjustedGasPrice = feeData.gasPrice * BigInt(120) / BigInt(100);
        // @ts-ignore - TypeScript might complain about this property
        txParams.gasPrice = adjustedGasPrice;
        
        console.log('Using gas price:', ethers.formatUnits(adjustedGasPrice, 'gwei'), 'gwei');
      }
      
      // Check if user has enough balance for transaction + gas
      const estimatedGasCost = BigInt(gasLimit) * (feeData.gasPrice || BigInt(0));
      if (balance < (amountInWei + estimatedGasCost)) {
        throw new Error(`Insufficient balance. You have ${ethers.formatUnits(balance, 18)} POL/MATIC but need approximately ${ethers.formatUnits(amountInWei + estimatedGasCost, 18)} POL/MATIC (including gas).`);
      }
      
      console.log('Sending transaction with params:', txParams);
      
      // CRITICAL: Set the transaction sent ref to true BEFORE sending the transaction
      // This ensures we can't send another transaction even if the user clicks again
      // while this transaction is being processed by MetaMask
      console.log('🔒 Setting transaction lock - preventing further transactions');
      transactionSentRef.current = true;
      
      // Send the transaction using native POL/MATIC tokens
      console.log('💸 Sending transaction to MetaMask...');
      const tx = await signer.sendTransaction(txParams);
      
      console.log('Transaction sent! Hash:', tx.hash);
      setTransactionHash(tx.hash);
      
      // Update the success state immediately after transaction is sent
      setPaymentSuccess(true);
      setError(null);
      
      // Notify parent component of successful payment right away (pass transaction hash)
      // This will close the modal in the parent component
      onPaymentComplete(tx.hash);
      
      // No need to wait for confirmation to close modal - the parent will handle it
      
      // Wait for transaction confirmation in the background
      tx.wait().then((receipt) => {
        console.log('Payment successful:', receipt);
        // Transaction confirmed - but we've already notified the parent
      }).catch((waitError) => {
        console.error('Error waiting for transaction confirmation:', waitError);
        // Even though we couldn't get confirmation, the tx was sent and might still succeed
        // Don't do anything here since modal is already closed
      });
    } catch (err: any) {
      console.error('Payment error:', err);
      
      // Handle specific error types
      if (err.code === 4001) {
        // User rejected the transaction
        setError('Payment cancelled: You rejected the transaction in MetaMask');
      } else if (err.code === -32603) {
        // Internal JSON-RPC error
        setError('Payment failed: Internal JSON-RPC error. This could be due to network congestion, insufficient funds for gas, or an RPC endpoint issue. Try a smaller amount or check your wallet balance.');
      } else if (err.message && err.message.includes('insufficient funds')) {
        // Insufficient funds error
        setError('Payment failed: Insufficient funds. Make sure you have enough POL/MATIC for both the payment and gas fees.');
      } else {
        // Generic error
        setError('Payment failed: ' + (err instanceof Error ? err.message : String(err)));
      }
    } finally {
      setProcessing(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Payment Required</h2>
          <button 
            onClick={() => {
              // Reset states and close modal
              setProcessing(false);
              setError(null);
              setPaymentSuccess(false);
              // Reset the transaction sent flag to ensure a fresh start
              transactionSentRef.current = false;
              onClose();
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-700 mb-2">
            To generate a new risk assessment, a payment of <span className="font-semibold">{amount}</span> is required.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            This payment will be processed using POL tokens on the Polygon Amoy Testnet.
          </p>
          
          <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700 mb-4">
            <p className="font-medium mb-1">Service: {serviceName}</p>
            <p>Payment will be made in POL tokens to the MediChain service provider.</p>
          </div>
        </div>
        
        {!hasMetaMask ? (
          <div className="text-center mb-4">
            <p className="mb-2 text-amber-600">MetaMask is required for payments</p>
            <a 
              href="https://metamask.io/download/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Click here to install MetaMask
            </a>
          </div>
        ) : !walletConnected ? (
          <button
            onClick={handleConnectWallet}
            disabled={connecting}
            className="w-full flex items-center justify-center bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
          >
            {connecting ? (
              <span>Connecting...</span>
            ) : (
              <>
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" 
                  alt="MetaMask" 
                  className="w-6 h-6 mr-2"
                />
                Connect MetaMask
              </>
            )}
          </button>
        ) : (
          <div>
            <div className="bg-gray-100 p-3 rounded-md mb-4">
              <p className="text-sm text-gray-700 mb-1">Connected Wallet</p>
              <div className="flex items-center">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" 
                  alt="MetaMask" 
                  className="w-5 h-5 mr-2"
                />
                <p className="text-xs font-mono truncate">{walletAddress}</p>
              </div>
            </div>
            
            <button
              onClick={handleConfirmPayment}
              disabled={processing}
              className="w-full flex items-center justify-center bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-green-400"
            >
              {processing ? (
                <span>Processing in MetaMask...</span>
              ) : (
                <>
                  <svg 
                    className="w-5 h-5 mr-2" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm11 3a1 1 0 00-1-1H5a1 1 0 00-1 1v6a1 1 0 001 1h10a1 1 0 001-1V7z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M4 8h12v4H4V8z" clipRule="evenodd" />
                  </svg>
                  Pay {amount} in POL with MetaMask
                </>
              )}
            </button>
          </div>
        )}
        
        {paymentSuccess && transactionHash && (
          <div className="mt-4 p-3 bg-green-50 text-green-700 text-sm rounded-md">
            <div className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium">Transaction sent successfully!</p>
                <p className="mt-1">Transaction Hash:</p>
                <a 
                  href={`https://www.oklink.com/amoy/tx/${transactionHash}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 break-all font-mono text-xs"
                >
                  {transactionHash}
                </a>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">
            <p className="mb-1">{error}</p>
            {error.includes('Transaction was sent but confirmation timed out') && transactionHash && (
              <div className="mt-2">
                <p>You can check your transaction status here:</p>
                <a 
                  href={`https://www.oklink.com/amoy/tx/${transactionHash}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 break-all font-mono text-xs"
                >
                  {transactionHash}
                </a>
              </div>
            )}
            {error.includes('Failed to add Polygon network') && (
              <div className="mt-2 text-xs">
                <p className="font-medium">Manual network configuration:</p>
                <ul className="list-disc list-inside mt-1">
                  <li>Network Name: Polygon Amoy Testnet</li>
                  <li>RPC URL: https://polygon-amoy.g.alchemy.com/v2/demo</li>
                  <li>Chain ID: 80002 (0x13882 in hex)</li>
                  <li>Currency Symbol: MATIC</li>
                </ul>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-4 text-xs text-gray-500">
          <p className="text-center mb-1">
            Payments are processed securely using POL tokens on Polygon.
          </p>
          <p className="text-center text-amber-600">
            Note: You need testnet POL/MATIC tokens in your MetaMask wallet on Polygon Amoy network.
          </p>
          <p className="text-center mt-1">
            <a 
              href="https://faucet.polygon.technology/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Get testnet POL tokens from Polygon Faucet
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
