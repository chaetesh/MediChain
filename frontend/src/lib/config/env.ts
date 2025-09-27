/**
 * Environment configuration
 * Centralized configuration for environment variables
 */

export const config = {
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    timeout: 30000, // 30 seconds
  },

  // Authentication Configuration  
  auth: {
    tokenKey: 'medichain-token',
    refreshInterval: 15 * 60 * 1000, // 15 minutes
  },

  // App Configuration
  app: {
    name: 'MediChain.AI',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  },

  // Feature Flags
  features: {
    walletAuth: process.env.NEXT_PUBLIC_ENABLE_WALLET_AUTH === 'true',
    emailVerification: process.env.NEXT_PUBLIC_ENABLE_EMAIL_VERIFICATION === 'true',
  },
} as const;

/**
 * Validate required environment variables
 */
export const validateEnvironment = (): void => {
  const requiredVars = [
    'NEXT_PUBLIC_API_URL',
  ];

  const missingVars = requiredVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    console.warn(
      `Missing environment variables: ${missingVars.join(', ')}`
    );
  }
};