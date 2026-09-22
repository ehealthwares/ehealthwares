/**
 * MyAIha web chat client — shared by myaiha.html (floating widget) and
 * myaiha-app.html (full app). Talks to the conversation engine:
 *
 *   POST /api/webhooks/web            — send an inbound message
 *     { channelCode: 'EHEALTHWARES_WEBCHAT_BOT', senderPhone, text,
 *       conversationId?, questionnaireCode? }
 *   GET  /api/exchanges?conversationId — thread history (paginated)
 *   GET  /api/conversations/inbox      — conversation list for a participant
 *   socket.io /conversations           — realtime events
 *
 * Auth model mirrors the storefront chatbot: an access token from the
 * identity service when signed in, otherwise a guest device phone.
 */

(function (global) {
  'use strict';

  // Dev defaults; overridable via window.MYAIHA_CONFIG before this script runs.
  var CONFIG = Object.assign(
    {
      API_BASE: 'http://localhost:8090/api',
      SOCKET_BASE: 'http://localhost:8090',
      CHANNEL_CODE: 'EHEALTHWARES_WEBCHAT_BOT',
      IDENTITY_BASE: 'http://localhost:8092/api',
      BOT_NAME: 'MyAIha',
    },
    global.MYAIHA_CONFIG || {},
  );

  var STORAGE = {
    phone: 'myaiha.chat.phone',
    token: 'myaiha.auth.token',
    refresh: 'myaiha.auth.refresh',
    profile: 'myaiha.auth.profile',
    conversation: 'myaiha.chat.conversationId',
    thread: 'myaiha.chat.thread',
  };

  function storageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }
  function storageSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      /* private mode */
    }
  }
  function storageRemove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      /* ignore */
    }
  }

  /* ------------------------------------------------------------------ */
  /* Identity — phone + OTP sign-in via the identity service             */
  /* ------------------------------------------------------------------ */

  function normalizePhone(phone) {
    var digits = String(phone || '').replace(/[^0-9]/g, '');
    return digits;
  }

  async function requestOtp(phone, channel) {
    var res = await fetch(CONFIG.IDENTITY_BASE + '/auth/shopper/request-otp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone: normalizePhone(phone), channel: channel || 'sms' }),
    });
    var body = await res.json().catch(function () { return {}; });
    if (!res.ok) {
      throw new Error(body.message || 'Could not send verification code');
    }
    return body; // { sent, channel, code? } — code present when OTP_EXPOSE_CODE
  }

  async function signInWithPhone(phone, channel) {
    // Shopper sign-in verifies the OTP on the client device (identity service
    // contract); the backend only needs the phone to issue tokens.
    var res = await fetch(CONFIG.IDENTITY_BASE + '/auth/shopper/verify-otp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone: normalizePhone(phone) }),
    });
    var body = await res.json().catch(function () { return {}; });
    if (!res.ok) {
      throw new Error(body.message || 'Sign-in failed');
    }
    setAuth({
      accessToken: body.accessToken,
      refreshToken: body.refreshToken,
      profile: { phone: normalizePhone(phone), username: body.username || null },
    });
    return body;
  }

  function getAuth() {
    var token = storageGet(STORAGE.token);
    if (!token) return null;
    var profile = null;
    try {
      profile = JSON.parse(storageGet(STORAGE.profile) || 'null');
    } catch (e) { profile = null; }
    return { token: token, refreshToken: storageGet(STORAGE.refresh), profile: profile };
  }

  function setAuth(auth) {
    if (!auth || !auth.accessToken) {
      storageRemove(STORAGE.token);
      storageRemove(STORAGE.refresh);
      storageRemove(STORAGE.profile);
      return;
    }
    storageSet(STORAGE.token, auth.accessToken);
    if (auth.refreshToken) storageSet(STORAGE.refresh, auth.refreshToken);
    if (auth.profile) storageSet(STORAGE.profile, JSON.stringify(auth.profile));
  }

  function signOut() {
    storageRemove(STORAGE.token);
    storageRemove(STORAGE.refresh);
    storageRemove(STORAGE.profile);
    if (global.socket) {
      global.socket.disconnect();
      global.socket = null;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Chat identity — signed-in token, else guest device phone            */
  /* ------------------------------------------------------------------ */

  function getChatPhone() {
    var auth = getAuth();
    if (auth && auth.profile && auth.profile.phone) return auth.profile.phone;
    var stored = storageGet(STORAGE.phone);
    if (stored) return stored;
    var phone = String(Date.now());
    storageSet(STORAGE.phone, phone);
    return phone;
  }

  function setChatPhone(phone) {
    storageSet(STORAGE.phone, normalizePhone(phone));
  }

  function isGuest() {
    return !getAuth();
  }

  /* ------------------------------------------------------------------ */
  /* HTTP                                                                */
  /* ------------------------------------------------------------------ */

  function authHeaders() {
    var auth = getAuth();
    return auth && auth.token ? { Authorization: 'Bearer ' + auth.token } : {};
  }

  async function apiFetch(path, options) {
    options = options || {};
    var res = await fetch(CONFIG.API_BASE + path, {
      method: options.method || 'GET',
      headers: Object.assign({ 'content-type': 'application/json' }, authHeaders(), options.headers || {}),
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    var body = await res.json().catch(function () { return {}; });
    if (!res.ok) {
      var err = new Error(body.message || ('Request failed (' + res.status + ')'));
      err.status = res.status;
      throw err;
    }
    return body;
  }

  /**
   * Send an inbound chat message through the web webhook, addressed by the
   * channel code. Returns { conversationId, participantId }.
   */
  async function sendMessage(text, opts) {
    opts = opts || {};
    var body = {
      channelCode: CONFIG.CHANNEL_CODE,
      senderPhone: getChatPhone(),
      text: text,
    };
    if (opts.conversationId) body.conversationId = opts.conversationId;
    if (opts.questionnaireCode) body.questionnaireCode = opts.questionnaireCode;
    var res = await apiFetch('/webhooks/web', { method: 'POST', body: body });
    if (res.conversationId) storageSet(STORAGE.conversation, res.conversationId);
    return res;
  }

  async function fetchThread(conversationId, cursor) {
    var params = new URLSearchParams({ conversationId: conversationId, limit: '30' });
    if (cursor) params.set('cursor', cursor);
    var res = await apiFetch('/exchanges?' + params.toString());
    return res; // { items, nextCursor? }
  }

  async function fetchInbox(participantId) {
    var params = new URLSearchParams({
      participantId: participantId,
      activeOnly: 'false',
      limit: '30',
    });
    var res = await apiFetch('/conversations/inbox?' + params.toString());
    return res.items || [];
  }

  async function findParticipant(phone) {
    try {
      var res = await apiFetch('/participants?phone=' + encodeURIComponent(phone));
      var list = Array.isArray(res) ? res : res.data || res.items || [];
      return list.length ? list[0] : null;
    } catch (e) {
      return null;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Thread persistence (localStorage, survives restarts)                */
  /* ------------------------------------------------------------------ */

  function saveThread(conversationId, messages) {
    try {
      localStorage.setItem(
        STORAGE.thread,
        JSON.stringify({ conversationId: conversationId, messages: messages, savedAt: Date.now() }),
      );
    } catch (e) { /* quota */ }
  }

  function loadThread(conversationId) {
    try {
      var raw = JSON.parse(storageGet(STORAGE.thread) || 'null');
      if (raw && raw.conversationId === conversationId) return raw.messages || [];
    } catch (e) { /* corrupt */ }
    return null;
  }

  function clearConversationState() {
    storageRemove(STORAGE.conversation);
    storageRemove(STORAGE.thread);
  }

  /* ------------------------------------------------------------------ */
  /* Realtime socket                                                     */
  /* ------------------------------------------------------------------ */

  var socket = null;
  var socketIdentityKey = '';

  /** Connect (or re-auth) the shared socket; returns the socket instance. */
  function connect(handlers) {
    var phone = getChatPhone();
    var auth = getAuth();
    var identityKey = phone + '|' + (auth ? auth.token : 'guest');
    var needReconnect = socket && identityKey !== socketIdentityKey;

    if (socket && !needReconnect) {
      if (handlers) attach(handlers);
      return socket;
    }
    if (socket) socket.disconnect();

    if (typeof io === 'undefined') {
      throw new Error('socket.io client not loaded');
    }

    socket = io(CONFIG.SOCKET_BASE + '/conversations', {
      transports: ['websocket'],
      auth: {
        token: auth ? auth.token : undefined,
        guest: !auth,
        phone: phone,
      },
    });
    socketIdentityKey = identityKey;
    if (handlers) attach(handlers);
    return socket;
  }

  function attach(handlers) {
    // Clear prior handlers to avoid duplicates on reconnect.
    socket.off('connect');
    socket.off('disconnect');
    socket.off('conversation.message.created');
    socket.off('conversation.message.orphan');
    socket.off('conversation.ended');
    socket.on('connect', function () { handlers.onConnect && handlers.onConnect(); });
    socket.on('disconnect', function () { handlers.onDisconnect && handlers.onDisconnect(); });
    socket.on('conversation.message.created', handlers.onMessage || function () {});
    socket.on('conversation.message.orphan', handlers.onMessage || function () {});
    socket.on('conversation.ended', handlers.onEnded || function () {});
  }

  function disconnect() {
    if (socket) {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('conversation.message.created');
      socket.off('conversation.message.orphan');
      socket.off('conversation.ended');
      socket.disconnect();
      socket = null;
      socketIdentityKey = '';
    }
  }

  /* ------------------------------------------------------------------ */
  /* Export                                                              */
  /* ------------------------------------------------------------------ */

  global.MyAIhaChat = {
    CONFIG: CONFIG,
    requestOtp: requestOtp,
    signInWithPhone: signInWithPhone,
    getAuth: getAuth,
    setAuth: setAuth,
    signOut: signOut,
    getChatPhone: getChatPhone,
    setChatPhone: setChatPhone,
    isGuest: isGuest,
    sendMessage: sendMessage,
    fetchThread: fetchThread,
    fetchInbox: fetchInbox,
    findParticipant: findParticipant,
    saveThread: saveThread,
    loadThread: loadThread,
    clearConversationState: clearConversationState,
    connect: connect,
    disconnect: disconnect,
    socket: function () { return socket; },
  };
})(window);