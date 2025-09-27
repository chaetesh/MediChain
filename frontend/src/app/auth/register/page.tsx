"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Shield,
  CheckCircle,
  AlertCircle,
  QrCode,
  FileText,
  Upload,
} from "lucide-react";
import { UserRole } from "@/lib/types/auth.types";
import SelfIdentityVerificationWithPayment from "../../../components/SelfIdentityVerificationWithPayment";

// Registration Form Data
interface RegistrationFormData {
  // Basic Info
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  walletAddress?: string;
  hospitalId?: string;
  password?: string;

  // Self Identity Verification
  selfVerification?: {
    verified: boolean;
    verificationData?: any;
    timestamp?: number;
  };

  // Agreement
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
  agreeToSSI: boolean;
}

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<RegistrationFormData>({
    email: "",
    firstName: "",
    lastName: "",
    role: UserRole.PATIENT,
    selfVerification: undefined,
    agreeToTerms: false,
    agreeToPrivacy: false,
    agreeToSSI: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  // Generate a stable UUID for Self verification
  const [verificationUserId] = useState(() => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  });

  // File upload functionality removed - using Self identity verification instead

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";

    // Only require password if not using wallet
    if (!formData.walletAddress && !formData.password) {
      newErrors.password = "Password is required (or connect wallet)";
    }
    if (formData.password && formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    // For non-patient roles, Self verification is required
    if (
      formData.role !== UserRole.PATIENT &&
      !formData.selfVerification?.verified
    ) {
      newErrors.selfVerification =
        "Identity verification is required for your role";
    }

    // For patients, Self verification is optional - no validation needed

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (
      !formData.agreeToTerms ||
      !formData.agreeToPrivacy ||
      !formData.agreeToSSI
    ) {
      setErrors({ agreement: "You must agree to all terms and policies" });
      return;
    }

    setIsLoading(true);
    try {
      // Determine registration type based on Self verification
      const hasVerification = formData.selfVerification?.verified;
      const endpoint = hasVerification
        ? "/api/auth/self-identity/register" // Use Self identity registration API
        : "/api/auth/register"; // Use regular registration API

      const requestBody = hasVerification
        ? {
            // Self identity registration payload
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            role: formData.role,
            selfVerification: formData.selfVerification,
            walletAddress: formData.walletAddress,
            hospitalId: formData.hospitalId,
            password: formData.password,
          }
        : {
            // Regular registration payload
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            role: formData.role,
            password: formData.password,
            walletAddress: formData.walletAddress,
            hospitalId: formData.hospitalId,
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      // Show appropriate success message
      if (hasVerification) {
        alert(`Registration successful with Self Identity Verification!

✅ User ID: ${data.userId}
✅ Identity Verified: Through Self app
✅ Verification Status: ${
          formData.selfVerification?.verified ? "Confirmed" : "Pending"
        }

Your identity has been verified through Self's blockchain-based system. Your account is ready to use with enhanced security features.

Welcome to MediChain.AI!`);

        router.push("/auth/login?registered=self&verified=true");
      } else {
        alert(`Registration successful!

✅ User ID: ${data.userId || "Generated"}
✅ Registration Type: Standard

Your account has been created successfully. You can enable Self identity verification later from your profile for enhanced security.

Welcome to MediChain.AI!`);

        router.push("/auth/login?registered=standard");
      }
    } catch (error: any) {
      console.error("SSI Registration error:", error);
      setErrors({
        agreement: error.message || "Registration failed. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="mx-auto h-12 w-12 text-blue-600" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          MediChain Registration
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          Secure registration with optional Self identity verification
        </p>
      </div>
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <Shield className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Self Identity Verification Benefits
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Verify identity using government-issued documents via Self app
                </li>
                <li>
                  Blockchain-based proof of identity without storing documents
                </li>
                <li>You maintain full control over your identity data</li>
                <li>Enhanced security for professional healthcare roles</li>
              </ul>
            </div>
          </div>
        </div>
      </div>{" "}
      <div>
        <label
          htmlFor="role"
          className="block text-sm font-medium text-gray-700"
        >
          I am registering as a
        </label>
        <select
          id="role"
          value={formData.role}
          onChange={(e) =>
            setFormData({ ...formData, role: e.target.value as UserRole })
          }
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value={UserRole.PATIENT}>Patient</option>
          <option value={UserRole.DOCTOR}>Doctor</option>
          <option value={UserRole.HOSPITAL_ADMIN}>
            Hospital Administrator
          </option>
        </select>

        {/* Show required proofs for selected role */}
        <div className="mt-2 p-3 bg-gray-50 rounded-md">
          {formData.role === UserRole.PATIENT ? (
            <div>
              <p className="text-sm font-medium text-gray-700">
                For {formData.role}s:
              </p>
              <ul className="mt-1 text-sm text-gray-600 list-disc pl-5">
                <li>No documents required - register instantly</li>
                <li>
                  Optional: Use Self identity verification for enhanced security
                </li>
                <li>
                  Benefit: Blockchain-verified identity and medical records
                </li>
              </ul>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-gray-700">
                Identity verification for {formData.role}:
              </p>
              <ul className="mt-1 text-sm text-gray-600 list-disc pl-5">
                <li>
                  Self Sovereign Identity verification using government ID
                </li>
                <li>Secure, blockchain-based proof of identity</li>
                <li>No documents stored on our servers</li>
              </ul>
              <p className="mt-2 text-xs text-blue-600">
                * Professional roles require identity verification through Self
                app
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-gray-700"
          >
            First Name
          </label>
          <input
            id="firstName"
            type="text"
            required
            value={formData.firstName}
            onChange={(e) =>
              setFormData({ ...formData, firstName: e.target.value })
            }
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              errors.firstName ? "border-red-300" : "border-gray-300"
            }`}
            placeholder="Enter your first name"
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-gray-700"
          >
            Last Name
          </label>
          <input
            id="lastName"
            type="text"
            required
            value={formData.lastName}
            onChange={(e) =>
              setFormData({ ...formData, lastName: e.target.value })
            }
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              errors.lastName ? "border-red-300" : "border-gray-300"
            }`}
            placeholder="Enter your last name"
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
          )}
        </div>
      </div>
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Email Address
        </label>
        <input
          id="email"
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
            errors.email ? "border-red-300" : "border-gray-300"
          }`}
          placeholder="Enter your email"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="walletAddress"
          className="block text-sm font-medium text-gray-700"
        >
          Wallet Address (Optional)
        </label>
        <input
          id="walletAddress"
          type="text"
          value={formData.walletAddress || ""}
          onChange={(e) =>
            setFormData({ ...formData, walletAddress: e.target.value })
          }
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="0x... (for blockchain identity verification)"
        />
        <p className="mt-1 text-sm text-gray-500">
          Connect your wallet for enhanced blockchain identity verification
        </p>
      </div>
      {!formData.walletAddress && (
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <div className="mt-1 relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={formData.password || ""}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className={`block w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                errors.password ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Create a secure password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => validateStep1() && setStep(2)}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Continue to Identity Verification
      </button>
    </div>
  );

  // Document upload UI removed - using Self identity verification instead

  const renderStep2 = () => {
    const handleSelfVerificationSuccess = (verificationResult: any) => {
      console.log("Self verification successful:", verificationResult);
      setFormData((prev) => ({
        ...prev,
        selfVerification: {
          verified: true,
          verificationData: verificationResult,
          timestamp: Date.now(),
        },
      }));
      // Clear any previous errors
      setErrors({});
    };

    const handleSelfVerificationError = (error: any) => {
      console.error("Self verification error:", error);
      setErrors((prev) => ({
        ...prev,
        selfVerification: error.error || "Identity verification failed",
      }));
    };

    const canSkipVerification = formData.role === UserRole.PATIENT;
    const isVerified = formData.selfVerification?.verified;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <QrCode className="mx-auto h-12 w-12 text-blue-600" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Identity Verification
          </h3>
          {formData.role === UserRole.PATIENT ? (
            <p className="mt-2 text-sm text-gray-600">
              Verify your identity with Self for enhanced security (optional for
              patients)
            </p>
          ) : (
            <p className="mt-2 text-sm text-gray-600">
              Verify your identity using Self app with your government-issued ID
            </p>
          )}
        </div>

        {errors.selfVerification && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{errors.selfVerification}</p>
          </div>
        )}

        {/* For patients, show info about optional nature */}
        {formData.role === UserRole.PATIENT && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <Shield className="h-5 w-5 text-blue-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Enhanced Security (Optional)
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>As a patient, you have two options:</p>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>
                      <strong>With Self Verification:</strong> Enhanced security
                      with blockchain identity proof
                    </li>
                    <li>
                      <strong>Skip Verification:</strong> Standard registration
                      with email verification
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success message if verified */}
        {isVerified && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Identity Verified Successfully!
                </h3>
                <p className="mt-2 text-sm text-green-700">
                  Your identity has been verified through Self. You can now
                  proceed with registration.
                </p>
                <p className="mt-1 text-xs text-green-600">
                  Verified at:{" "}
                  {formData.selfVerification?.timestamp
                    ? new Date(
                        formData.selfVerification.timestamp
                      ).toLocaleString()
                    : "Just now"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Self Identity Verification Component with Payment */}
        {!isVerified && (
          <SelfIdentityVerificationWithPayment
            userId={verificationUserId}
            onSuccess={handleSelfVerificationSuccess}
            onError={handleSelfVerificationError}
          />
        )}

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Back
          </button>

          {canSkipVerification && !isVerified && (
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Skip Verification
            </button>
          )}

          <button
            type="button"
            onClick={() => setStep(3)}
            disabled={!canSkipVerification && !isVerified}
            className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerified
              ? "Continue"
              : canSkipVerification
              ? "Continue with Verification"
              : "Verify to Continue"}
          </button>
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          Review Your Registration
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          Please review your information and complete your Self Sovereign
          Identity registration.
        </p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Registration Summary</h4>
        <div className="text-sm text-gray-600 space-y-2">
          <p>
            <span className="font-medium">Role:</span>{" "}
            {formData.role.replace("_", " ").toUpperCase()}
          </p>
          <p>
            <span className="font-medium">Name:</span> {formData.firstName}{" "}
            {formData.lastName}
          </p>
          <p>
            <span className="font-medium">Email:</span> {formData.email}
          </p>
          {formData.walletAddress && (
            <p>
              <span className="font-medium">Wallet:</span>{" "}
              {formData.walletAddress.slice(0, 10)}...
            </p>
          )}

          <div className="mt-3">
            <p className="font-medium">Identity Verification:</p>
            {formData.selfVerification?.verified ? (
              <div className="flex items-center mt-1">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-green-600">
                  Verified via Self Identity (
                  {formData.selfVerification.timestamp
                    ? new Date(
                        formData.selfVerification.timestamp
                      ).toLocaleString()
                    : "Just now"}
                  )
                </span>
              </div>
            ) : (
              <div className="flex items-center mt-1">
                <AlertCircle className="h-4 w-4 text-yellow-500 mr-2" />
                <span className="text-yellow-600">
                  {formData.role === UserRole.PATIENT
                    ? "No verification (standard registration)"
                    : "Verification required"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-start">
          <input
            id="agreeToTerms"
            type="checkbox"
            checked={formData.agreeToTerms}
            onChange={(e) =>
              setFormData({ ...formData, agreeToTerms: e.target.checked })
            }
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
          />
          <label
            htmlFor="agreeToTerms"
            className="ml-2 block text-sm text-gray-900"
          >
            I agree to the{" "}
            <Link
              href="/terms"
              className="text-blue-600 hover:text-blue-500"
              target="_blank"
            >
              Terms of Service
            </Link>
          </label>
        </div>

        <div className="flex items-start">
          <input
            id="agreeToPrivacy"
            type="checkbox"
            checked={formData.agreeToPrivacy}
            onChange={(e) =>
              setFormData({ ...formData, agreeToPrivacy: e.target.checked })
            }
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
          />
          <label
            htmlFor="agreeToPrivacy"
            className="ml-2 block text-sm text-gray-900"
          >
            I agree to the{" "}
            <Link
              href="/privacy"
              className="text-blue-600 hover:text-blue-500"
              target="_blank"
            >
              Privacy Policy
            </Link>
          </label>
        </div>

        <div className="flex items-start">
          <input
            id="agreeToSSI"
            type="checkbox"
            checked={formData.agreeToSSI}
            onChange={(e) =>
              setFormData({ ...formData, agreeToSSI: e.target.checked })
            }
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
          />
          <label
            htmlFor="agreeToSSI"
            className="ml-2 block text-sm text-gray-900"
          >
            I consent to Self Sovereign Identity verification and blockchain
            storage of my document proofs. I understand my data is encrypted and
            I maintain control over access.
          </label>
        </div>
      </div>

      {errors.agreement && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{errors.agreement}</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <Shield className="h-5 w-5 text-blue-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              What happens next?
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Your documents are encrypted and stored securely</li>
                <li>Credentials are registered on the blockchain</li>
                <li>Verification process begins with authorized personnel</li>
                <li>You'll receive email updates on verification status</li>
                <li>
                  Your account will be activated once verification is complete
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          type="button"
          onClick={() => setStep(2)}
          className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={
            isLoading ||
            !formData.agreeToTerms ||
            !formData.agreeToPrivacy ||
            !formData.agreeToSSI
          }
          className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Creating SSI Account..." : "Complete SSI Registration"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            MediChain Registration
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Secure registration with Self identity verification |{" "}
            <Link
              href="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Already have an account? Sign in
            </Link>
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-4">
          {[1, 2, 3].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {stepNumber}
              </div>
              {stepNumber < 3 && (
                <div
                  className={`w-12 h-1 ${
                    step > stepNumber ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
          <form onSubmit={handleSubmit}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </form>
        </div>
      </div>
    </div>
  );
}
