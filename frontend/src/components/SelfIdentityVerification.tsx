"use client";

import { useEffect, useState } from "react";
import {
  Shield,
  CheckCircle,
  AlertCircle,
  QrCode,
  Smartphone,
} from "lucide-react";

// Dynamically import Self components to handle potential import errors
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

  useEffect(() => {
    const initializeSelfApp = async () => {
      // Move formattedUserId and userType to outer scope of the function
      let formattedUserId = userId;
      let userType: "uuid" | "hex" = "uuid";
      try {
        setIsLoading(true);
        setError(null);

        // Check if Self components are available
        if (!SelfAppBuilder || !countries) {
          console.warn("Self components not available, using fallback mode");
          setIsLoading(false);
          return;
        }

        // Function to generate a valid UUID v4
        const generateUUID = () => {
          return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
            /[xy]/g,
            function (c) {
              const r = (Math.random() * 16) | 0;
              const v = c === "x" ? r : (r & 0x3) | 0x8;
              return v.toString(16);
            }
          );
        };

        // Function to generate a valid Ethereum address format
        const generateEthAddress = () => {
          const chars = "0123456789abcdef";
          let address = "0x";
          for (let i = 0; i < 40; i++) {
            address += chars[Math.floor(Math.random() * chars.length)];
          }
          return address;
        };

        // Check if userId is a valid Ethereum address
        if (userId && userId.match(/^0x[a-fA-F0-9]{40}$/)) {
          userType = "hex";
          formattedUserId = userId.toLowerCase();
        }
        // Check if userId is a valid UUID
        else if (
          userId &&
          userId.match(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
          )
        ) {
          userType = "uuid";
          formattedUserId = userId;
        }
        // Generate a proper UUID for any other input (including emails)
        else {
          userType = "uuid";
          formattedUserId = generateUUID();
        }

        console.log("Original userId:", userId);
        console.log("Formatted userId:", formattedUserId);
        console.log("User type:", userType);
        console.log(
          "UUID validation:",
          formattedUserId.match(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
          )
        );
        console.log(
          "Address validation:",
          formattedUserId.match(/^0x[a-fA-F0-9]{40}$/)
        );

        // Try different endpoint configurations to avoid proof generation failures
        // Use a more reliable endpoint that follows Self SDK https://med-web3.vercel.app/api/self-callbackrequirements
        const selfEndpoint = "https://med-web3.vercel.app/api/self-callback";

        const app = new SelfAppBuilder({
          version: 2,
          appName: "MediChain.AI",
          scope: "medichain-identity-verification",
          endpoint: selfEndpoint,
          logoBase64:
            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzI1NjNFQiIvPgo8cGF0aCBkPSJNMTIgMjBMMTggMjZMMjggMTYiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=",
          userId: formattedUserId,
          endpointType: "staging_https",
          userIdType: userType,
          userDefinedData: "MediChain Identity Verification",
          disclosures: {
            // Essential identity verification fields
            minimumAge: 18,
            excludedCountries: [
              countries?.CUBA || "CUB",
              countries?.IRAN || "IRN",
              countries?.NORTH_KOREA || "PRK",
              countries?.RUSSIA || "RUS",
            ],

            // Required fields for medical platform
            name: true,
            date_of_birth: true,
            nationality: true,
            issuing_state: true,
          },
        }).build();

        console.log("Self app created successfully:", app);
        setSelfApp(app);
        setIsLoading(false);
      } catch (err: any) {
        console.error("Error creating SelfApp:", err);
        console.error("Full error details:", {
          message: err.message,
          stack: err.stack,
          userId: formattedUserId,
          userType: userType,
        });

        let errorMessage = "Failed to initialize identity verification";

        if (err.message?.includes("userId")) {
          errorMessage = `Invalid user ID format: ${err.message}`;
        } else if (err.message?.includes("endpoint")) {
          errorMessage = `Endpoint configuration error: ${err.message}`;
        } else if (err.message?.includes("scope")) {
          errorMessage = `Scope validation error: ${err.message}`;
        } else if (err.message) {
          errorMessage = err.message;
        }

        setError(`Initialization failed: ${errorMessage}`);
        setIsLoading(false);
      }
    };

    if (userId) {
      initializeSelfApp();
    } else {
      setError("User ID is required for verification");
      setIsLoading(false);
    }
  }, [userId]);

  const handleSuccessfulVerification = (verificationResult?: any) => {
    console.log("Identity verification successful:", verificationResult);
    onSuccess(verificationResult || { verified: true, timestamp: Date.now() });
  };

  const handleVerificationError = (errorData?: {
    error_code?: string;
    reason?: string;
    status?: string;
  }) => {
    console.error("Identity verification error:", errorData);

    let errorMessage = "Identity verification failed";

    if (errorData?.reason) {
      if (errorData.reason.includes("missing field `status`")) {
        errorMessage =
          "Endpoint configuration error: Invalid response format from verification service";
      } else if (errorData.reason.includes("error decoding response body")) {
        errorMessage =
          "Server communication error: Unable to process verification response";
      } else {
        errorMessage = errorData.reason;
      }
    } else if (errorData?.status === "proof_generation_failed") {
      errorMessage =
        "Self SDK proof generation failed. This may be due to network issues or SDK configuration. Please use development mode to continue.";
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

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">
            Loading identity verification...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Verification Error
              </h3>
              <p className="mt-2 text-sm text-red-700">{error}</p>
              <div className="mt-3 space-y-2">
                <button
                  onClick={() => {
                    setError(null);
                    setIsLoading(true);
                    setSelfApp(null);
                    // Force re-render with new userId
                    window.location.reload();
                  }}
                  className="text-sm text-red-600 hover:text-red-800 underline"
                >
                  Try again
                </button>

                <div className="text-xs text-gray-500 mt-2">
                  <p>Debug info:</p>
                  <p>User ID: {userId}</p>
                  <p>
                    Generated UUID test:{" "}
                    {(() => {
                      const testUUID =
                        "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
                          /[xy]/g,
                          function (c) {
                            const r = (Math.random() * 16) | 0;
                            const v = c === "x" ? r : (r & 0x3) | 0x8;
                            return v.toString(16);
                          }
                        );
                      return testUUID;
                    })()}
                  </p>
                </div>
              </div>
            </div>
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
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          Identity Verification
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          Scan the QR code with your Self mobile app to verify your identity
        </p>
      </div>

      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <Shield className="h-5 w-5 text-blue-400 flex-shrink-0" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Self Sovereign Identity Verification
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Verify your identity using government-issued documents</li>
                <li>Your data remains under your control</li>
                <li>Blockchain-based proof of identity</li>
                <li>No documents stored on our servers</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
        <div className="text-center">
          <QrCode className="mx-auto h-16 w-16 text-gray-400 mb-4" />

          {selfApp ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center">
                <div className="mb-4 p-4 border-2 border-gray-200 rounded-lg">
                  <SelfQRcodeWrapper
                    selfApp={selfApp}
                    onSuccess={handleSuccessfulVerification}
                    onError={handleVerificationError}
                    size={280}
                    darkMode={false}
                    type="websocket"
                  />
                </div>

                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <Smartphone className="h-4 w-4" />
                  <span>Open your Self app and scan the QR code above</span>
                </div>
              </div>

              {/* Alternative verification options */}
              <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-xs text-yellow-800 text-center mb-2">
                    ⚠️ If the QR code is not working, you can proceed with
                    development mode
                  </p>
                </div>

                <button
                  onClick={() => {
                    // Simulate successful verification for development
                    const mockVerification = {
                      verified: true,
                      timestamp: Date.now(),
                      mockData: true,
                      name: "Test User",
                      age: 25,
                      nationality: "IN",
                      selfSDKError:
                        "Self SDK proof generation failed - using mock data",
                    };
                    handleSuccessfulVerification(mockVerification);
                  }}
                  className="w-full px-4 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  ✅ Continue with Mock Verification
                </button>

                <button
                  onClick={() => {
                    setError(null);
                    setIsLoading(true);
                    setSelfApp(null);
                    // Retry initialization
                    setTimeout(() => {
                      window.location.reload();
                    }, 100);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  🔄 Retry Self SDK Initialization
                </button>

                <p className="mt-2 text-xs text-gray-500 text-center">
                  Mock verification is safe for development and testing purposes
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-500">Loading QR code...</p>
              <div className="mt-4">
                <button
                  onClick={() => {
                    // Simulate successful verification for development
                    const mockVerification = {
                      verified: true,
                      timestamp: Date.now(),
                      mockData: true,
                      name: "Test User",
                      age: 25,
                      nationality: "IN",
                    };
                    handleSuccessfulVerification(mockVerification);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  🚀 Mock Verification (Dev)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">
          How to verify your identity:
        </h4>
        <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
          <li>Download the Self mobile app from your app store</li>
          <li>Create your Self identity with your government-issued ID</li>
          <li>Scan the QR code above using the Self app</li>
          <li>Approve the identity verification request</li>
          <li>
            Your identity will be verified and you can proceed with registration
          </li>
        </ol>
      </div>

      {/* Download Links */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">
          Don't have the Self app yet?
        </h4>
        <div className="flex space-x-4">
          <a
            href="https://apps.apple.com/app/self-sovereign-identity/id1234567890"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Download for iOS
          </a>
          <a
            href="https://play.google.com/store/apps/details?id=com.self.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Download for Android
          </a>
        </div>
      </div>

      {/* What data is verified */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <CheckCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Data verified through Self
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Full name from government ID</li>
                <li>Date of birth and age verification (18+)</li>
                <li>Nationality and issuing country</li>
                <li>Document validity and authenticity</li>
                <li>Gender information (if available)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
