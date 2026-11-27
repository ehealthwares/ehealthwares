import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_BASE = process.env.API_URL || 'http://api.ehealthwares.com/ehealthwares';

/**
 * Local-development mirror of the backend's comment endpoint, mounted on the
 * same path the browser calls. In production nginx routes `/api/*` straight
 * to the backend (`API_URL`), so this handler is only exercised where the Next
 * server receives `/api/*` directly. Responses are never cached.
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
