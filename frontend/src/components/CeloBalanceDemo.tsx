'use client';

import React, { useState, useEffect } from 'react';
import { useMetaMaskWithSelf } from '../lib/hooks/useMetaMaskWithSelf';
import { WalletApiService } from '../lib/services/wallet.service';

interface CeloBalances {
  CELO: string;
  cUSD: string;
  cEUR: string;
  network: string;
}

export const CeloBalanceDemo: React.FC = () => {
  const {
    isConnected,
    account,
    isCeloNetwork,
    isCeloTestnet,
    isCeloMainnet,
    connect,
    switchToCeloAlfajores,
    switchToCelo,
    getCeloBalance,
    getCeloTestnetFaucetInfo,
  } = useMetaMaskWithSelf();

  const [celoBalances, setCeloBalances] = useState<CeloBalances | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Celo balances when connected to Celo network
  const fetchCeloBalances = async () => {
    if (!isConnected || !account || !isCeloNetwork) return;

    setLoading(true);
    setError(null);

    try {
      const balances = await getCeloBalance();
      setCeloBalances(balances);
      
      // Also try to get balances from the API service
      try {
        if (isCeloTestnet()) {
          const apiBalances = await WalletApiService.getCeloTestnetWalletInfo(account.address);
          console.log('API Testnet Balances:', apiBalances);
        } else {
          const apiBalances = await WalletApiService.getCeloWalletInfo(account.address);
          console.log('API Mainnet Balances:', apiBalances);
        }
      } catch (apiError) {
        console.warn('API balance fetch failed:', apiError);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balances');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch balances when conditions are met
  useEffect(() => {
    if (isConnected && account && isCeloNetwork) {
      fetchCeloBalances();
    }
  }, [isConnected, account, isCeloNetwork]);

  const faucetInfo = getCeloTestnetFaucetInfo();

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Celo Balance Demo
      </h2>

      {!isConnected ? (
        <div className="text-center">
          <p className="text-gray-600 mb-4">Connect your wallet to view Celo balances</p>
          <button
            onClick={connect}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Connect MetaMask
          </button>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-600 mb-2">
            <strong>Account:</strong> {account?.address.slice(0, 6)}...{account?.address.slice(-4)}
          </p>

          {!isCeloNetwork ? (
            <div className="mb-4">
              <p className="text-orange-600 mb-2">
                Switch to Celo network to view balances
              </p>
              <div className="flex gap-2">
                <button
                  onClick={switchToCelo}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                >
                  Celo Mainnet
                </button>
                <button
                  onClick={switchToCeloAlfajores}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                >
                  Celo Testnet
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Network: <span className="text-green-600">
                    {isCeloMainnet() ? 'Celo Mainnet' : 'Celo Alfajores Testnet'}
                  </span>
                </p>
                
                {loading ? (
                  <p className="text-blue-500">Loading balances...</p>
                ) : error ? (
                  <div>
                    <p className="text-red-500 mb-2">Error: {error}</p>
                    <button
                      onClick={fetchCeloBalances}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Retry
                    </button>
                  </div>
                ) : celoBalances ? (
                  <div className="bg-gray-50 p-4 rounded">
                    <h3 className="font-medium mb-2">Token Balances:</h3>
                    <div className="space-y-1 text-sm">
                      <p><strong>CELO:</strong> {celoBalances.CELO}</p>
                      <p><strong>cUSD:</strong> {celoBalances.cUSD}</p>
                      <p><strong>cEUR:</strong> {celoBalances.cEUR}</p>
                    </div>
                    <button
                      onClick={fetchCeloBalances}
                      className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                    >
                      Refresh
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={fetchCeloBalances}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    Load Balances
                  </button>
                )}
              </div>

              {/* Show faucet info for testnet */}
              {isCeloTestnet() && faucetInfo && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
                  <h3 className="font-medium text-yellow-800 mb-2">
                    Testnet Faucet
                  </h3>
                  <p className="text-xs text-yellow-700 mb-2">
                    {faucetInfo.instructions}
                  </p>
                  <div className="flex flex-col gap-2">
                    <a
                      href={faucetInfo.celoFaucet}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs text-center"
                    >
                      Get CELO Tokens
                    </a>
                    <a
                      href={faucetInfo.cUSDFaucet}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs text-center"
                    >
                      Get cUSD Tokens
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CeloBalanceDemo;
