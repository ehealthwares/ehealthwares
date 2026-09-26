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
  fetchChannelIdByCode,
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
import { MYAIHA } from '@/lib/myaiha/config';

/**
 * MyAIha chat app — identity phone+OTP sign-in (via the site's server proxy),
 * then live chat with the conversation engine. Works as a guest too (device
 * phone identity); sign-in lets conversations follow the shopper across
 * devices.
 *
 * Prototype parity (ehealthwares/myaiha/myaiha-app.html): sidebar quick-action
 * menus that start NEW conversations with their questionnaire codes, inbox
 * loading state, header call/record icons and composer attach/mic tools.
 */

const WELCOME_GUEST =
  "Hi! I'm MyAIha — sign in above, or continue as a guest and ask me anything.";
const WELCOME_SIGNED_IN =
  "Welcome back! I'm MyAIha — ask about symptoms, appointments, prescriptions or anything else.";

/**
 * Sidebar quick actions — each opens a NEW conversation pre-seeded with its
 * questionnaire code. `title` is the questionnaire's name (the conversation
 * title the engine assigns) and is used to adopt the real conversation id
 * after the engine replies (the webhook response only carries a pending id).
 */
const QUICK_ACTIONS: {
  emoji: string;
  label: string;
  questionnaireCode: string;
  title: string;
}[] = [
  {
    emoji: '🩺',
    label: 'Symptom checker',
    questionnaireCode: 'REFERRAL_REQUEST',
    title: 'Referral Request',
  },
  {
    emoji: '📅',
    label: 'Book a specialist',
    questionnaireCode: 'APPOINTMENT_SCHEDULING',
    title: 'Appointment Scheduling',
  },
  {
    emoji: '💊',
    label: 'Prescription refill',
    questionnaireCode: 'GET_CURRENT_PRESCRIPTIONS',
    title: 'Get Current Prescriptions',
  },
  {
    emoji: '📁',
    label: 'Health records',
    questionnaireCode: 'QUERY_LAST_APPOINTMENT_SUMMARY',
    title: 'Query Last Appointment Summary',
  },
];

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
    setMoreOpen(false);
  }

  /* ------------------------------ chat ------------------------------ */
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [inboxLoading, setInboxLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [endedId, setEndedId] = useState<string | null>(null);

  /* --------------------------- layout/tools -------------------------- */
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile slide-over
  const [moreOpen, setMoreOpen] = useState(false); // header "⋯" menu
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [attachment, setAttachment] = useState<{ name: string } | null>(null);
  const [listening, setListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const activeIdRef = useRef<string | null>(null);
  const endedRef = useRef<string | null>(null);
  const participantIdRef = useRef<string | null>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const scrollToEnd = useCallback(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [messages, sending, scrollToEnd]);

  /* ----------------------------- theme ------------------------------ */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('myaiha.theme');
      if (saved === 'dark' || saved === 'light') {
        setTheme(saved);
      } else if (
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ) {
        setTheme('dark');
      }
    } catch {
      /* private mode */
    }
  }, []);

  function toggleTheme() {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('myaiha.theme', next);
      } catch {
        /* private mode */
      }
      return next;
    });
  }

  /* ----------------------------- mic/dictation ---------------------- */
  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    setMicSupported(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        /* ignore */
      }
    };
  }, []);

  function toggleMic() {
    if (!micSupported || listening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        /* ignore */
      }
      setListening(false);
      return;
    }
    const w = window as unknown as Record<string, unknown>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctor = (w.SpeechRecognition || w.webkitSpeechRecognition) as any;
    const rec = new Ctor();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }
      setDraft(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  }

  // The home-page widget shares this participant's phone but is a different
  // bot; resolve its channel id once so its conversations stay out of MyAIha.
  const excludedChannelRef = useRef<string | null | undefined>(undefined);
  const siteChannelId = useCallback(async () => {
    if (excludedChannelRef.current === undefined) {
      excludedChannelRef.current = await fetchChannelIdByCode(
        MYAIHA.CHANNEL_CODE_SITE
      );
    }
    return excludedChannelRef.current;
  }, []);

  const refreshInbox = useCallback(async () => {
    setInboxLoading(true);
    try {
      const participant = await findParticipant(getChatPhone());
      if (!participant) {
        setConversations([]);
        return;
      }
      participantIdRef.current = participant.id;
      const [items, excluded] = await Promise.all([
        fetchInbox(participant.id),
        siteChannelId(),
      ]);
      setConversations(
        excluded ? items.filter((c) => c.channelId !== excluded) : items
      );
    } catch {
      /* offline — keep current list */
    } finally {
      setInboxLoading(false);
    }
  }, [siteChannelId]);

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
      setSidebarOpen(false);
      setMoreOpen(false);
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
        // Pending ids are placeholders — wait for the real conversation id.
        if (raw.conversationId.startsWith('pending-')) return;
        if (endedRef.current && raw.conversationId === endedRef.current) return;
        const current = activeIdRef.current;
        if (!current) {
          // Fresh initiation: adopt the REAL id from the reply (socket), keep
          // the optimistic messages already on screen.
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
      onConversationCreated: (payload) => {
        // Ignore creations for a different participant sharing the broadcast.
        if (
          payload.participantId &&
          participantIdRef.current &&
          payload.participantId !== participantIdRef.current
        ) {
          return;
        }
        if (activeIdRef.current === payload.newConversationId) return;
        // Adopt the real conversation the pending thread was promoted to.
        activeIdRef.current = payload.newConversationId;
        setActiveId(payload.newConversationId);
        endedRef.current = null;
        setEndedId(null);
        void refreshThread(payload.newConversationId);
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
    async (
      text: string,
      opts: {
        questionnaireCode?: string;
        /** Start a fresh conversation (engine stales old pending exchanges). */
        newConversation?: boolean;
        /** Questionnaire name — used to adopt the real id from the inbox. */
        questionnaireTitle?: string;
      } = {}
    ) => {
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
          channelCode: MYAIHA.CHANNEL_CODE_MYAIHA,
          questionnaireCode: opts.questionnaireCode,
          newConversation: opts.newConversation,
        });
        // The webhook response for a fresh conversation carries a pending-<id>
        // placeholder — only adopt REAL ids here; socket/inbox adoption below
        // handles the fresh-conversation case.
        const realId =
          res.conversationId && !res.conversationId.startsWith('pending-')
            ? res.conversationId
            : null;
        if (realId && realId !== activeIdRef.current) {
          activeIdRef.current = realId;
          setActiveId(realId);
        }
        // Reply usually arrives via socket; poll once as fallback.
        setTimeout(() => {
          if (activeIdRef.current) {
            void refreshThread(activeIdRef.current);
          } else if (opts.questionnaireTitle) {
            // Fresh conversation whose real id hasn't arrived yet: find it in
            // the inbox by the questionnaire's title and adopt it.
            void (async () => {
              try {
                const participant = await findParticipant(getChatPhone());
                if (!participant) return;
                const [items, excluded] = await Promise.all([
                  fetchInbox(participant.id),
                  siteChannelId(),
                ]);
                const visible = excluded
                  ? items.filter((c) => c.channelId !== excluded)
                  : items;
                setConversations(visible);
                const match = visible.find(
                  (c) => c.title === opts.questionnaireTitle
                );
                if (match && !activeIdRef.current) {
                  activeIdRef.current = match.conversationId;
                  setActiveId(match.conversationId);
                  await refreshThread(match.conversationId);
                }
              } catch {
                /* ignore */
              }
            })();
          }
          void refreshInbox();
        }, 1200);
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
    [sending, refreshThread, refreshInbox, siteChannelId]
  );

  /**
   * Quick-action menus: reset the thread and start a NEW conversation seeded
   * with the menu's questionnaire code. The `sending` guard (shared with the
   * composer) makes double-clicks a no-op so two pendings can never race.
   */
  const startQuestionnaire = useCallback(
    (label: string, questionnaireCode: string, questionnaireTitle: string) => {
      if (sending) return;
      activeIdRef.current = null;
      endedRef.current = null;
      setActiveId(null);
      setEndedId(null);
      setSidebarOpen(false);
      setMoreOpen(false);
      setMessages([
        {
          id: `menu-${Date.now()}`,
          role: 'user',
          text: label,
          createdAt: new Date().toISOString(),
        },
      ]);
      void send(label, { questionnaireCode, newConversation: true, questionnaireTitle });
    },
    [send, sending]
  );

  function startNew() {
    openConversation(null);
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
  const telHref = auth?.profile?.phone
    ? `tel:+${normalizePhone(auth.profile.phone)}`
    : null;

  return (
    <div
      className={`${theme} flex h-[100dvh] flex-col overflow-hidden bg-[#f6f9fb] text-[#0d1621] dark:bg-[#0b1420] dark:text-[#eef3f8]`}
    >
      {/* ---------- Top bar ---------- */}
      <header className="flex items-center justify-between gap-3 border-b border-[#e2e8ee] bg-white px-4 py-3 dark:border-[#1e2c3d] dark:bg-[#101c2b] md:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-[#e2e8ee] text-navy-500 transition hover:bg-[#f6f9fb] dark:border-[#1e2c3d] dark:text-[#a7b4c1] dark:hover:bg-white/5 md:hidden"
            aria-label="Open conversations"
          >
            ☰
          </button>
          <Link
            href="/myaiha"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-brand-gradient text-sm font-extrabold text-white"
            aria-label="Back to MyAIha home"
          >
            e
          </Link>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold">{title}</div>
            <div className="flex items-center gap-1.5 text-[11px] text-navy-400 dark:text-[#79879a]">
              <span
                className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-teal-500' : 'bg-navy-300 dark:bg-[#3a4a5c]'}`}
              />
              {connected ? 'Online' : 'Offline'} · Web
            </div>
          </div>
        </div>
        <div className="flex flex-none items-center gap-1.5">
          {telHref ? (
            <a
              href={telHref}
              title="Call"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e2e8ee] text-navy-500 transition hover:bg-[#f6f9fb]"
            >
              📞
            </a>
          ) : (
            <span
              title="Sign in to call"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e2e8ee] text-navy-300"
            >
              📞
            </span>
          )}
          <button
            type="button"
            title="Patient record"
            onClick={() =>
              startQuestionnaire(
                QUICK_ACTIONS[3].label,
                QUICK_ACTIONS[3].questionnaireCode,
                QUICK_ACTIONS[3].title
              )
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e2e8ee] text-navy-500 transition hover:bg-[#f6f9fb]"
          >
            📁
          </button>
          <button
            type="button"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e2e8ee] text-navy-500 transition hover:bg-[#f6f9fb] dark:border-[#1e2c3d] dark:text-[#a7b4c1] dark:hover:bg-white/5"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <div className="relative">
            <button
              type="button"
              title="More"
              onClick={() => setMoreOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e2e8ee] text-navy-500 transition hover:bg-[#f6f9fb] dark:border-[#1e2c3d] dark:text-[#a7b4c1] dark:hover:bg-white/5"
            >
              ⋯
            </button>
            {moreOpen && (
              <div className="absolute right-0 top-11 z-30 w-44 rounded-xl border border-[#e2e8ee] bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={startNew}
                  className="block w-full px-4 py-2 text-left text-[13px] font-semibold text-navy-600 hover:bg-navy-50"
                >
                  ＋ New conversation
                </button>
                {auth ? (
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="block w-full px-4 py-2 text-left text-[13px] font-semibold text-navy-600 hover:bg-navy-50"
                  >
                    Sign out
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      setShowAuth(true);
                    }}
                    className="block w-full px-4 py-2 text-left text-[13px] font-semibold text-navy-600 hover:bg-navy-50"
                  >
                    Sign in
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* mobile scrim */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close conversations"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-[#040c16]/50 md:hidden"
        />
      )}

      <div className="flex min-h-0 flex-1">
        {/* ---------- Sidebar (inbox) ---------- */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-72 transform flex-col bg-[#081524] p-4 transition-transform duration-200 dark:bg-[#060d16] md:static md:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="text-[15px] font-extrabold text-white">
              MyAIha
              <span className="ml-2 inline-block h-2 w-2 rounded-full bg-teal-500 align-middle" />
            </span>
          </div>
          <button
            type="button"
            onClick={startNew}
            className="mb-3 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-left text-[13px] font-semibold text-[#eaf1f7] transition hover:bg-white/10"
          >
            ＋ New conversation
          </button>

          {/* quick actions — new conversation per menu */}
          <div className="mb-2 flex flex-col gap-0.5">
            {QUICK_ACTIONS.map((qa) => (
              <button
                key={qa.questionnaireCode}
                type="button"
                disabled={sending}
                onClick={() =>
                  startQuestionnaire(qa.label, qa.questionnaireCode, qa.title)
                }
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12.5px] font-semibold text-[#b7c8d3] transition hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                <span aria-hidden>{qa.emoji}</span>
                {qa.label}
              </button>
            ))}
          </div>

          <div className="mx-4 my-2 h-px bg-white/10" />

          <div className="mb-1 px-2 text-[11px] font-bold uppercase tracking-wider text-[#6f8290]">
            Conversations
          </div>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-1">
            {inboxLoading ? (
              <div className="space-y-2 py-1" aria-busy="true">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="rounded-lg px-2 py-2.5">
                    <div className="mb-1.5 h-3 w-3/4 animate-pulse rounded bg-white/10" />
                    <div className="h-2.5 w-1/2 animate-pulse rounded bg-white/5" />
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <p className="px-2 py-1 text-xs text-[#7c8fa0]">
                No conversations yet — say hello!
              </p>
            ) : (
              conversations.map((c) => (
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
              ))
            )}
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
            <div className="mx-5 mt-3 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-[12.5px] font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
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
            <div
              className="mx-auto w-fit rounded-full border border-navy-100 bg-white px-3 py-1 text-[11px] text-navy-400 dark:border-[#1e2c3d] dark:bg-[#101c2b] dark:text-[#79879a]"
              suppressHydrationWarning
            >
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
                        ? 'rounded-br-sm bg-navy-900 text-white dark:bg-teal-600'
                        : 'rounded-bl-sm border border-[#e2e8ee] bg-white dark:border-[#1e2c3d] dark:bg-[#101c2b]'
                    }`}
                  >
                    {m.text}
                  </div>
                  <div
                    className={`mt-0.5 text-[10.5px] text-navy-300 ${
                      m.role === 'user' ? 'text-right' : ''
                    }`}
                    suppressHydrationWarning
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
                <div className="rounded-xl rounded-bl-sm border border-[#e2e8ee] bg-white px-4 py-3 dark:border-[#1e2c3d] dark:bg-[#101c2b]">
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
              'Can I get this delivered?',
              'Book a follow-up',
              'Talk to a pharmacist',
            ].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => void send(q)}
                className="rounded-full border border-[#e2e8ee] bg-white px-3.5 py-1.5 text-xs font-semibold text-navy-500 transition hover:border-teal-100 hover:bg-teal-50 hover:text-teal-600 dark:border-[#1e2c3d] dark:bg-[#101c2b] dark:text-[#a7b4c1] dark:hover:border-teal-800 dark:hover:bg-teal-900/20 dark:hover:text-teal-300"
              >
                {q}
              </button>
            ))}
          </div>

          {/* composer */}
          <div className="border-t border-[#e2e8ee] bg-white px-5 py-3 dark:border-[#1e2c3d] dark:bg-[#101c2b]">
            {attachment && (
              <div className="mb-2 flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-navy-50 px-3 py-1 text-[11.5px] font-semibold text-navy-600 dark:bg-white/10 dark:text-[#a7b4c1]">
                  📎 {attachment.name}
                  <button
                    type="button"
                    aria-label="Remove attachment"
                    onClick={() => setAttachment(null)}
                    className="ml-0.5 text-navy-400 hover:text-coral"
                  >
                    ×
                  </button>
                </span>
              </div>
            )}
            <div className="flex items-end gap-2.5">
              <div className="flex items-center gap-1.5 pb-0.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setAttachment({ name: file.name });
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  title="Attach a file"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e2e8ee] text-navy-500 transition hover:bg-[#f6f9fb] dark:border-[#1e2c3d] dark:text-[#a7b4c1] dark:hover:bg-white/5"
                >
                  📎
                </button>
                <button
                  type="button"
                  title={
                    micSupported
                      ? listening
                        ? 'Stop dictation'
                        : 'Dictate a message'
                      : 'Voice input not supported in this browser'
                  }
                  disabled={!micSupported}
                  onClick={toggleMic}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
                    listening
                      ? 'border-teal-500 bg-teal-50 text-teal-600 dark:bg-teal-900/30'
                      : 'border-[#e2e8ee] text-navy-500 hover:bg-[#f6f9fb] dark:border-[#1e2c3d] dark:text-[#a7b4c1] dark:hover:bg-white/5 disabled:cursor-not-allowed disabled:text-navy-300'
                  }`}
                >
                  🎤
                </button>
              </div>
              <textarea
                rows={1}
                className="max-h-28 min-w-0 flex-1 resize-none rounded-xl border border-[#e2e8ee] bg-[#f6f9fb] px-4 py-2.5 text-[13.5px] outline-none placeholder:text-navy-300 focus:border-teal-500 dark:border-[#1e2c3d] dark:bg-[#0b1420] dark:text-[#eef3f8] dark:placeholder:text-[#5a6b7d]"
                placeholder={listening ? 'Listening…' : 'Message MyAIha...'}
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
          </div>
        </main>
      </div>

      {/* ---------- Auth overlay ---------- */}
      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#040c16]/70 p-5 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl dark:bg-[#101c2b]">
            <div className="mb-5 flex items-center gap-2 text-base font-extrabold text-navy-900 dark:text-[#eef3f8]">
              MyAIha
              <span className="h-2 w-2 rounded-full bg-teal-500" />
            </div>

            {authStep === 'phone' ? (
              <>
                <h2 className="text-lg font-extrabold">Sign in</h2>
                <p className="mb-4 mt-1 text-[13px] text-navy-500 dark:text-[#a7b4c1]">
                  Enter your phone number — we&apos;ll text you a 6-digit code.
                </p>
                <input
                  type="tel"
                  autoComplete="tel"
                  className="w-full rounded-xl border border-navy-200 bg-navy-50 px-4 py-2.5 text-sm outline-none focus:border-teal-500 dark:border-[#1e2c3d] dark:bg-[#0b1420] dark:text-[#eef3f8]"
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
                <p className="mb-3 mt-1 text-[13px] text-navy-500 dark:text-[#a7b4c1]">
                  Sent to {normalizePhone(phoneInput)}. It expires in 10 minutes.
                </p>
                {devCode && (
                  <div className="mb-3 rounded-xl bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-600 dark:bg-teal-900/30 dark:text-teal-300">
                    Dev code: {devCode}
                  </div>
                )}
                <input
                  inputMode="numeric"
                  maxLength={6}
                  className="w-full rounded-xl border border-navy-200 bg-navy-50 px-4 py-2.5 text-center text-lg font-bold tracking-[0.35em] outline-none focus:border-teal-500 dark:border-[#1e2c3d] dark:bg-[#0b1420] dark:text-[#eef3f8]"
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
