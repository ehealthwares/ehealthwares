import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.API_URL || 'http://api.ehealthwares.com/ehealthwares';

/**
 * Client-side contact submissions are POSTed here (same-origin) and proxied
 * to the eHealthwares backend. Mirrors the backend mount path (/api/ehealthwares)
 * so it is superseded by the real API when the host routes /api/* there.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await fetch(`${API_BASE}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Backend error: ${res.status} ${res.statusText}` },
        { status: res.status },
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}