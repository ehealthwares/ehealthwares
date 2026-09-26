'use client';

/**
 * Shared MyAIha chat brain — powers both the inline hero chat on /myaiha and
 * the floating site-wide chatbot widget. Talks to the conversation engine
 * through lib/myaiha/chat, keeps a per-device guest identity, and reconciles
 * the thread over the engine socket with a REST fallback.
 *
 * The engine mints a `pending-<participantId>` placeholder until the webhook
 * flow creates a real conversation, then emits `conversation.created` with the
 * old (pending) and new (real) ids. We keep the pending id out of the active
 * conversation and re-point on that event (message events remain a fallback).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  connectSocket,
  fetchChannelIdByCode,
  fetchThread,
  getChatPhone,
  getStoredConversationId,
  sendMessage,
  setStoredConversationId,
  type ChatMessage,
  type ConversationCreatedPayload,
  type RawExchange,
} from './chat';
import { MYAIHA } from './config';

export const DEFAULT_WELCOME =
  "👋 Hi! I'm MyAIha — ask about symptoms, appointments, prescriptions or anything else.";

export interface UseMyAIhaChatOptions {
  /** First bot message shown when there is no stored conversation. */
  welcome?: string;
  /** Text appended when the engine ends the conversation. */
  endedNotice?: string;
  /** Channel addressed when sending; defaults to MyAIha's own channel. */
  channelCode?: string;
}

export interface MyAIhaChat {
  messages: ChatMessage[];
  connected: boolean;
  sending: boolean;
  /** Append a user message and deliver it to the engine. */
  send: (text: string) => Promise<void>;
}

export function useMyAIhaChat(options: UseMyAIhaChatOptions = {}): MyAIhaChat {
  const {
    welcome = DEFAULT_WELCOME,
    endedNotice = 'This conversation ended — send another message to start fresh.',
    channelCode = MYAIHA.CHANNEL_CODE_MYAIHA,
  } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const conversationRef = useRef<string | null>(null);
  const pendingRef = useRef<string | null>(null);
  const participantRef = useRef<string | null>(null);
  const channelIdRef = useRef<string | null>(null);
  const endedRef = useRef<string | null>(null);

  const loadThread = useCallback(async (conversationId: string) => {
    try {
      const page = await fetchThread(conversationId);
      const items = (page.items ?? []).slice().reverse();
      // Never wipe the thread on an empty result: a pending id that has been
      // backfilled to a real conversation fetches empty — keep what's on screen.
      if (!items.length) return;
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
    // Warm the guest identity before the socket handshake, and resolve our
    // channel id so a broadcast conversation.created for another channel
    // (same participant) is ignored.
    getChatPhone();
    void fetchChannelIdByCode(channelCode).then((id) => {
      channelIdRef.current = id;
    });

    const stored = getStoredConversationId();
    if (stored && !stored.startsWith('pending-')) {
      conversationRef.current = stored;
      void loadThread(stored);
    } else {
      if (stored) setStoredConversationId(null);
      setMessages([{ id: 'welcome', role: 'bot', text: welcome, createdAt: new Date().toISOString() }]);
    }

    const socket = connectSocket({
      onConnect: () => setConnected(true),
      onDisconnect: () => setConnected(false),
      onMessage: (raw) => {
        if (!raw?.conversationId) return;
        if (endedRef.current && raw.conversationId === endedRef.current) return;
        const incoming = raw.conversationId;
        const isPending = incoming.startsWith('pending-');
        const current = conversationRef.current;
        // Ignore real messages for a different, already-active conversation.
        if (!isPending && current && incoming !== current) return;
        if (isPending) {
          if (!pendingRef.current) pendingRef.current = incoming;
        } else if (incoming !== current) {
          // Promoted pending → real: adopt and load the backfilled thread.
          conversationRef.current = incoming;
          pendingRef.current = null;
          setStoredConversationId(incoming);
          void loadThread(incoming);
        }
        if (raw.direction !== 'inbound') {
          setMessages((prev) => {
            if (prev.some((m) => m.id === raw.id)) return prev;
            return [...prev, { id: raw.id, role: 'bot', text: raw.text, createdAt: raw.createdAt }];
          });
        }
      },
      onConversationCreated: (payload: ConversationCreatedPayload) => {
        if (channelIdRef.current && payload.channelId && payload.channelId !== channelIdRef.current) {
          return;
        }
        const matchesPending = Boolean(
          payload.oldConversationId && payload.oldConversationId === pendingRef.current
        );
        const matchesParticipant = Boolean(
          payload.participantId && payload.participantId === participantRef.current
        );
        if (!matchesPending && !matchesParticipant) return;
        if (conversationRef.current === payload.newConversationId) return;
        conversationRef.current = payload.newConversationId;
        pendingRef.current = null;
        setStoredConversationId(payload.newConversationId);
        void loadThread(payload.newConversationId);
      },
      onEnded: (payload) => {
        if (!payload?.conversationId) return;
        if (payload.conversationId !== conversationRef.current) return;
        endedRef.current = payload.conversationId;
        conversationRef.current = null;
        pendingRef.current = null;
        setStoredConversationId(null);
        setMessages((prev) => [
          ...prev,
          {
            id: `ended-${Date.now()}`,
            role: 'bot',
            text: endedNotice,
            createdAt: new Date().toISOString(),
          },
        ]);
      },
    });

    return () => {
      // The chat surface shares the app socket only while mounted.
      socket?.removeAllListeners();
    };
  }, [loadThread, welcome, endedNotice, channelCode]);

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
        // Starting from nothing (no active or pending thread) declares a fresh
        // conversation so the engine stales any abandoned pending-<participantId>
        // before minting a new one. Choosing a questionnaire within an existing
        // pending initiation is NOT fresh, so its orphan exchanges backfill.
        const startingFresh = !conversationRef.current && !pendingRef.current;
        const res = await sendMessage(trimmed, {
          conversationId: conversationRef.current,
          channelCode,
          newConversation: startingFresh,
        });
        if (res.participantId) participantRef.current = res.participantId;
        const returned = res.conversationId;
        if (returned) {
          if (returned.startsWith('pending-')) {
            // Keep the placeholder out of the active conversation and storage.
            pendingRef.current = returned;
          } else {
            conversationRef.current = returned;
            pendingRef.current = null;
            setStoredConversationId(returned);
          }
        }
        // Replies arrive via socket; poll a real conversation only as fallback.
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
    [sending, loadThread, channelCode]
  );

  return { messages, connected, sending, send };
}
