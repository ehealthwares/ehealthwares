import { NextRequest, NextResponse } from 'next/server';

const IDENTITY_URL =
  process.env.MYAIHA_IDENTITY_URL || process.env.IDENTITY_URL || 'http://api.ehealthwares.com/identity';

/**
 * Server-side proxy for identity auth/shopper/verify-otp — phone sign-in.
 * The identity service verifies the OTP on the client device for shoppers;
 * the backend only needs the phone to resolve/create the account and issue
 * the token pair.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';

  if (!phone) {
    return NextResponse.json({ error: 'phone is required' }, { status: 400 });
  }

  try {
    const res = await fetch(`${IDENTITY_URL}/auth/shopper/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.message || `Sign-in failed (${res.status})` },
        { status: res.status }
      );
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Unable to reach the identity service' },
      { status: 502 }
    );
  }
}
