'use client';

/**
 * MyAIha chat client — talks to the conversation engine directly from the
 * browser (same as the storefront chatbot): the webhook is public by design
 * (guest web chat), and realtime updates arrive over the engine's socket.
 *
 * Inbound messages are addressed by channel code (EHEALTHWARES_WEBCHAT_BOT);
 * auth token, when signed in, rides both REST and socket.
 */

import {
  MYAIHA,
  MYAIHA_STORAGE,
} from './config';
import { getAuth } from './identity';

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  createdAt: string;
  optimistic?: boolean;
}

export interface RawExchange {
  id: string;
  conversationId: string;
  direction: 'inbound' | 'outbound';
  text: string;
  createdAt: string;
}

export interface ConversationSummary {
  conversationId: string;
  title?: string;
  status?: string;
  lastMessage?: { text: string; direction: string; createdAt: string };
  lastMessageAt?: string;
  currentQuestion?: { text?: string } | null;
}

export interface SendResult {
  conversationId?: string;
  participantId?: string;
}

/* ---------------------------- storage ---------------------------- */

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
    /* ignore */
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

/* ------------------------ chat identity -------------------------- */

/**
 * The phone used as the chat sender identity: the signed-in shopper's phone,
 * else a stable per-device guest phone (so threads persist across reloads).
 */
export function getChatPhone(): string {
  const auth = getAuth();
  if (auth?.profile?.phone) return auth.profile.phone;
  let phone = safeGet(MYAIHA_STORAGE.phone);
  if (!phone) {
    phone = String(Date.now());
    safeSet(MYAIHA_STORAGE.phone, phone);
  }
  return phone;
}

export function isGuest(): boolean {
  return getAuth() === null;
}

/* ---------------------------- REST ------------------------------- */

function authHeaders(): Record<string, string> {
  const auth = getAuth();
  return auth ? { Authorization: `Bearer ${auth.token}` } : {};
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${MYAIHA.API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(init?.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (body as { message?: string })?.message ??
      `Request failed (${res.status})`;
    throw new Error(message);
  }
  return body as T;
}

export async function sendMessage(
  text: string,
  opts: {
    conversationId?: string | null;
    questionnaireCode?: string;
    /** Start a fresh conversation (engine stales old pending exchanges). */
    newConversation?: boolean;
  } = {}
): Promise<SendResult> {
  const body: Record<string, unknown> = {
    channelCode: MYAIHA.CHANNEL_CODE,
    senderPhone: getChatPhone(),
    text,
  };
  // Pending ids are never sent back to the engine: fresh sends go out without
  // a conversation id (optionally flagged newConversation), replies under a
  // pending id are ignored by the UI until the real id arrives.
  const conversationId =
    opts.conversationId && !opts.conversationId.startsWith('pending-')
      ? opts.conversationId
      : undefined;
  if (conversationId) body.conversationId = conversationId;
  if (opts.questionnaireCode) body.questionnaireCode = opts.questionnaireCode;
  if (opts.newConversation) body.newConversation = true;

  const res = await api<SendResult>('/webhooks/web', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (res.conversationId && !res.conversationId.startsWith('pending-')) {
    safeSet(MYAIHA_STORAGE.conversation, res.conversationId);
  }
  return res;
}

export async function fetchThread(
  conversationId: string,
  cursor?: string
): Promise<{ items: RawExchange[]; nextCursor?: string }> {
  const params = new URLSearchParams({ conversationId, limit: '30' });
  if (cursor) params.set('cursor', cursor);
  return api(`/exchanges?${params.toString()}`);
}

export async function fetchInbox(
  participantId: string
): Promise<ConversationSummary[]> {
  const params = new URLSearchParams({
    participantId,
    activeOnly: 'false',
    limit: '30',
  });
  const res = await api<{ items?: ConversationSummary[] }>(
    `/conversations/inbox?${params.toString()}`
  );
  return res.items ?? [];
}

export async function findParticipant(
  phone: string
): Promise<{ id: string; phone?: string } | null> {
  try {
    const res = await api<unknown>(
      `/participants?phone=${encodeURIComponent(phone)}`
    );
    const list = Array.isArray(res)
      ? (res as Array<{ id?: string; phone?: string }>)
      : (((res as { data?: unknown[] }).data ??
          (res as { items?: unknown[] }).items ??
          []) as Array<{ id?: string; phone?: string }>);
    const first = list[0];
    return first?.id ? { id: first.id, phone: first.phone } : null;
  } catch {
    return null;
  }
}

/* ----------------------- thread persistence ---------------------- */

export function saveThread(
  conversationId: string,
  messages: ChatMessage[]
): void {
  try {
    localStorage.setItem(
      MYAIHA_STORAGE.thread,
      JSON.stringify({ conversationId, messages, savedAt: Date.now() })
    );
  } catch {
    /* quota — ignore */
  }
}

export function loadThread(conversationId: string): ChatMessage[] | null {
  try {
    const raw = JSON.parse(safeGet(MYAIHA_STORAGE.thread) ?? 'null') as {
      conversationId?: string;
      messages?: ChatMessage[];
    } | null;
    if (raw && raw.conversationId === conversationId) return raw.messages ?? [];
  } catch {
    /* corrupt — ignore */
  }
  return null;
}

export function getStoredConversationId(): string | null {
  return safeGet(MYAIHA_STORAGE.conversation);
}

export function setStoredConversationId(id: string | null): void {
  if (id) safeSet(MYAIHA_STORAGE.conversation, id);
  else safeRemove(MYAIHA_STORAGE.conversation);
}

export function clearConversationState(): void {
  safeRemove(MYAIHA_STORAGE.conversation);
  safeRemove(MYAIHA_STORAGE.thread);
}

/* ---------------------------- socket ----------------------------- */

import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;
let socketIdentityKey = '';

export interface SocketHandlers {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (raw: RawExchange) => void;
  onEnded?: (payload: { conversationId?: string }) => void;
}

/** Connect (or re-auth) the shared socket and attach handlers. */
export function connectSocket(handlers: SocketHandlers): Socket | null {
  if (typeof window === 'undefined') return null;

  const phone = getChatPhone();
  const auth = getAuth();
  const identityKey = `${phone}|${auth ? auth.token : 'guest'}`;

  if (socket && identityKey === socketIdentityKey) {
    attach(handlers);
    return socket;
  }
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(`${MYAIHA.SOCKET_BASE}/conversations`, {
    transports: ['websocket'],
    auth: {
      token: auth?.token,
      guest: !auth,
      phone,
    },
  });
  socketIdentityKey = identityKey;
  attach(handlers);
  return socket;
}

function attach(handlers: SocketHandlers): void {
  if (!socket) return;
  socket.off('connect');
  socket.off('disconnect');
  socket.off('conversation.message.created');
  socket.off('conversation.message.orphan');
  socket.off('conversation.ended');
  socket.on('connect', () => handlers.onConnect?.());
  socket.on('disconnect', () => handlers.onDisconnect?.());
  socket.on(
    'conversation.message.created',
    (raw: RawExchange) => handlers.onMessage?.(raw)
  );
  socket.on(
    'conversation.message.orphan',
    (raw: RawExchange) => handlers.onMessage?.(raw)
  );
  socket.on('conversation.ended', (payload: { conversationId?: string }) =>
    handlers.onEnded?.(payload)
  );
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    socketIdentityKey = '';
  }
}
