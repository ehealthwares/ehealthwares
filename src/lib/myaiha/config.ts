/**
 * MyAIha configuration — the chat surface for ehealthwares.com.
 *
 * The conversation engine ingests MyAIha web-chat messages through the web
 * webhook, addressed by the stable channel code (not a DB id), so environments
 * only need NEXT_PUBLIC_* values. Server-only secrets (identity proxy) live in
 * src/app/api/myaiha/*.
 */

export const MYAIHA = {
  /** MyAIha's own web-chat channel — used by the /myaiha surfaces. */
  CHANNEL_CODE_MYAIHA: 'MYAIHA_WEBCHAT',
  /** The marketing-site chatbot widget channel — used by the home-page bot. */
  CHANNEL_CODE_SITE: 'EHEALTHWARES_WEBCHAT_BOT',
  /** Conversation engine base (REST + socket origin). */
  API_BASE:
    process.env.NEXT_PUBLIC_CONVERSATION_API_URL ?? 'http://localhost:8090/api',
  SOCKET_BASE:
    process.env.NEXT_PUBLIC_CONVERSATION_SOCKET_URL ?? 'http://localhost:8090',
  BOT_NAME: 'MyAIha',
} as const;

/** localStorage keys (client-side chat identity + thread state). */
export const MYAIHA_STORAGE = {
  phone: 'myaiha.chat.phone',
  token: 'myaiha.auth.token',
  refresh: 'myaiha.auth.refresh',
  profile: 'myaiha.auth.profile',
  conversation: 'myaiha.chat.conversationId',
  thread: 'myaiha.chat.thread',
} as const;
