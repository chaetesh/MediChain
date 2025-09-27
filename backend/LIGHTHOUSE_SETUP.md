# Lighthouse IPFS Integration Setup

This document outlines how to configure and use Lighthouse for IPFS storage in the MediChain application.

## Prerequisites

- Node.js 16.x or higher
- A Lighthouse account (https://files.lighthouse.storage/)

## Setting Up Lighthouse

### 1. Create a Lighthouse Account

Visit the [Lighthouse website](https://files.lighthouse.storage/) and sign up for an account.

### 2. Generate API Key

1. Log in to your Lighthouse account
2. Navigate to the API keys section in your dashboard
3. Generate a new API key for use with the MediChain application

### 3. Configure Environment Variables

Add the following environment variable to your `.env` file:

```
LIGHTHOUSE_API_KEY=your_lighthouse_api_key_here
```

Replace `your_lighthouse_api_key_here` with the API key generated in step 2.

## How It Works

The MediChain application uses Lighthouse for decentralized storage. Here's how it's integrated:

1. **File Upload**: When a medical record is uploaded, it is:
   - Encrypted client-side using the application's encryption service
   - Uploaded to IPFS via Lighthouse's service
   - The returned CID (Content Identifier) is stored in the application's database

2. **File Retrieval**: When a medical record needs to be accessed:
   - The application fetches the encrypted content from IPFS using the stored CID
   - The content is decrypted using the application's encryption service
   - The decrypted file is served to the authorized user

## Testing Lighthouse Integration

After setting up the environment variable, you can test the integration:

1. Restart the MediChain backend service
2. Access the IPFS health endpoint to verify connection:

```
GET /api/ipfs/health
```

This should return a successful response indicating a connection to Lighthouse.

## Troubleshooting

### Connection Issues

If the application cannot connect to Lighthouse, check:

1. Your API key is correctly set in the `.env` file
2. Your account has sufficient storage space/credits on Lighthouse
3. The Lighthouse service is operational (check their status page)

### File Size Limitations

By default, the Lighthouse service handles large file uploads efficiently, but be aware of any file size limits based on your account tier.

## Additional Resources

- [Lighthouse Documentation](https://docs.lighthouse.storage/)
- [Lighthouse API Reference](https://docs.lighthouse.storage/lighthouse-1/)
- [IPFS Documentation](https://docs.ipfs.tech/)
