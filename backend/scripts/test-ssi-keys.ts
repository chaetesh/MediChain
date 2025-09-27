#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Constants
const KEYS_DIR = path.resolve(__dirname, '../keys');
const TEST_MESSAGE = 'Hello, MediChain! This is a test message for SSI key verification.';

/**
 * Test SSI keys by signing and verifying a message
 */
async function testSsiKeys(): Promise<void> {
  console.log('========================================');
  console.log('    MediChain SSI Key Testing Tool      ');
  console.log('========================================');

  try {
    // Check for keys in .env
    const privateKeyBase64 = process.env.SSI_PRIVATE_KEY;
    const publicKeyBase64 = process.env.SSI_PUBLIC_KEY;
    const keyId = process.env.SSI_KEY_ID;

    if (!privateKeyBase64 || !publicKeyBase64) {
      console.error('Error: SSI keys not found in environment variables.');
      console.log('Make sure you have run generate:ssi-keys first.');
      process.exit(1);
    }

    console.log(`Found key pair with ID: ${keyId}`);
    
    // Decode keys from base64
    const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf8');
    const publicKey = Buffer.from(publicKeyBase64, 'base64').toString('utf8');
    
    console.log('\nPrivate key format:');
    console.log(privateKey.split('\n')[0]);
    
    console.log('\nPublic key format:');
    console.log(publicKey.split('\n')[0]);

    // Create key objects for signing/verification
    const privateKeyObject = crypto.createPrivateKey(privateKey);
    const publicKeyObject = crypto.createPublicKey(publicKey);
    
    // Sign a test message
    console.log('\nSigning test message...');
    const dataToSign = Buffer.from(TEST_MESSAGE);
    const signature = crypto.sign(null, dataToSign, privateKeyObject);
    const signatureBase64 = signature.toString('base64');
    
    console.log(`Signature (base64): ${signatureBase64.substring(0, 20)}...`);
    
    // Verify the signature
    console.log('\nVerifying signature...');
    const isValid = crypto.verify(null, dataToSign, publicKeyObject, signature);
    
    if (isValid) {
      console.log('✅ SUCCESS: Signature verification successful!');
      console.log('The SSI keys are working properly.');
    } else {
      console.log('❌ FAILURE: Signature verification failed!');
      console.log('There might be an issue with the key pair.');
    }
    
    console.log('\nTesting complete.');
    
  } catch (error) {
    console.error('Error testing SSI keys:', error);
    process.exit(1);
  }
}

// Execute test
testSsiKeys().catch(console.error);