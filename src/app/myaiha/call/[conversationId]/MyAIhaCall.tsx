'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchThread, getChatPhone, type RawExchange } from '@/lib/myaiha/chat';
import { getAuth } from '@/lib/myaiha/identity';
import { useCall } from '@/lib/myaiha/rtc/use-call';
import type { CallStatus } from '@/lib/myaiha/rtc/call-client';

function statusText(status: CallStatus, peerPresent: boolean, audioOnly: boolean): string {
  switch (status) {
    case 'connecting':
      return audioOnly ? 'Opening microphone…' : 'Opening camera and microphone…';
    case 'waiting':
      return 'Waiting for the other participant…';
    case 'connecting-peer':
      return 'Connecting…';
    case 'connected':
      return peerPresent ? 'Connected' : 'In call';
    case 'reconnecting':
      return 'Reconnecting…';
    case 'ended':
      return 'Call ended';
    case 'error':
      return 'Call failed';
    default:
      return 'Starting…';
  }
}

function VideoTile({
  stream,
  muted,
  id,
  className,
}: {
  stream: MediaStream | null;
  muted: boolean;
  id?: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.srcObject = stream;
    if (stream) void element.play().catch(() => undefined);
    return () => {
      element.srcObject = null;
    };
  }, [stream]);

  return (
    <video
      ref={ref}
      id={id}
      autoPlay
      playsInline
      muted={muted}
      className={className}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  );
}

/**
 * Patient call client for a conversation link.
 *
 * The engine sends `${CALL_LINK_BASE_URL}/${conversationId}`. Opening it:
 *  - uses the stored MyAIHA session when present,
 *  - otherwise joins as the device's guest identity (phone),
 *  - loads the conversation for context,
 *  - auto-joins the call room (the conversation id).
 *
 * A valid token wins at the gateway; if it is missing/expired the guest phone
 * identity is used, so the patient joins either way.
 */
export function MyAIhaCall({ conversationId }: { conversationId: string }) {
  const [identity] = useState(() => {
    const auth = getAuth();
    return { signedIn: Boolean(auth?.token), phone: getChatPhone() };
  });
  const call = useCall({ phone: identity.phone, guest: true });
  const { start } = call;

  const [context, setContext] = useState<RawExchange[]>([]);
  const [contextError, setContextError] = useState<string | null>(null);
  const [joinedAtLeastOnce, setJoinedAtLeastOnce] = useState(false);

  // Auto-join on mount. No one-shot guard: in dev StrictMode the effect replays
  // and useCall's cleanup disposes the first client, so re-running start() is
  // what keeps the call alive. `start` is stable, so this does not loop.
  useEffect(() => {
    start(conversationId, {});
  }, [start, conversationId]);

  useEffect(() => {
    if (call.active) setJoinedAtLeastOnce(true);
  }, [call.active]);

  // Load a little conversation context (best-effort; never blocks the call).
  useEffect(() => {
    let cancelled = false;
    fetchThread(conversationId)
      .then((page) => {
        if (!cancelled) setContext((page.items ?? []).slice(-4));
      })
      .catch(() => {
        if (!cancelled) setContextError('Could not load the conversation.');
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  const resumeSound = useCallback(() => {
    const video = document.getElementById('myaiha-remote-video') as HTMLVideoElement | null;
    void video?.play().catch(() => undefined);
  }, []);

  const remoteHasVideo = Boolean(call.remoteStream && call.remoteStream.getVideoTracks().length > 0);
  const localHasVideo = Boolean(call.localStream && call.localStream.getVideoTracks().length > 0);
  const showStage = call.active || joinedAtLeastOnce || call.localStream;

  return (
    <main className="flex min-h-screen flex-col bg-[#0b1220] text-white">
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <Link href="/myaiha/app" className="flex items-center gap-2 text-sm text-white/80 hover:text-white">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-gradient text-xs font-extrabold text-white">
            e
          </span>
          MyAIha
        </Link>
        <div className="flex flex-col items-center text-xs text-white/70">
          <span className="flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${call.status === 'connected' ? 'bg-emerald-400' : 'bg-white/40'}`}
            />
            {statusText(call.status, call.peerPresent, call.audioOnly)}
          </span>
          {(call.joinedAt || call.peerJoinedAt) && (
            <span className="text-[10px] text-white/50">
              {call.joinedAt ? `Joined ${new Date(call.joinedAt).toLocaleTimeString()}` : ''}
              {call.joinedAt && call.peerJoinedAt ? ' · ' : ''}
              {call.peerJoinedAt ? `Started ${new Date(call.peerJoinedAt).toLocaleTimeString()}` : ''}
            </span>
          )}
        </div>
        <span className="rounded-full border border-white/20 px-2 py-0.5 text-[11px] text-white/70">
          {identity.signedIn ? 'Signed in' : 'Guest'}
        </span>
      </header>

      <section className="relative flex-1 overflow-hidden bg-[#0b1220]">
        {remoteHasVideo ? (
          <VideoTile
            id="myaiha-remote-video"
            stream={call.remoteStream}
            muted={false}
            className="h-full w-full"
          />
        ) : (
          <button
            type="button"
            onClick={resumeSound}
            className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl">
              {call.audioOnly ? '🎙️' : '📞'}
            </span>
            <span className="text-lg font-semibold">
              {statusText(call.status, call.peerPresent, call.audioOnly)}
            </span>
            {call.error && <span className="max-w-md text-sm text-red-300">{call.error}</span>}
            {call.status === 'connected' && (
              <span className="text-xs text-white/50">Tap to enable sound</span>
            )}
          </button>
        )}

        {call.localStream && (
          <div className="absolute bottom-4 right-4 h-32 w-24 overflow-hidden rounded-xl border-2 border-white/30 bg-[#111827] sm:h-40 sm:w-32">
            {localHasVideo ? (
              <VideoTile stream={call.localStream} muted className="h-full w-full -scale-x-100" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-white/70">
                <span>🎙️</span>
                <span className="text-[10px]">You</span>
              </div>
            )}
          </div>
        )}

        {call.status === 'connected' && (
          <span className="absolute left-4 top-4 rounded-full bg-emerald-600/90 px-2.5 py-0.5 text-xs font-semibold">
            Live
          </span>
        )}
        {call.status === 'reconnecting' && (
          <span className="absolute left-4 top-4 rounded-full bg-amber-600/90 px-2.5 py-0.5 text-xs font-semibold">
            Reconnecting…
          </span>
        )}
      </section>

      <footer className="flex items-center justify-center gap-3 border-t border-white/10 px-4 py-4">
        {showStage && call.active ? (
          <>
            <button
              type="button"
              aria-label={call.muted ? 'Unmute' : 'Mute'}
              onClick={call.toggleMute}
              className={`flex h-12 w-12 items-center justify-center rounded-full text-lg ${call.muted ? 'bg-red-600' : 'bg-white/10 hover:bg-white/20'}`}
            >
              {call.muted ? '🔇' : '🎙️'}
            </button>
            {localHasVideo && (
              <button
                type="button"
                aria-label={call.cameraOff ? 'Turn camera on' : 'Turn camera off'}
                onClick={call.toggleCamera}
                className={`flex h-12 w-12 items-center justify-center rounded-full text-lg ${call.cameraOff ? 'bg-red-600' : 'bg-white/10 hover:bg-white/20'}`}
              >
                {call.cameraOff ? '🚫' : '📷'}
              </button>
            )}
            <button
              type="button"
              onClick={call.leave}
              className="flex h-12 items-center gap-2 rounded-full bg-red-600 px-6 font-semibold hover:bg-red-700"
            >
              📴 End call
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => start(conversationId, {})}
            className="flex h-12 items-center gap-2 rounded-full bg-emerald-600 px-6 font-semibold hover:bg-emerald-700"
          >
            📞 Join call
          </button>
        )}
      </footer>

      {(context.length > 0 || contextError) && (
        <details className="border-t border-white/10 bg-[#101c2b] px-4 py-3 text-sm text-white/80">
          <summary className="cursor-pointer select-none text-xs font-semibold uppercase tracking-wide text-white/50">
            Conversation
          </summary>
          <div className="mt-2 space-y-1.5">
            {contextError && <p className="text-red-300">{contextError}</p>}
            {context.map((message) => (
              <p key={message.id} className="truncate">
                <span className="text-white/40">
                  {message.direction === 'inbound' ? 'Patient' : 'MyAIha'}:
                </span>{' '}
                {message.text}
              </p>
            ))}
          </div>
        </details>
      )}
    </main>
  );
}
