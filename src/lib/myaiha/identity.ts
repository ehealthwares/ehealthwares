'use client';

/**
 * MyAIha identity helpers — phone + OTP sign-in through the site's own API
 * proxy (/api/myaiha/*), which forwards to the identity service server-side
 * (keeps the identity host off the browser and out of CORS).
 *
 * Flow (identity contract):
 *   1. POST /auth/shopper/request-otp { phone, channel } → { sent, code? }
 *      (`code` is only present when the identity service exposes dev codes.)
 *   2. POST /auth/shopper/verify-otp { phone } → token pair
 *      The identity service verifies the OTP on the *client device* for
 *      shoppers; the backend only needs the phone to resolve/create the
 *      account and issue tokens.
 */

import { MYAIHA_STORAGE } from './config';

export interface MyAIhaProfile {
  phone: string;
  username: string | null;
}

export interface RequestOtpResult {
  sent: boolean;
  channel: string;
  /** Present only in dev (identity OTP_EXPOSE_CODE). */
  code?: string;
}

function safeGet(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode */
  }
}

function safeRemove(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function normalizePhone(phone: string): string {
  const digits = String(phone ?? '').replace(/[^0-9]/g, '');
  return digits;
}

export async function requestOtp(
  phone: string,
  channel: 'sms' | 'whatsapp' = 'sms'
): Promise<RequestOtpResult> {
  const res = await fetch('/api/myaiha/request-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: normalizePhone(phone), channel }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error || 'Could not send the verification code.');
  }
  return body as RequestOtpResult;
}

export async function verifyOtpAndSignIn(phone: string): Promise<void> {
  const res = await fetch('/api/myaiha/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: normalizePhone(phone) }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error || 'Sign-in failed.');
  }
  if (!body?.accessToken) {
    throw new Error('Sign-in succeeded but no session was returned.');
  }
  storeTokens({
    accessToken: body.accessToken,
    refreshToken: body.refreshToken ?? null,
    profile: { phone: normalizePhone(phone), username: body.username ?? null },
  });
}

export function storeTokens(auth: {
  accessToken: string;
  refreshToken: string | null;
  profile: MyAIhaProfile;
}): void {
  safeSet(MYAIHA_STORAGE.token, auth.accessToken);
  if (auth.refreshToken) safeSet(MYAIHA_STORAGE.refresh, auth.refreshToken);
  safeSet(MYAIHA_STORAGE.profile, JSON.stringify(auth.profile));
}

export interface StoredAuth {
  token: string;
  refreshToken: string | null;
  profile: MyAIhaProfile | null;
}

export function getAuth(): StoredAuth | null {
  const token = safeGet(MYAIHA_STORAGE.token);
  if (!token) return null;
  let profile: MyAIhaProfile | null = null;
  try {
    profile = JSON.parse(safeGet(MYAIHA_STORAGE.profile) ?? 'null');
  } catch {
    profile = null;
  }
  return { token, refreshToken: safeGet(MYAIHA_STORAGE.refresh), profile };
}

export function clearAuth(): void {
  safeRemove(MYAIHA_STORAGE.token);
  safeRemove(MYAIHA_STORAGE.refresh);
  safeRemove(MYAIHA_STORAGE.profile);
}

export function isSignedIn(): boolean {
  return getAuth() !== null;
}
