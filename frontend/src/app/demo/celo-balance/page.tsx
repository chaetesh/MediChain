'use client';

import React from 'react';
import CeloBalanceDemo from '../../../components/CeloBalanceDemo';

export default function CeloBalancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Celo Balance Viewer
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Connect your MetaMask wallet and switch to Celo networks (mainnet or Alfajores testnet) 
            to view your CELO, cUSD, and cEUR token balances. For testnet, you can use the provided 
            faucet links to get test tokens.
          </p>
        </div>

        <CeloBalanceDemo />

        <div className="mt-8 max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              About Celo Networks
            </h2>
            
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <h3 className="font-medium text-gray-800">Celo Mainnet</h3>
                <p>The main Celo network where real transactions occur with actual value.</p>
                <ul className="list-disc list-inside mt-1 text-xs">
                  <li>Chain ID: 0xa4ec (42220)</li>
                  <li>Native token: CELO</li>
                  <li>Stable tokens: cUSD, cEUR</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-800">Celo Alfajores Testnet</h3>
                <p>The test network for development and testing with no real value.</p>
                <ul className="list-disc list-inside mt-1 text-xs">
                  <li>Chain ID: 0xaef3 (44787)</li>
                  <li>Free test tokens available from faucets</li>
                  <li>Perfect for development and testing</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-800">Supported Tokens</h3>
                <ul className="list-disc list-inside text-xs">
                  <li><strong>CELO:</strong> Native governance and gas token</li>
                  <li><strong>cUSD:</strong> USD-pegged stable token</li>
                  <li><strong>cEUR:</strong> EUR-pegged stable token (availability varies by network)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
