'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  clearAuth,
  getAuth,
  normalizePhone,
  requestOtp,
  verifyOtpAndSignIn,
  type StoredAuth,
} from '@/lib/myaiha/identity';
import {
  clearConversationState,
  connectSocket,
  disconnectSocket,
  fetchInbox,
  fetchThread,
  findParticipant,
  getChatPhone,
  loadThread,
  saveThread,
  sendMessage,
  type ChatMessage,
  type ConversationSummary,
} from '@/lib/myaiha/chat';

/**
 * MyAIha chat app — identity phone+OTP sign-in (via the site's server proxy),
 * then live chat with the conversation engine. Works as a guest too (device
 * phone identity); sign-in lets conversations follow the shopper across
 * devices.
 */

const WELCOME_GUEST =
  "Hi! I'm MyAIha — sign in above, or continue as a guest and ask me anything.";
const WELCOME_SIGNED_IN =
  "Welcome back! I'm MyAIha — ask about symptoms, appointments, prescriptions or anything else.";

type AuthStep = 'phone' | 'otp';

export function MyAIhaApp() {
  /* ------------------------------ auth ------------------------------ */
  const [auth, setAuth] = useState<StoredAuth | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authStep, setAuthStep] = useState<AuthStep>('phone');
  const [phoneInput, setPhoneInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  useEffect(() => {
    const stored = getAuth();
    setAuth(stored);
    if (!stored) setShowAuth(true);
    setAuthChecked(true);
  }, []);

  async function handleRequestOtp() {
    setAuthError('');
    setDevCode(null);
    if (!phoneInput.trim()) {
      setAuthError('Enter your phone number first.');
      return;
    }
    setAuthBusy(true);
    try {
      const res = await requestOtp(phoneInput, 'sms');
      if (res.code) setDevCode(res.code);
      setAuthStep('otp');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Could not send code.');
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleVerifyOtp() {
    setAuthError('');
    if (!/^\d{4,8}$/.test(otpInput.trim())) {
      setAuthError('Enter the code from the SMS.');
      return;
    }
    setAuthBusy(true);
    try {
      // Identity contract: shopper OTP is verified on the client device;
      // verify-otp issues tokens for the phone (the OTP was delivered to it).
      await verifyOtpAndSignIn(phoneInput);
      setAuth(getAuth());
      setShowAuth(false);
      setOtpInput('');
      setDevCode(null);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setAuthBusy(false);
    }
  }

  function handleSignOut() {
    clearAuth();
    clearConversationState();
    setAuth(null);
    setShowAuth(true);
    setAuthStep('phone');
  }

  /* ------------------------------ chat ------------------------------ */
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [endedId, setEndedId] = useState<string | null>(null);

  const activeIdRef = useRef<string | null>(null);
  const endedRef = useRef<string | null>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const scrollToEnd = useCallback(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [messages, sending, scrollToEnd]);

  const refreshInbox = useCallback(async () => {
    try {
      const participant = await findParticipant(getChatPhone());
      if (!participant) {
        setConversations([]);
        return;
      }
      const items = await fetchInbox(participant.id);
      setConversations(items);
    } catch {
      /* offline — keep current list */
    }
  }, []);

  const refreshThread = useCallback(async (conversationId: string) => {
    try {
      const page = await fetchThread(conversationId);
      const items = (page.items ?? []).slice().reverse();
      const mapped = items.map((x) => ({
        id: x.id,
        role: (x.direction === 'inbound' ? 'user' : 'bot') as ChatMessage['role'],
        text: x.text,
        createdAt: x.createdAt,
      }));
      setMessages(mapped);
      saveThread(conversationId, mapped);
    } catch {
      /* keep cached view */
    }
  }, []);

  const openConversation = useCallback(
    (id: string | null) => {
      activeIdRef.current = id;
      setActiveId(id);
      endedRef.current = null;
      setEndedId(null);
      if (!id) {
        setMessages([]);
        return;
      }
      const cached = loadThread(id); // sync cache getter from the chat lib
      setMessages(cached ?? []);
      if (!cached?.length) void refreshThread(id);
    },
    [refreshThread]
  );

  // Show a welcome bubble on first mount when no conversation is restored.
  useEffect(() => {
    if (authChecked && messages.length === 0 && !activeId) {
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          role: 'bot',
          text: auth ? WELCOME_SIGNED_IN : WELCOME_GUEST,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked]);

  // Reconnect the socket whenever the chat identity changes (sign-in/out).
  useEffect(() => {
    if (!authChecked) return;
    // Warm the identity (guest phone or signed-in phone) before connecting.
    getChatPhone();
    const socket = connectSocket({
      onConnect: () => setConnected(true),
      onDisconnect: () => setConnected(false),
      onMessage: (raw) => {
        if (!raw?.conversationId) return;
        if (endedRef.current && raw.conversationId === endedRef.current) return;
        const current = activeIdRef.current;
        if (!current) {
          activeIdRef.current = raw.conversationId;
          setActiveId(raw.conversationId);
        } else if (raw.conversationId !== current) {
          void refreshInbox();
          return;
        }
        if (raw.direction !== 'inbound') {
          setMessages((prev) => {
            if (prev.some((m) => m.id === raw.id)) return prev;
            const next = [
              ...prev,
              {
                id: raw.id,
                role: 'bot' as const,
                text: raw.text,
                createdAt: raw.createdAt,
              },
            ];
            if (activeIdRef.current) saveThread(activeIdRef.current, next);
            return next;
          });
        }
        void refreshInbox();
      },
      onEnded: (payload) => {
        const id = payload?.conversationId;
        if (!id || id !== activeIdRef.current) return;
        endedRef.current = id;
        setEndedId(id);
      },
    });

    void refreshInbox();

    return () => {
      socket?.removeAllListeners();
      disconnectSocket();
    };
  }, [auth?.token, authChecked, refreshInbox]);

  const send = useCallback(
    async (text: string, questionnaireCode?: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;
      setSending(true);
      setDraft('');
      setMessages((prev) => [
        ...prev,
        {
          id: `opt-${Date.now()}`,
          role: 'user',
          text: trimmed,
          createdAt: new Date().toISOString(),
        },
      ]);
      try {
        const res = await sendMessage(trimmed, {
          conversationId: activeIdRef.current,
          questionnaireCode,
        });
        if (res.conversationId && res.conversationId !== activeIdRef.current) {
          activeIdRef.current = res.conversationId;
          setActiveId(res.conversationId);
          setMessages([]);
        }
        // Reply usually arrives via socket; poll once as fallback.
        setTimeout(() => {
          if (activeIdRef.current) void refreshThread(activeIdRef.current);
          void refreshInbox();
        }, 900);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'bot',
            text: `⚠️ ${err instanceof Error ? err.message : 'Message failed to send.'}`,
            createdAt: new Date().toISOString(),
          },
        ]);
      } finally {
        setSending(false);
      }
    },
    [sending, refreshThread, refreshInbox]
  );

  function startNew() {
    activeIdRef.current = null;
    endedRef.current = null;
    setActiveId(null);
    setEndedId(null);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'bot',
        text: 'New conversation started — what can I help with?',
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  /* ----------------------------- render ----------------------------- */
  const activeConv = conversations.find((c) => c.conversationId === activeId);
  const title = activeConv?.title ?? (activeId ? 'Conversation' : 'New conversation');

  return (
    <div className="flex h-[100dvh] flex-col bg-[#f6f9fb] text-[#0d1621]">
      {/* ---------- Top bar ---------- */}
      <header className="flex items-center justify-between border-b border-[#e2e8ee] bg-white px-5 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/myaiha"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient text-sm font-extrabold text-white"
            aria-label="Back to MyAIha home"
          >
            e
          </Link>
          <div>
            <div className="text-sm font-bold">{title}</div>
            <div className="flex items-center gap-1.5 text-[11px] text-navy-400">
              <span
                className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-teal-500' : 'bg-navy-300'}`}
              />
              {connected ? 'Online' : 'Offline'} · Web
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={startNew}
            className="rounded-full bg-teal-500 px-4 py-2 text-xs font-bold text-teal-950 transition hover:bg-teal-400"
          >
            + New chat
          </button>
          {auth ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-full border border-navy-200 px-4 py-2 text-xs font-semibold text-navy-600 transition hover:bg-navy-50"
            >
              Sign out
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowAuth(true)}
              className="rounded-full border border-navy-200 px-4 py-2 text-xs font-semibold text-navy-600 transition hover:bg-navy-50"
            >
              Sign in
            </button>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* ---------- Sidebar (inbox) ---------- */}
        <aside className="hidden w-72 flex-col bg-[#081524] p-4 md:flex">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[#6f8290]">
            Conversations
          </div>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
            {conversations.length === 0 && (
              <p className="px-2 py-1 text-xs text-[#7c8fa0]">
                No conversations yet — say hello!
              </p>
            )}
            {conversations.map((c) => (
              <button
                key={c.conversationId}
                type="button"
                onClick={() => openConversation(c.conversationId)}
                className={`w-full rounded-lg px-3 py-2.5 text-left transition ${
                  c.conversationId === activeId
                    ? 'bg-teal-500/15'
                    : 'hover:bg-white/5'
                }`}
              >
                <div className="truncate text-[12.5px] font-semibold text-[#eaf1f7]">
                  {c.title || 'Conversation'}
                </div>
                <div className="truncate text-[11px] text-[#7c8fa0]">
                  {c.lastMessage?.text?.slice(0, 60) ?? ''}
                </div>
              </button>
            ))}
          </div>
          <div className="border-t border-white/10 pt-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 flex-none rounded-full bg-brand-gradient" />
              <div className="min-w-0">
                <div className="truncate text-xs font-bold text-[#eaf1f7]">
                  {auth?.profile?.username ?? 'Guest'}
                </div>
                <div className="truncate text-[10.5px] text-[#7c8fa0]">
                  {auth?.profile?.phone
                    ? `phone · ${auth.profile.phone}`
                    : 'Sign in to sync conversations'}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ---------- Thread ---------- */}
        <main className="flex min-w-0 flex-1 flex-col">
          {endedId && (
            <div className="mx-5 mt-3 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-[12.5px] font-semibold text-amber-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              This conversation has ended.
              <button
                type="button"
                onClick={startNew}
                className="ml-auto font-bold underline"
              >
                Start new chat
              </button>
            </div>
          )}

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
            <div className="mx-auto w-fit rounded-full border border-navy-100 bg-white px-3 py-1 text-[11px] text-navy-400">
              {new Date().toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </div>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex max-w-[70%] gap-2.5 ${
                  m.role === 'user' ? 'flex-row-reverse self-end' : 'self-start'
                }`}
              >
                <div
                  className={`h-7 w-7 flex-none rounded-full ${
                    m.role === 'user' ? 'bg-navy-400/60' : 'bg-brand-gradient'
                  }`}
                />
                <div className="min-w-0">
                  <div className="mb-0.5 text-[11px] font-bold text-navy-400">
                    {m.role === 'user' ? 'You' : 'MyAIha'}
                  </div>
                  <div
                    className={`whitespace-pre-wrap rounded-xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                      m.role === 'user'
                        ? 'rounded-br-sm bg-navy-900 text-white'
                        : 'rounded-bl-sm border border-[#e2e8ee] bg-white'
                    }`}
                  >
                    {m.text}
                  </div>
                  <div
                    className={`mt-0.5 text-[10.5px] text-navy-300 ${
                      m.role === 'user' ? 'text-right' : ''
                    }`}
                  >
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex max-w-[70%] gap-2.5 self-start">
                <div className="h-7 w-7 flex-none rounded-full bg-brand-gradient" />
                <div className="rounded-xl rounded-bl-sm border border-[#e2e8ee] bg-white px-4 py-3">
                  <div className="flex gap-1">
                    <span className="typing-dot" />
                    <span className="typing-dot" style={{ animationDelay: '0.15s' }} />
                    <span className="typing-dot" style={{ animationDelay: '0.3s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={threadEndRef} />
          </div>

          {/* quick prompts */}
          <div className="flex flex-wrap gap-2 px-5 pb-2">
            {[
              "I've had a fever since last night, what should I do?",
              'Book a specialist appointment',
              'Can I refill my prescription?',
            ].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => void send(q)}
                className="rounded-full border border-[#e2e8ee] bg-white px-3.5 py-1.5 text-xs font-semibold text-navy-500 transition hover:border-teal-100 hover:bg-teal-50 hover:text-teal-600"
              >
                {q}
              </button>
            ))}
          </div>

          {/* composer */}
          <div className="flex items-end gap-2.5 border-t border-[#e2e8ee] bg-white px-5 py-3">
            <textarea
              rows={1}
              className="max-h-28 min-w-0 flex-1 resize-none rounded-xl border border-[#e2e8ee] bg-[#f6f9fb] px-4 py-2.5 text-[13.5px] outline-none placeholder:text-navy-300 focus:border-teal-500"
              placeholder="Message MyAIha..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send(draft);
                }
              }}
            />
            <button
              type="button"
              onClick={() => void send(draft)}
              disabled={sending}
              className="rounded-xl bg-teal-500 px-5 py-2.5 text-[13.5px] font-bold text-teal-950 transition hover:bg-teal-400 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </main>
      </div>

      {/* ---------- Auth overlay ---------- */}
      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#040c16]/70 p-5 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl">
            <div className="mb-5 flex items-center gap-2 text-base font-extrabold text-navy-900">
              MyAIha
              <span className="h-2 w-2 rounded-full bg-teal-500" />
            </div>

            {authStep === 'phone' ? (
              <>
                <h2 className="text-lg font-extrabold">Sign in</h2>
                <p className="mb-4 mt-1 text-[13px] text-navy-500">
                  Enter your phone number — we&apos;ll text you a 6-digit code.
                </p>
                <input
                  type="tel"
                  autoComplete="tel"
                  className="w-full rounded-xl border border-navy-200 bg-navy-50 px-4 py-2.5 text-sm outline-none focus:border-teal-500"
                  placeholder="e.g. 08012345678"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleRequestOtp();
                  }}
                />
                {authError && (
                  <p className="mt-1 min-h-4 text-xs text-red-600">{authError}</p>
                )}
                <button
                  type="button"
                  onClick={() => void handleRequestOtp()}
                  disabled={authBusy}
                  className="mt-3 w-full rounded-xl bg-teal-500 py-2.5 text-sm font-bold text-teal-950 transition hover:bg-teal-400 disabled:opacity-50"
                >
                  {authBusy ? 'Sending…' : 'Send code'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAuth(false)}
                  className="mt-2 w-full py-1 text-xs font-semibold text-navy-400 transition hover:text-teal-600"
                >
                  Continue as guest →
                </button>
              </>
            ) : (
              <>
                <h2 className="text-lg font-extrabold">Enter code</h2>
                <p className="mb-3 mt-1 text-[13px] text-navy-500">
                  Sent to {normalizePhone(phoneInput)}. It expires in 10 minutes.
                </p>
                {devCode && (
                  <div className="mb-3 rounded-xl bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-600">
                    Dev code: {devCode}
                  </div>
                )}
                <input
                  inputMode="numeric"
                  maxLength={6}
                  className="w-full rounded-xl border border-navy-200 bg-navy-50 px-4 py-2.5 text-center text-lg font-bold tracking-[0.35em] outline-none focus:border-teal-500"
                  placeholder="••••••"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleVerifyOtp();
                  }}
                />
                {authError && (
                  <p className="mt-1 min-h-4 text-xs text-red-600">{authError}</p>
                )}
                <button
                  type="button"
                  onClick={() => void handleVerifyOtp()}
                  disabled={authBusy}
                  className="mt-3 w-full rounded-xl bg-teal-500 py-2.5 text-sm font-bold text-teal-950 transition hover:bg-teal-400 disabled:opacity-50"
                >
                  {authBusy ? 'Signing in…' : 'Verify & sign in'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthStep('phone');
                    setAuthError('');
                    setOtpInput('');
                  }}
                  className="mt-2 w-full py-1 text-xs font-semibold text-navy-400 transition hover:text-teal-600"
                >
                  ← Change number
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
