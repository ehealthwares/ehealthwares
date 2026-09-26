'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useMyAIhaChat } from '@/lib/myaiha/use-chat';
import { parseQuestionOptions } from '@/lib/myaiha/parse-options';
import type { ChatMessage } from '@/lib/myaiha/chat';

/**
 * Live "try it now" chat on the MyAIha landing page. Talks to the conversation
 * engine directly (public web webhook by channel code) with a per-device guest
 * phone, mirroring the storefront chatbot behavior.
 */

export function MyAIhaHeroChat() {
  const { messages, connected, sending, send } = useMyAIhaChat();
  const [draft, setDraft] = useState('');
  const [answeredOptions, setAnsweredOptions] = useState<Set<string>>(new Set());
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, sending]);

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
            <MessageBubble
              key={m.id}
              message={m}
              disabled={answeredOptions.has(m.id) || sending}
              onOptionSelect={(value) => {
                setAnsweredOptions((prev) => new Set(prev).add(m.id));
                void send(value);
              }}
            />
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

function MessageBubble({
  message,
  onOptionSelect,
  disabled,
}: {
  message: ChatMessage;
  onOptionSelect?: (value: string) => void;
  disabled?: boolean;
}) {
  const isUser = message.role === 'user';
  const parsed = !isUser ? parseQuestionOptions(message.text) : null;

  if (parsed) {
    return (
      <div className="max-w-[82%] self-start rounded-xl border border-navy-100 bg-navy-50 px-3.5 py-2.5 text-[13px] leading-relaxed">
        <div className="mb-2 font-semibold text-navy-800">{parsed.title}</div>
        <div className="flex flex-col gap-1.5">
          {parsed.options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => onOptionSelect?.(opt.value)}
              className="rounded-lg border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 text-left text-[12.5px] font-medium text-teal-700 transition hover:bg-teal-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`max-w-[82%] rounded-xl px-3.5 py-2 text-[13px] leading-relaxed ${
        isUser
          ? 'self-end rounded-br-sm bg-teal-500 font-medium text-teal-950'
          : 'self-start rounded-bl-sm border border-navy-100 bg-navy-50'
      }`}
    >
      {message.text}
    </div>
  );
}
