#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const KEYS_DIR = path.resolve(__dirname, '../keys');
const ENV_FILE = path.resolve(__dirname, '../.env');

/**
 * Generate Ed25519 key pair using Node.js crypto module
 * This avoids the dependency on OpenSSL being installed
 */
async function generateEd25519KeyPair(): Promise<void> {
  try {
    console.log('Creating keys directory if it does not exist...');
    if (!fs.existsSync(KEYS_DIR)) {
      fs.mkdirSync(KEYS_DIR, { recursive: true });
    }

    const privateKeyPath = path.join(KEYS_DIR, 'ssi_private.pem');
    const publicKeyPath = path.join(KEYS_DIR, 'ssi_public.pem');

    console.log('Generating Ed25519 key pair using Node.js crypto...');
    
    // Generate the key pair using Node.js crypto
    const keyPair = crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    const privateKey = keyPair.privateKey;
    const publicKey = keyPair.publicKey;
    
    // Save keys to files
    fs.writeFileSync(privateKeyPath, privateKey);
    fs.writeFileSync(publicKeyPath, publicKey);
    
    console.log('Keys saved to files successfully.');

    // Generate a key ID (fingerprint)
    const keyId = crypto.createHash('sha256')
      .update(publicKey)
      .digest('hex')
      .substring(0, 16);

    console.log(`Keys generated successfully!`);
    console.log(`Key ID: ${keyId}`);
    
    // Add keys to .env file
    const privateKeyBase64 = Buffer.from(privateKey).toString('base64');
    const publicKeyBase64 = Buffer.from(publicKey).toString('base64');

    updateEnvFile({
      SSI_PRIVATE_KEY: privateKeyBase64,
      SSI_PUBLIC_KEY: publicKeyBase64,
      SSI_KEY_ID: keyId,
      SSI_KEY_TYPE: 'ed25519',
      SSI_KEY_GENERATED_AT: new Date().toISOString(),
    });

    console.log('Environment variables updated in .env file');
    console.log('Keys stored in:', KEYS_DIR);
    console.log('\nIMPORTANT: Keep your private key secure. Never commit it to version control.');
    
  } catch (error) {
    console.error('Error generating keys:', error);
    process.exit(1);
  }
}

/**
 * Update environment variables in .env file
 */
function updateEnvFile(newVars: Record<string, string>): void {
  let envContent = '';
  
  try {
    // Read existing .env file if it exists
    if (fs.existsSync(ENV_FILE)) {
      envContent = fs.readFileSync(ENV_FILE, 'utf8');
    }
    
    // Process each new variable
    for (const [key, value] of Object.entries(newVars)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      
      if (regex.test(envContent)) {
        // Update existing variable
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        // Add new variable
        envContent += `\n${key}=${value}`;
      }
    }
    
    // Write updated content back to .env file
    fs.writeFileSync(ENV_FILE, envContent.trim() + '\n');
    
  } catch (error) {
    console.error('Error updating .env file:', error);
    process.exit(1);
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log('========================================');
  console.log('    MediChain SSI Key Pair Generator    ');
  console.log('========================================');
  
  await generateEd25519KeyPair();
  
  console.log('\nDone!');
}

// Execute main function
main().catch(console.error);