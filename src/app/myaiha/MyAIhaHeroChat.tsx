'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  connectSocket,
  fetchThread,
  getChatPhone,
  getStoredConversationId,
  sendMessage,
  setStoredConversationId,
  type ChatMessage,
  type RawExchange,
} from '@/lib/myaiha/chat';

/**
 * Live "try it now" chat on the MyAIha landing page. Talks to the conversation
 * engine directly (public web webhook by channel code) with a per-device guest
 * phone, mirroring the storefront chatbot behavior.
 */

const WELCOME =
  '👋 Hi! I\'m MyAIha — ask about symptoms, appointments, prescriptions or anything else.';

export function MyAIhaHeroChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const conversationRef = useRef<string | null>(null);
  const endedRef = useRef<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const render = useCallback(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, []);

  const loadThread = useCallback(async (conversationId: string) => {
    try {
      const page = await fetchThread(conversationId);
      const items = (page.items ?? []).slice().reverse();
      setMessages(
        items.map((x: RawExchange) => ({
          id: x.id,
          role: x.direction === 'inbound' ? 'user' : 'bot',
          text: x.text,
          createdAt: x.createdAt,
        }))
      );
    } catch {
      /* keep current view */
    }
  }, []);

  useEffect(() => {
    // Warm the guest identity before the socket handshake.
    getChatPhone();
    const stored = getStoredConversationId();
    if (stored) {
      conversationRef.current = stored;
      void loadThread(stored);
    } else {
      setMessages([{ id: 'welcome', role: 'bot', text: WELCOME, createdAt: new Date().toISOString() }]);
    }

    const socket = connectSocket({
      onConnect: () => setConnected(true),
      onDisconnect: () => setConnected(false),
      onMessage: (raw) => {
        if (!raw?.conversationId) return;
        if (endedRef.current && raw.conversationId === endedRef.current) return;
        const current = conversationRef.current;
        if (current && raw.conversationId !== current) return;
        conversationRef.current = raw.conversationId;
        setStoredConversationId(raw.conversationId);
        if (raw.direction !== 'inbound') {
          setMessages((prev) => {
            if (prev.some((m) => m.id === raw.id)) return prev;
            return [
              ...prev,
              { id: raw.id, role: 'bot', text: raw.text, createdAt: raw.createdAt },
            ];
          });
        }
      },
      onEnded: (payload) => {
        if (!payload?.conversationId) return;
        if (payload.conversationId !== conversationRef.current) return;
        endedRef.current = payload.conversationId;
        conversationRef.current = null;
        setStoredConversationId(null);
        setMessages((prev) => [
          ...prev,
          {
            id: `ended-${Date.now()}`,
            role: 'bot',
            text: 'This conversation ended — send another message to start fresh.',
            createdAt: new Date().toISOString(),
          },
        ]);
      },
    });

    return () => {
      // The hero widget shares the app socket only while mounted; the app page
      // reconnects with its own identity when opened.
      socket?.removeAllListeners();
    };
  }, [loadThread]);

  useEffect(() => {
    render();
  }, [messages, sending, render]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;
      setSending(true);
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
          conversationId: conversationRef.current,
        });
        if (res.conversationId) {
          conversationRef.current = res.conversationId;
          setStoredConversationId(res.conversationId);
        }
        // Replies usually arrive via socket; poll once as a fallback.
        setTimeout(() => {
          if (conversationRef.current) void loadThread(conversationRef.current);
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
    [sending, loadThread]
  );

  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-4 rounded-[28px] bg-teal-500/10 blur-2xl" />
      <div className="relative overflow-hidden rounded-3xl bg-white text-navy-900 shadow-2xl">
        {/* head */}
        <div className="flex items-center gap-3 border-b border-navy-100 px-5 py-3.5">
          <div className="h-8 w-8 flex-none rounded-full bg-brand-gradient" />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold">MyAIha</div>
            <div className="flex items-center gap-2 text-[11px] text-navy-400">
              <span>Live — try it now</span>
              <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wide text-teal-600">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-teal-500' : 'bg-navy-300'}`}
                />
                {connected ? 'online' : 'connecting'}
              </span>
            </div>
          </div>
        </div>

        {/* messages */}
        <div
          ref={bodyRef}
          className="flex h-64 flex-col gap-2.5 overflow-y-auto px-4 py-4"
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[82%] rounded-xl px-3.5 py-2 text-[13px] leading-relaxed ${
                m.role === 'user'
                  ? 'self-end rounded-br-sm bg-teal-500 font-medium text-teal-950'
                  : 'self-start rounded-bl-sm border border-navy-100 bg-navy-50'
              }`}
            >
              {m.text}
            </div>
          ))}
          {sending && (
            <div className="flex max-w-[82%] items-center gap-1 self-start rounded-xl border border-navy-100 bg-navy-50 px-4 py-3">
              <span className="typing-dot" />
              <span className="typing-dot" style={{ animationDelay: '0.15s' }} />
              <span className="typing-dot" style={{ animationDelay: '0.3s' }} />
            </div>
          )}
        </div>

        {/* composer */}
        <div className="flex items-center gap-2 border-t border-navy-100 px-4 py-3">
          <input
            className="min-w-0 flex-1 rounded-full border border-navy-100 bg-navy-50 px-4 py-2.5 text-[13px] text-navy-900 outline-none placeholder:text-navy-300 focus:border-teal-500"
            placeholder="Ask MyAIha anything…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void send(draft);
                setDraft('');
              }
            }}
          />
          <button
            type="button"
            onClick={() => {
              void send(draft);
              setDraft('');
            }}
            disabled={sending}
            className="rounded-full bg-teal-500 px-4 py-2.5 text-[13px] font-bold text-teal-950 transition hover:bg-teal-400 disabled:opacity-50"
          >
            Send
          </button>
        </div>
        <Link
          href="/myaiha/app"
          className="block pb-3 text-center text-[11.5px] font-semibold text-teal-600 hover:underline"
        >
          Open the full MyAIha app →
        </Link>
      </div>
    </div>
  );
}
