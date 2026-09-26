'use client';

/**
 * Floating MyAIha chatbot for the marketing site. Mirrors the storefront
 * chatbot widget: a fixed launcher that expands into a chat panel and talks to
 * the conversation engine through the shared useMyAIhaChat hook.
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  IconMessageCircle,
  IconRobotFace,
  IconSend,
  IconSparkles,
  IconX,
} from '@tabler/icons-react';
import { useMyAIhaChat } from '@/lib/myaiha/use-chat';
import { parseQuestionOptions } from '@/lib/myaiha/parse-options';
import type { ChatMessage } from '@/lib/myaiha/chat';
import { MYAIHA } from '@/lib/myaiha/config';

const SITE_WELCOME =
  "👋 Hi! I'm the eHealthwares executive assistant — ask about our products, services or partnerships.";

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open ? (
        <ChatPanel onClose={() => setOpen(false)} />
      ) : (
        <ChatLauncher onClick={() => setOpen(true)} />
      )}
    </>
  );
}

function ChatLauncher({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Chat with Ehealthwares Assistant"
      className="group fixed bottom-6 right-6 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-navy-800 text-white shadow-glow-teal transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/40"
    >
      <IconMessageCircle size={26} stroke={2} />
      <span className="absolute -top-0.5 right-0.5 flex h-3.5 w-3.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
        <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500" />
      </span>
    </button>
  );
}

function ChatPanel({ onClose }: { onClose: () => void }) {
  const { messages, connected, sending, send } = useMyAIhaChat({
    channelCode: MYAIHA.CHANNEL_CODE_SITE,
    welcome: SITE_WELCOME,
  });
  const [draft, setDraft] = useState('');
  const [answered, setAnswered] = useState<Set<string>>(new Set());
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, sending]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    void send(trimmed);
    setDraft('');
  };

  const lastUserIdx = messages.reduce(
    (last, m, i) => (m.role === 'user' ? i : last),
    -1
  );

  return (
    <div
      role="dialog"
      aria-label="eHealthwares chat"
      className="fixed bottom-6 right-6 z-[9999] flex h-[min(580px,calc(100dvh-3rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-navy-100 bg-white shadow-glass-lg"
    >
      {/* Header */}
      <div className="flex flex-none items-center justify-between gap-3 bg-gradient-to-br from-teal-600 to-navy-800 px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white/15 text-white">
            <IconRobotFace size={20} />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-bold text-white">eHealthwares Frontdesk</div>
            <div className="flex items-center gap-1.5 text-[11px] text-white/70">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  connected ? 'bg-teal-300' : 'bg-white/40'
                }`}
              />
              {connected ? 'Online' : 'Connecting…'}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/90 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        >
          <IconX size={18} />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={bodyRef}
        className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-3.5 py-4"
      >
        {messages.length === 0 && (
          <p className="py-10 text-center text-[13px] text-navy-400">
            {SITE_WELCOME}
          </p>
        )}
        {messages.map((msg, idx) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            disabled={
              answered.has(msg.id) || sending || (msg.role !== 'user' && lastUserIdx >= idx)
            }
            onOptionSelect={(value) => {
              setAnswered((prev) => new Set(prev).add(msg.id));
              void send(value);
            }}
          />
        ))}
        {sending && (
          <div className="flex max-w-[82%] items-center gap-1 self-start rounded-2xl rounded-bl-sm border border-navy-100 bg-navy-50 px-4 py-3">
            <span className="typing-dot" />
            <span className="typing-dot" style={{ animationDelay: '0.15s' }} />
            <span className="typing-dot" style={{ animationDelay: '0.3s' }} />
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="flex flex-none items-center gap-2 border-t border-navy-100 px-3.5 py-3">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit(draft);
            }
          }}
          placeholder="Type a message…"
          aria-label="Message MyAIha"
          className="min-w-0 flex-1 rounded-full border border-navy-100 bg-navy-50 px-4 py-2.5 text-[13px] text-navy-900 outline-none transition-colors placeholder:text-navy-300 focus:border-teal-500"
        />
        <button
          type="button"
          onClick={() => submit(draft)}
          disabled={!draft.trim() || sending}
          aria-label="Send message"
          className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-teal-600 text-white transition-colors hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
        >
          <IconSend size={16} />
        </button>
      </div>

      <Link
        href="/"
        className="flex flex-none items-center justify-center gap-1 pb-3 text-center text-[11.5px] font-semibold text-teal-700 transition-colors hover:text-teal-600"
      >
        <IconSparkles size={12} /> Powered by eHealthwares
      </Link>
    </div>
  );
}

function MessageBubble({
  message,
  disabled,
  onOptionSelect,
}: {
  message: ChatMessage;
  disabled?: boolean;
  onOptionSelect: (value: string) => void;
}) {
  const isUser = message.role === 'user';
  const parsed = !isUser ? parseQuestionOptions(message.text) : null;
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (parsed) {
    return (
      <div className="w-full self-start">
        <div className="mb-1.5 text-[13px] font-semibold text-navy-800">{parsed.title}</div>
        <div className="flex flex-col gap-1.5">
          {parsed.options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => onOptionSelect(opt.value)}
              className="rounded-xl border border-teal-500/30 bg-teal-50 px-3 py-2 text-left text-[12.5px] font-medium text-teal-800 transition-colors hover:bg-teal-100 disabled:cursor-not-allowed disabled:border-navy-100 disabled:bg-navy-50 disabled:text-navy-300"
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="mt-1 pr-1 text-right text-[10px] text-navy-400">{time}</div>
      </div>
    );
  }

  return (
    <div
      className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${
        isUser
          ? 'self-end rounded-br-sm bg-teal-600 text-white'
          : 'self-start rounded-bl-sm border border-navy-100 bg-navy-50 text-navy-800'
      } ${message.optimistic ? 'opacity-70' : ''}`}
    >
      <p className="whitespace-pre-wrap break-words">{message.text}</p>
      <div
        className={`mt-1 text-right text-[10px] ${
          isUser ? 'text-white/60' : 'text-navy-400'
        }`}
      >
        {time}
      </div>
    </div>
  );
}
