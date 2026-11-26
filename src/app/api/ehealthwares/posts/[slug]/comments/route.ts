import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_BASE = process.env.API_URL || 'http://api.ehealthwares.com/ehealthwares';

/**
 * Same-origin proxy for post comments. The browser talks to this route so
 * client-side reads/writes work without exposing the backend origin, and the
 * response is never cached (comments change as visitors post).
 */
function backendUrl(slug: string) {
  return `${API_BASE}/articles/${encodeURIComponent(slug)}/comments`;
}

async function relay(res: Response) {
  const text = await res.text();
  try {
    return NextResponse.json(text ? JSON.parse(text) : null, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: `Backend error: ${res.status} ${res.statusText}` },
      { status: res.status },
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const res = await fetch(backendUrl(params.slug), { cache: 'no-store' });
    return relay(res);
  } catch {
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 502 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const res = await fetch(backendUrl(params.slug), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    return relay(res);
  } catch {
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 502 });
  }
}
