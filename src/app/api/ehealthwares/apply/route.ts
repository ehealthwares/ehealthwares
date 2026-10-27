import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.API_URL || 'http://api.ehealthwares.com/ehealthwares';

const errorEnvelope = (status: number, error: string) => ({
  success: false,
  statusCode: status,
  path: '/api/ehealthwares/apply',
  timestamp: new Date().toISOString(),
  error,
});

/**
 * Job applications are POSTed here as multipart/form-data (same-origin) and
 * streamed through to the eHealthwares backend. The incoming FormData is passed
 * straight through as the body — content-type (with its multipart boundary) is
 * set by fetch, never manually.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const res = await fetch(`${API_BASE}/apply`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      if (data) return NextResponse.json(data, { status: res.status });
      return NextResponse.json(
        errorEnvelope(res.status, `Backend error: ${res.status} ${res.statusText}`),
        { status: res.status },
      );
    }

    return NextResponse.json(data ?? {}, { status: res.status });
  } catch {
    return NextResponse.json(errorEnvelope(502, 'Failed to submit application'), {
      status: 502,
    });
  }
}
