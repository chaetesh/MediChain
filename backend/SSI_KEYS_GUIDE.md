# Self-Sovereign Identity (SSI) Keys Setup Guide

This guide explains how to set up and use SSI keys in the MediChain application for global deployments.

## What are SSI Keys?

Self-Sovereign Identity (SSI) keys are cryptographic keys that enable decentralized identity management. In MediChain, we use Ed25519 keys to:

1. Sign verifiable credentials
2. Verify the authenticity of medical records
3. Create and manage Decentralized Identifiers (DIDs)
4. Enable global interoperability with different identity systems

## Generating SSI Keys

### Using the Provided Script

The easiest way to generate SSI keys is using the built-in script:

```bash
# Navigate to the backend directory
cd backend

# Run the key generation script
npm run generate:ssi-keys
```

This will:
- Generate Ed25519 key pairs using Node.js crypto module
- Store the keys in the `keys` directory
- Add the keys to your `.env` file as base64-encoded strings
- Create a unique Key ID for your deployment

### Testing Your SSI Keys

After generating the keys, you can verify they're working correctly by running:

```bash
npm run test:ssi-keys
```

This will:
- Load your generated keys from the environment variables
- Sign a test message using your private key
- Verify the signature using your public key
- Report whether the key pair is working correctly

## Environment Variables

After key generation, your `.env` file should contain these new variables:

```
# SSI Configuration
SSI_PRIVATE_KEY=<base64-encoded-private-key>
SSI_PUBLIC_KEY=<base64-encoded-public-key>
SSI_KEY_ID=<unique-key-identifier>
SSI_KEY_TYPE=ed25519
SSI_KEY_GENERATED_AT=<timestamp>
DEFAULT_REGION=global
```

## Regional Deployment Configuration

The system supports different regional deployments with specific configurations:

- **Global** (default): W3C Verifiable Credentials with Ed25519 keys
- **India**: Support for Aadhaar, PAN card, and other India-specific IDs
- **European Union**: OpenID4VC standard and GDPR compliance
- **United States**: Support for US-specific IDs and HIPAA compliance

To specify a region during deployment, set the `DEFAULT_REGION` environment variable:

```
DEFAULT_REGION=in  # For India
DEFAULT_REGION=eu  # For European Union
DEFAULT_REGION=us  # For United States
DEFAULT_REGION=global  # For global deployment (default)
```

## SSI Keys Security

**IMPORTANT SECURITY CONSIDERATIONS:**

1. **NEVER commit your private key to version control**
2. Use environment variables or secure key management systems in production
3. Rotate keys periodically (recommended every 6-12 months)
4. Use separate keys for development, testing, and production
5. Restrict access to the private key to only authorized personnel

## Using SSI in the Application

The SSI system is integrated throughout MediChain:

1. **Verifiable Credentials**: When users upload identity documents, the system creates signed verifiable credentials
2. **Medical Records**: Patient records are signed to ensure authenticity
3. **Access Control**: SSI keys verify legitimate access to medical information
4. **Cross-Border Healthcare**: Enables credential verification across different regions

## Developer Integration

If you're extending MediChain, you can use the `SsiKeysService` and `SsiGlobalConfig` services:

```typescript
// Example: Sign data with SSI keys
const digitalSignature = this.ssiKeysService.createDigitalSignature(dataToSign);

// Example: Verify signature
const isValid = this.ssiKeysService.verifySignature(data, signature);

// Example: Get region-specific configuration
const regionConfig = this.ssiGlobalConfig.getRegionConfig('eu');
```

## Troubleshooting

**Missing or Invalid Keys:**
- Check if the keys exist in the `keys` directory
- Verify that the keys are correctly encoded in the `.env` file
- Run `npm run generate:ssi-keys` to regenerate the keys

**Signature Verification Failures:**
- Ensure you're using the same key pair for signing and verification
- Check if the data being verified matches exactly what was signed
- Verify the signature format is correct (base64-encoded)

## Additional Resources

- [W3C Verifiable Credentials](https://www.w3.org/TR/vc-data-model/)
- [Decentralized Identifiers (DIDs)](https://www.w3.org/TR/did-core/)
- [OpenID for Verifiable Credentials](https://openid.net/openid4vc/)