"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Wallet,
  CreditCard,
} from "lucide-react";
import { useMetaMaskWithSelf } from "../lib/hooks/useMetaMaskWithSelf";

// Dynamically import Self components
let SelfQRcodeWrapper: any = null;
let SelfAppBuilder: any = null;
let countries: any = null;

try {
  const selfModule = require("@selfxyz/qrcode");
  SelfQRcodeWrapper = selfModule.SelfQRcodeWrapper;
  SelfAppBuilder = selfModule.SelfAppBuilder;
  countries = selfModule.countries;
} catch (error) {
  console.error("Failed to import Self QR code components:", error);
}

interface SelfIdentityVerificationProps {
  userId: string;
  onSuccess: (verificationResult: any) => void;
  onError: (error: any) => void;
  className?: string;
}

export default function SelfIdentityVerification({
  userId,
  onSuccess,
  onError,
  className = "",
}: SelfIdentityVerificationProps) {
  const [selfApp, setSelfApp] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);

  // Celo wallet integration
  const {
    isConnected,
    account,
    isCeloNetwork,
    connect,
    switchToCelo,
    sendCeloTransaction,
  } = useMetaMaskWithSelf();

  // Default payment recipient
  const VERIFICATION_FEE_RECIPIENT =
    "0xBDDd946e2B547496Ddb0e507ECCCde35D1AF9597";
  const VERIFICATION_FEE_AMOUNT = "0.001"; // CELO

  useEffect(() => {
    const initializeSelfApp = async () => {
      let formattedUserId = userId;
      let userType: "uuid" | "hex" = "uuid";

      try {
        if (!SelfAppBuilder || !countries) {
          throw new Error("Self SDK components not loaded");
        }

        // Format userId properly
        if (userId.includes("-")) {
          formattedUserId = userId.replace(/-/g, "");
          userType = "hex";
        }

        console.log(
          `Initializing Self SDK with userId: ${formattedUserId}, type: ${userType}`
        );

        const app = new SelfAppBuilder()
          .setEnvironment("staging_https")
          .setUserId(formattedUserId, userType)
          .setCountries(countries.default)
          .setEndpoint("https://med-web3.vercel.app/api/self-callback")
          .onSuccess(handleSuccessfulVerification)
          .onError(handleVerificationError)
          .build();

        setSelfApp(app);
        setError(null);
        setIsLoading(false);

        console.log("Self SDK initialized successfully");
      } catch (err: any) {
        console.error("Failed to initialize Self SDK:", err);
        const errorMessage =
          err.message || "Failed to initialize identity verification";
        setError(errorMessage);
        setIsLoading(false);
      }
    };

    if (userId) {
      initializeSelfApp();
    } else {
      setError("User ID is required for verification");
      setIsLoading(false);
    }
  }, [userId, retryCount]);

  const handleSuccessfulVerification = async (verificationResult: any) => {
    console.log("Self verification successful:", verificationResult);

    // Check if Celo payment is required based on verification result
    if (verificationResult?.celoPayment?.required) {
      await processCeloPayment(verificationResult);
    } else {
      // Complete verification without payment
      onSuccess({
        ...verificationResult,
        verified: true,
        timestamp: Date.now(),
        paymentRequired: false,
      });
    }
  };

  const processCeloPayment = async (verificationResult: any) => {
    try {
      setPaymentProcessing(true);

      // Check if wallet is connected
      if (!isConnected) {
        await connect();
        if (!isConnected) {
          throw new Error(
            "Please connect your MetaMask wallet to complete payment"
          );
        }
      }

      // Check if on Celo network
      if (!isCeloNetwork) {
        await switchToCelo();
        if (!isCeloNetwork) {
          throw new Error("Please switch to Celo network to complete payment");
        }
      }

      // Send the verification fee payment
      const txHash = await sendCeloTransaction(
        VERIFICATION_FEE_RECIPIENT,
        VERIFICATION_FEE_AMOUNT,
        "CELO"
      );

      console.log("Payment transaction sent:", txHash);

      setPaymentComplete(true);
      setPaymentProcessing(false);

      // Complete verification with payment info
      onSuccess({
        ...verificationResult,
        verified: true,
        timestamp: Date.now(),
        paymentRequired: true,
        payment: {
          txHash,
          amount: VERIFICATION_FEE_AMOUNT,
          currency: "CELO",
          recipient: VERIFICATION_FEE_RECIPIENT,
          status: "completed",
        },
      });
    } catch (error: any) {
      console.error("Payment failed:", error);
      setPaymentProcessing(false);
      setError(`Payment failed: ${error.message}`);

      // Still complete verification but mark payment as failed
      onSuccess({
        ...verificationResult,
        verified: true,
        timestamp: Date.now(),
        paymentRequired: true,
        payment: {
          amount: VERIFICATION_FEE_AMOUNT,
          currency: "CELO",
          recipient: VERIFICATION_FEE_RECIPIENT,
          status: "failed",
          error: error.message,
        },
      });
    }
  };

  const handleVerificationError = (errorData?: {
    error_code?: string;
    reason?: string;
    status?: string;
  }) => {
    console.error("Identity verification error:", errorData);

    let errorMessage = "Identity verification failed";

    if (errorData?.reason) {
      if (
        errorData.reason.includes("missing field") ||
        errorData.reason.includes("invalid type")
      ) {
        errorMessage =
          "Server communication error: API endpoint configuration issue. Please try again or use development mode.";
      } else if (errorData.reason.includes("error decoding response body")) {
        errorMessage =
          "Server communication error: Unable to process verification response";
      } else {
        errorMessage = `Verification error: ${errorData.reason}`;
      }
    } else if (errorData?.status === "proof_generation_failed") {
      errorMessage =
        "Proof generation failed: Please try again or use development mode";
    } else if (errorData?.error_code === "UNKNOWN_ERROR") {
      errorMessage =
        "Self SDK encountered an unknown error. This may be temporary - please try refreshing or use development mode.";
    }

    setError(errorMessage);
    onError({
      error: errorMessage,
      code: errorData?.error_code,
      status: errorData?.status,
    });
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    setIsLoading(true);
    setError(null);
    setPaymentComplete(false);
    setPaymentProcessing(false);
  };

  const handleMockVerification = async () => {
    console.log("Using mock verification for development");

    // Simulate the payment process for mock verification
    const mockResult = {
      verified: true,
      timestamp: Date.now(),
      method: "mock",
      userId: userId,
      paymentRequired: true,
      payment: {
        amount: VERIFICATION_FEE_AMOUNT,
        currency: "CELO",
        recipient: VERIFICATION_FEE_RECIPIENT,
        status: "mock_completed",
        txHash: "0x" + Math.random().toString(16).substr(2, 64),
      },
    };

    // Process mock payment
    await processCeloPayment(mockResult);
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center space-y-4">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Initializing identity verification...</p>
        </div>
      </div>
    );
  }

  if (paymentProcessing) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center space-y-4">
          <CreditCard className="mx-auto h-12 w-12 text-green-600" />
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-green-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Processing Payment
            </h3>
            <p className="text-gray-600">
              Sending {VERIFICATION_FEE_AMOUNT} CELO verification fee...
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Recipient: {VERIFICATION_FEE_RECIPIENT.slice(0, 6)}...
              {VERIFICATION_FEE_RECIPIENT.slice(-4)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (paymentComplete) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center space-y-4">
          <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Verification Complete!
            </h3>
            <p className="text-gray-600">
              Identity verified and payment processed successfully
            </p>
            <p className="text-sm text-green-600 mt-2">
              ✅ Paid {VERIFICATION_FEE_AMOUNT} CELO verification fee
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">
                Verification Error
              </h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRetry}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Self SDK Initialization
            </button>

            <button
              onClick={handleMockVerification}
              className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Continue with Mock Verification + Payment
            </button>
          </div>

          <div className="text-sm text-red-600">
            <p className="font-medium">Troubleshooting:</p>
            <ul className="mt-1 ml-4 list-disc space-y-1">
              <li>Ensure MetaMask is connected to Celo network</li>
              <li>Have at least 0.001 CELO for verification fee</li>
              <li>Check your internet connection</li>
              <li>Try using mock verification for development/testing</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <Shield className="mx-auto h-12 w-12 text-blue-600" />
        <h2 className="mt-4 text-2xl font-bold text-gray-900">
          Identity Verification + Payment
        </h2>
        <p className="mt-2 text-gray-600">
          Scan the QR code with your Self app to verify your identity
        </p>
      </div>

      {/* Payment Information */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Wallet className="h-5 w-5 text-green-600 mt-0.5" />
          <div className="text-sm text-green-800">
            <p className="font-medium">Verification Fee Required</p>
            <p>
              A {VERIFICATION_FEE_AMOUNT} CELO fee will be automatically charged
              after successful verification
            </p>
            <p className="text-xs mt-1">
              Payment goes to: {VERIFICATION_FEE_RECIPIENT.slice(0, 20)}...
              {VERIFICATION_FEE_RECIPIENT.slice(-10)}
            </p>
          </div>
        </div>
      </div>

      {/* Wallet Connection Status */}
      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Wallet className="h-5 w-5 text-yellow-600" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Wallet Required</p>
              <p>
                Please connect your MetaMask wallet to pay the verification fee
              </p>
              <button
                onClick={connect}
                className="mt-2 bg-yellow-600 text-white px-3 py-1 rounded text-xs hover:bg-yellow-700"
              >
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Scan QR Code</h3>

          {selfApp && SelfQRcodeWrapper ? (
            <div className="flex justify-center">
              <SelfQRcodeWrapper
                app={selfApp}
                style={{
                  maxWidth: "300px",
                  height: "auto",
                  border: "2px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "16px",
                }}
              />
            </div>
          ) : (
            <div className="w-64 h-64 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center space-y-2">
                <AlertCircle className="mx-auto h-8 w-8 text-gray-400" />
                <p className="text-gray-500">QR Code not available</p>
                <button
                  onClick={handleMockVerification}
                  className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  Continue with Mock Verification + Payment
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Instructions:</h4>
        <ol className="text-sm text-gray-600 space-y-1">
          <li>1. Connect your MetaMask wallet (if not already connected)</li>
          <li>
            2. Ensure you have at least 0.001 CELO for the verification fee
          </li>
          <li>3. Download and set up the Self app</li>
          <li>4. Scan the QR code above with the Self app</li>
          <li>5. Complete identity verification in the app</li>
          <li>6. Approve the automatic 0.001 CELO payment in MetaMask</li>
        </ol>
      </div>

      {/* Development Mode */}
      <div className="border-t pt-4">
        <button
          onClick={handleMockVerification}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors text-sm"
        >
          Skip Verification + Process Mock Payment (Development Mode)
        </button>
      </div>
    </div>
  );
}
