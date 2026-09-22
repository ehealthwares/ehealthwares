import { NextRequest, NextResponse } from 'next/server';

const IDENTITY_URL =
  process.env.MYAIHA_IDENTITY_URL || process.env.IDENTITY_URL || 'http://api.ehealthwares.com/identity';

/**
 * Server-side proxy for identity auth/shopper/request-otp. Keeps the identity
 * host server-only (no browser CORS exposure), consistent with /api/sign-in.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
  const channel = body?.channel === 'whatsapp' ? 'whatsapp' : 'sms';

  if (!phone) {
    return NextResponse.json({ error: 'phone is required' }, { status: 400 });
  }

  try {
    const res = await fetch(`${IDENTITY_URL}/auth/shopper/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, channel }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.message || `Could not send code (${res.status})` },
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
