import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward the request to the backend SSI registration endpoint
    const response = await fetch(`${API_BASE_URL}/api/auth/ssi/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'SSI Registration failed' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('SSI Registration API Error:', error);
    return NextResponse.json(
      { message: 'Internal server error during SSI registration' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve supported proof types
export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/ssi/supported-proofs`);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: 'Failed to fetch supported proofs' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Get Supported Proofs API Error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}