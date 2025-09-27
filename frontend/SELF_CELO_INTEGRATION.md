# Self ID + Celo Integration Documentation

## Overview

This implementation adds Self onchain SDK integration with Celo mainnet and testnet support to the MediChain Web3 application. The integration provides decentralized identity management and Celo blockchain functionality.

## Features Implemented

### 1. Self ID Integration
- **Decentralized Identity (DID)**: Connect and manage Self ID profiles
- **Profile Management**: Create and update decentralized profiles
- **Cross-chain Identity**: Identity that works across different networks
- **Ceramic Network**: Built on Ceramic for decentralized data storage

### 2. Celo Network Support
- **Celo Mainnet**: Full production network support
- **Celo Alfajores Testnet**: Development and testing environment
- **Multi-token Support**: CELO, cUSD, and cEUR tokens
- **Native Transactions**: Send and receive Celo ecosystem tokens

### 3. Enhanced MetaMask Hook
- **Extended useMetaMask**: Original functionality preserved
- **useMetaMaskWithSelf**: New hook with Self ID and Celo support
- **Network Switching**: Easy switching between Ethereum and Celo networks
- **Balance Checking**: Real-time balance updates for all supported tokens

## Technical Implementation

### Dependencies Added
```json
{
  "@self.id/framework": "^0.4.0",
  "@self.id/web": "^0.5.0",
  "@celo/contractkit": "latest"
}
```

### New Hook: useMetaMaskWithSelf

```typescript
const {
  // Standard MetaMask functionality
  isConnected,
  account,
  chainId,
  connect,
  disconnect,
  getBalance,
  sendTransaction,
  
  // New Self ID functionality
  selfId,
  connectSelfId,
  getSelfProfile,
  updateSelfProfile,
  
  // New Celo functionality
  isCeloNetwork,
  switchToCelo,
  switchToCeloAlfajores,
  getCeloBalance,
  sendCeloTransaction,
} = useMetaMaskWithSelf();
```

### Network Configuration

#### Celo Mainnet
- **Chain ID**: `0xa4ec` (42220)
- **RPC URL**: `https://forno.celo.org`
- **Block Explorer**: `https://explorer.celo.org`
- **Native Currency**: CELO

#### Celo Alfajores Testnet
- **Chain ID**: `0xaef3` (44787)
- **RPC URL**: `https://alfajores-forno.celo-testnet.org`
- **Block Explorer**: `https://alfajores-blockscout.celo-testnet.org`
- **Native Currency**: CELO (testnet)

## Usage Examples

### Basic Connection
```typescript
import { useMetaMaskWithSelf } from '@/lib/hooks/useMetaMask';

function MyComponent() {
  const { connect, isConnected, account } = useMetaMaskWithSelf();
  
  return (
    <div>
      {!isConnected ? (
        <button onClick={connect}>Connect Wallet</button>
      ) : (
        <p>Connected: {account?.address}</p>
      )}
    </div>
  );
}
```

### Self ID Integration
```typescript
function SelfIdProfile() {
  const { 
    selfId, 
    connectSelfId, 
    getSelfProfile, 
    updateSelfProfile 
  } = useMetaMaskWithSelf();
  
  const handleConnectSelfId = async () => {
    await connectSelfId();
  };
  
  const handleUpdateProfile = async () => {
    await updateSelfProfile({
      name: 'John Doe',
      description: 'Medical professional',
    });
  };
  
  return (
    <div>
      {!selfId ? (
        <button onClick={handleConnectSelfId}>Connect Self ID</button>
      ) : (
        <button onClick={handleUpdateProfile}>Update Profile</button>
      )}
    </div>
  );
}
```

### Celo Network Usage
```typescript
function CeloFeatures() {
  const { 
    isCeloNetwork, 
    switchToCelo, 
    getCeloBalance, 
    sendCeloTransaction 
  } = useMetaMaskWithSelf();
  
  const handleSwitchToCelo = async () => {
    await switchToCelo();
  };
  
  const handleSendCelo = async () => {
    const txHash = await sendCeloTransaction(
      '0x...recipient', 
      '1.0', 
      'CELO'
    );
    console.log('Transaction hash:', txHash);
  };
  
  return (
    <div>
      {!isCeloNetwork ? (
        <button onClick={handleSwitchToCelo}>Switch to Celo</button>
      ) : (
        <button onClick={handleSendCelo}>Send CELO</button>
      )}
    </div>
  );
}
```

## API Integration

### Wallet Service Extensions

New methods added to `WalletApiService`:

```typescript
// Connect wallet with Celo support
await WalletApiService.connectWalletWithCelo(address, chainId);

// Get Celo-specific wallet info
await WalletApiService.getCeloWalletInfo(address);

// Register Self ID
await WalletApiService.registerSelfId(address, did, profile);

// Get Self ID info
await WalletApiService.getSelfIdInfo(address);
```

## Demo Component

A comprehensive demo is available at `/demo/self-celo` that showcases:
- MetaMask connection with multiple networks
- Self ID profile management
- Celo token balance checking
- Transaction sending on Celo network
- Real-time network switching

## Development Notes

### Current Implementation Status
- ✅ MetaMask integration with Celo networks
- ✅ Basic Self ID connection structure
- ✅ Celo token balance checking
- ✅ CELO token transactions
- ✅ Network switching functionality
- ✅ Demo interface

### Areas for Enhancement
- 🔄 Full Self ID Ceramic authentication
- 🔄 Advanced DID document management
- 🔄 cUSD/cEUR transaction support
- 🔄 Cross-chain identity verification
- 🔄 Integration with medical record verification

### Security Considerations
- All private keys remain in user's MetaMask wallet
- Self ID data is stored on decentralized Ceramic network
- No sensitive data is stored on centralized servers
- All transactions require user approval through MetaMask

## Testing

### Recommended Testing Flow
1. **Connect MetaMask** to the application
2. **Switch to Celo Alfajores** testnet for safe testing
3. **Get testnet CELO** from Celo faucet
4. **Connect Self ID** to test decentralized identity
5. **Test Celo transactions** with small amounts
6. **Update Self ID profile** to test data persistence

### Testnet Resources
- **Celo Alfajores Faucet**: https://faucet.celo.org
- **Celo Testnet Explorer**: https://alfajores-blockscout.celo-testnet.org
- **Self ID Testnet**: Uses Ceramic testnet-clay

## Troubleshooting

### Common Issues
1. **Network not added**: Use the built-in network switching to auto-add Celo networks
2. **Self ID connection fails**: Ensure MetaMask is connected first
3. **Transaction failures**: Check sufficient balance and network connectivity
4. **Profile updates not saving**: Verify Self ID connection and try reconnecting

### Error Handling
The implementation includes comprehensive error handling for:
- Network connection issues
- Transaction failures
- Self ID authentication problems
- Invalid wallet addresses
- Insufficient balances

## Integration with MediChain

This Self ID + Celo integration enhances MediChain's capabilities by:
- **Decentralized Identity**: Patients and doctors can have verifiable digital identities
- **Cross-border Payments**: Use Celo's stable tokens for international medical payments
- **Reduced Fees**: Celo's low transaction fees for micropayments
- **Mobile-First**: Celo's mobile-optimized blockchain for accessibility
- **Stable Value**: cUSD and cEUR for price-stable medical transactions

## Future Roadmap

### Phase 1 (Current)
- ✅ Basic Self ID and Celo integration
- ✅ Network switching and balance checking
- ✅ Simple transaction sending

### Phase 2 (Planned)
- 🔄 Advanced Self ID schemas for medical professionals
- 🔄 Integration with medical license verification
- 🔄 Celo smart contract deployment for medical records
- 🔄 Cross-chain identity bridging

### Phase 3 (Future)
- 🔄 Full Ceramic integration for decentralized data
- 🔄 Advanced Celo DeFi features
- 🔄 Multi-signature medical record access
- 🔄 Integration with other identity standards

## Resources

- **Self ID Documentation**: https://developers.ceramic.network/tools/self-id/
- **Celo Developer Docs**: https://docs.celo.org/
- **Ceramic Network**: https://ceramic.network/
- **MetaMask Integration**: https://docs.metamask.io/
