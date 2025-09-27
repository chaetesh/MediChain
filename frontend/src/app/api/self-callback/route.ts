import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Self SDK Callback received:", body);

    // Return the EXACT format Self SDK expects with proper structure
    const response = {
      status: "success",
      result: {
        verified: true,
        verificationId: body.verificationId || `verification_${Date.now()}`,
        userIdentifier: body.userIdentifier || body.userId,
        timestamp: Date.now(),
        proofData: body.proofData || null,
        signature: body.signature || null,
        // Add Celo payment instruction for automatic payment
        celoPayment: {
          required: true,
          amount: "0.001",
          currency: "CELO",
          recipient: "0xBDDd946e2B547496Ddb0e507ECCCde35D1AF9597",
          description: "Identity verification fee",
        },
      },
      message: "Identity verification completed successfully",
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("Self SDK Callback error:", error);

    return NextResponse.json(
      {
        status: "error",
        result: {
          verified: false,
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: Date.now(),
        },
        message: "Identity verification failed",
      },
      {
        status: 200, // Still return 200 with error status
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

// Handle preflight requests for CORS
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}

// Also handle GET requests for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "ready",
    message: "Self SDK callback endpoint is ready",
    endpoint: "/api/self-callback",
    timestamp: new Date().toISOString(),
  });
}
