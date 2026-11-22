'use client';

import { useEffect, useRef } from 'react';
import {
  IconMicrophone,
  IconMicrophoneOff,
  IconPhoneOff,
  IconVideo,
  IconVideoOff,
} from '@tabler/icons-react';
import type { CallStatus } from '@/lib/myaiha/rtc';

function VideoTile({
  stream,
  muted,
  mirrored,
}: {
  stream: MediaStream | null;
  muted: boolean;
  mirrored?: boolean;
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
      autoPlay
      playsInline
      muted={muted}
      className="h-full w-full object-cover"
      style={mirrored ? { transform: 'scaleX(-1)' } : undefined}
    />
  );
}

function statusLabel(
  status: CallStatus,
  peerPresent: boolean,
  audioOnly: boolean
): string {
  switch (status) {
    case 'connecting':
      return audioOnly ? 'Opening microphone…' : 'Opening camera and microphone…';
    case 'waiting':
      return 'Waiting for the other participant to join…';
    case 'connecting-peer':
      return 'Connecting to the other participant…';
    case 'connected':
      return peerPresent ? 'Connected' : 'In call';
    case 'reconnecting':
      return 'Reconnecting…';
    case 'ended':
      return 'Call ended';
    case 'error':
      return 'Call failed';
    default:
      return '';
  }
}

export interface CallOverlayProps {
  opened: boolean;
  status: CallStatus;
  error: string | null;
  peerPresent: boolean;
  muted: boolean;
  cameraOff: boolean;
  /** Voice-only call: no camera track locally or remotely. */
  audioOnly: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onClose: () => void;
  onHangUp: () => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
}

/** Full-screen video room shown while a consultation is live (or just ended). */
export function CallOverlay({
  opened,
  status,
  error,
  peerPresent,
  muted,
  cameraOff,
  audioOnly,
  localStream,
  remoteStream,
  onClose,
  onHangUp,
  onToggleMute,
  onToggleCamera,
}: CallOverlayProps) {
  if (!opened) return null;

  const remoteHasVideo = Boolean(
    remoteStream && remoteStream.getVideoTracks().length > 0
  );
  const localHasVideo = Boolean(
    localStream && localStream.getVideoTracks().length > 0
  );
  const live =
    status === 'connecting' ||
    status === 'waiting' ||
    status === 'connecting-peer' ||
    status === 'connected' ||
    status === 'reconnecting';

  return (
    <div
      role="dialog"
      aria-label="Video consultation"
      data-testid="rtc-call-overlay"
      className="fixed inset-0 z-[10000] flex flex-col bg-navy-950/95 backdrop-blur-sm"
    >
      <div className="relative m-3 flex-1 overflow-hidden rounded-2xl bg-[#0B1220]">
        {remoteHasVideo ? (
          <VideoTile stream={remoteStream} muted={false} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-white/85">
            {audioOnly && (
              <span className="mb-1 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                <IconMicrophone size={26} />
              </span>
            )}
            <p className="text-sm font-semibold">
              {audioOnly
                ? 'Audio call'
                : statusLabel(status, peerPresent, audioOnly)}
            </p>
            {audioOnly && (
              <p className="text-xs text-white/60">
                {statusLabel(status, peerPresent, true)} · voice only
              </p>
            )}
            {error && <p className="max-w-md text-xs text-red-300">{error}</p>}
          </div>
        )}

        {localStream && (
          <div className="absolute bottom-3 right-3 aspect-[4/3] w-36 overflow-hidden rounded-xl border-2 border-white/35 bg-navy-900 sm:w-44">
            {localHasVideo ? (
              <VideoTile stream={localStream} muted mirrored />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-1 text-white/80">
                <IconMicrophone size={18} />
                <span className="text-[11px]">You · audio</span>
              </div>
            )}
          </div>
        )}

        {status === 'connected' && (
          <span className="absolute left-3 top-3 rounded-full bg-teal-600/90 px-2.5 py-0.5 text-[11px] font-bold text-white">
            Live
          </span>
        )}

        {status === 'reconnecting' && (
          <span className="absolute left-3 top-3 rounded-full bg-amber-600/90 px-2.5 py-0.5 text-[11px] font-bold text-white">
            Reconnecting…
          </span>
        )}
      </div>

      <div className="flex flex-none items-center justify-center gap-3 pb-6 pt-1">
        {live ? (
          <>
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
              className={`flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors ${
                muted ? 'bg-red-600 hover:bg-red-500' : 'bg-white/15 hover:bg-white/25'
              }`}
            >
              {muted ? <IconMicrophoneOff size={20} /> : <IconMicrophone size={20} />}
            </button>
            {localHasVideo && (
              <button
                type="button"
                onClick={onToggleCamera}
                aria-label={cameraOff ? 'Turn camera on' : 'Turn camera off'}
                className={`flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors ${
                  cameraOff ? 'bg-red-600 hover:bg-red-500' : 'bg-white/15 hover:bg-white/25'
                }`}
              >
                {cameraOff ? <IconVideoOff size={20} /> : <IconVideo size={20} />}
              </button>
            )}
            <button
              type="button"
              onClick={onHangUp}
              data-testid="rtc-call-hangup"
              className="flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-red-500"
            >
              <IconPhoneOff size={17} /> End call
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/15 px-5 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-white/25"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
