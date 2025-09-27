'use client';

import React, { useEffect, useState } from 'react';
import { useMetaMaskWithSelf } from '../lib/hooks/useMetaMaskWithSelf';

export default function SelfCeloDemo() {
  const {
    isConnected,
    account,
    chainId,
    selfId,
    isCeloNetwork,
    isLoading,
    error,
    connect,
    disconnect,
    switchToCelo,
    switchToCeloAlfajores,
    connectSelfId,
    getSelfProfile,
    updateSelfProfile,
    getCeloBalance,
    sendCeloTransaction,
  } = useMetaMaskWithSelf();

  const [profile, setProfile] = useState<any>(null);
  const [celoBalances, setCeloBalances] = useState<any>(null);
  const [profileName, setProfileName] = useState('');
  const [profileDescription, setProfileDescription] = useState('');

  // Load profile when Self ID is connected
  useEffect(() => {
    if (selfId) {
      loadProfile();
    }
  }, [selfId]);

  // Load Celo balances when on Celo network
  useEffect(() => {
    if (isCeloNetwork && account) {
      loadCeloBalances();
    }
  }, [isCeloNetwork, account]);

  const loadProfile = async () => {
    try {
      const profileData = await getSelfProfile();
      setProfile(profileData);
      if (profileData) {
        setProfileName(profileData.name || '');
        setProfileDescription(profileData.description || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadCeloBalances = async () => {
    try {
      const balances = await getCeloBalance();
      setCeloBalances(balances);
    } catch (error) {
      console.error('Error loading Celo balances:', error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!selfId) return;

    try {
      const newProfile = {
        name: profileName,
        description: profileDescription,
        image: profile?.image || null,
      };
      
      await updateSelfProfile(newProfile);
      await loadProfile();
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  const handleSendCelo = async () => {
    if (!isCeloNetwork) return;

    const recipient = prompt('Enter recipient address:');
    const amount = prompt('Enter amount to send:');
    
    if (recipient && amount) {
      try {
        const txHash = await sendCeloTransaction(recipient, amount, 'CELO');
        if (txHash) {
          alert(`Transaction sent! Hash: ${txHash}`);
          await loadCeloBalances(); // Refresh balances
        } else {
          alert('Transaction failed');
        }
      } catch (error) {
        console.error('Error sending transaction:', error);
        alert('Transaction failed');
      }
    }
  };

  const getNetworkName = (chainId: string | null) => {
    switch (chainId) {
      case '0x1': return 'Ethereum Mainnet';
      case '0xaa36a7': return 'Sepolia Testnet';
      case '0x13882': return 'Polygon Amoy Testnet';
      case '0xa4ec': return 'Celo Mainnet';
      case '0xaef3': return 'Celo Alfajores Testnet';
      default: return 'Unknown Network';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Self ID + Celo Integration Demo
          </h1>

          {/* Connection Status */}
          <div className="mb-6 p-4 border rounded-lg">
            <h2 className="text-xl font-semibold mb-3">Connection Status</h2>
            
            {!isConnected ? (
              <div>
                <p className="text-gray-600 mb-4">Connect your MetaMask wallet to get started</p>
                <button
                  onClick={connect}
                  disabled={isLoading}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {isLoading ? 'Connecting...' : 'Connect MetaMask'}
                </button>
              </div>
            ) : (
              <div>
                <p className="text-green-600 mb-2">✅ MetaMask Connected</p>
                <p className="text-sm text-gray-600 mb-2">
                  Address: {account?.address}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Network: {getNetworkName(chainId)} ({chainId})
                </p>
                
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={disconnect}
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                  >
                    Disconnect
                  </button>
                  <button
                    onClick={switchToCelo}
                    className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                  >
                    Switch to Celo
                  </button>
                  <button
                    onClick={switchToCeloAlfajores}
                    className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                  >
                    Switch to Celo Testnet
                  </button>
                </div>

                {isCeloNetwork && (
                  <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
                    <p className="text-green-800 font-medium">🎉 Connected to Celo Network!</p>
                    <p className="text-green-600 text-sm">You can now use Celo-specific features</p>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 mt-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}
          </div>

          {isConnected && (
            <>
              {/* Self ID Section */}
              <div className="mb-6 p-4 border rounded-lg">
                <h2 className="text-xl font-semibold mb-3">Self ID Profile</h2>
                
                {!selfId ? (
                  <div>
                    <p className="text-gray-600 mb-4">
                      Connect to Self ID to manage your decentralized identity and profile
                    </p>
                    <button
                      onClick={connectSelfId}
                      className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
                    >
                      Connect Self ID
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-green-600 mb-2">✅ Self ID Connected</p>
                    <p className="text-sm text-gray-600 mb-4">DID: {account?.selfId}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-medium mb-2">Profile Information</h3>
                        {profile ? (
                          <div className="space-y-2">
                            <p><strong>Name:</strong> {profile.name || 'Not set'}</p>
                            <p><strong>Description:</strong> {profile.description || 'Not set'}</p>
                          </div>
                        ) : (
                          <p className="text-gray-500">No profile data found</p>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-2">Update Profile</h3>
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Name"
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            className="w-full p-2 border rounded text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Description"
                            value={profileDescription}
                            onChange={(e) => setProfileDescription(e.target.value)}
                            className="w-full p-2 border rounded text-sm"
                          />
                          <button
                            onClick={handleUpdateProfile}
                            className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600"
                          >
                            Update Profile
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Celo Section */}
              {isCeloNetwork && (
                <div className="mb-6 p-4 border rounded-lg">
                  <h2 className="text-xl font-semibold mb-3">Celo Features</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium mb-2">Token Balances</h3>
                      {celoBalances ? (
                        <div className="space-y-1 text-sm">
                          <p><strong>CELO:</strong> {parseFloat(celoBalances.CELO).toFixed(4)}</p>
                          <p><strong>cUSD:</strong> {parseFloat(celoBalances.cUSD).toFixed(4)}</p>
                          <p><strong>cEUR:</strong> {parseFloat(celoBalances.cEUR).toFixed(4)}</p>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">Loading balances...</p>
                      )}
                      <button
                        onClick={loadCeloBalances}
                        className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                      >
                        Refresh Balances
                      </button>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2">Send Transaction</h3>
                      <p className="text-gray-600 text-sm mb-2">
                        Send CELO tokens to another address
                      </p>
                      <button
                        onClick={handleSendCelo}
                        className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                      >
                        Send CELO
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Features Overview */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">Available Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h3 className="font-medium text-green-700 mb-2">✅ Implemented</h3>
                <ul className="space-y-1 text-gray-600">
                  <li>• MetaMask connection</li>
                  <li>• Celo network switching</li>
                  <li>• Self ID connection (basic)</li>
                  <li>• Celo token balance checking</li>
                  <li>• Basic profile management</li>
                  <li>• CELO token transactions</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-blue-700 mb-2">🔄 Available for Enhancement</h3>
                <ul className="space-y-1 text-gray-600">
                  <li>• Full Self ID authentication</li>
                  <li>• Advanced profile schemas</li>
                  <li>• cUSD/cEUR transactions</li>
                  <li>• Ceramic network integration</li>
                  <li>• DID document management</li>
                  <li>• Cross-chain identity</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
