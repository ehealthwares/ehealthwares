'use client';

import { IconPhoneCall } from '@tabler/icons-react';
import {
  CALL_CONTROL_TYPE,
  useMyAIhaCall,
  type ChatControl,
} from '@/lib/myaiha/rtc';
import { CallOverlay } from './CallOverlay';

/**
 * Standalone call button. Drop it on any page — it opens no media until the
 * user clicks, then joins the room and shows the video overlay.
 */
export function CallButton({
  callId,
  label = 'Connect call',
  className,
  audioOnly,
}: {
  /**
   * Room to join — the conversation id. The engine sets exactly this on the
   * `call.connect` control (`callId = conversation.id`), so both participants
   * land in the same room and the conversation's projections line up with it.
   */
  callId: string;
  label?: string;
  className?: string;
  /** Voice-only consultation (e.g. an AUDIO appointment). */
  audioOnly?: boolean;
}) {
  const call = useMyAIhaCall();
  const inThisCall = call.callId === callId && call.status !== 'idle';

  return (
    <>
      <button
        type="button"
        data-testid="rtc-call-button"
        onClick={() => call.start(callId, { audioOnly })}
        className={
          className ??
          'inline-flex items-center gap-2 rounded-full bg-teal-600 px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-teal-500'
        }
      >
        <IconPhoneCall size={16} />
        {call.active && call.callId === callId ? 'In call — open' : label}
      </button>
      <CallOverlay
        opened={inThisCall}
        status={call.status}
        error={call.error}
        peerPresent={call.peerPresent}
        muted={call.muted}
        cameraOff={call.cameraOff}
        audioOnly={call.audioOnly}
        localStream={call.localStream}
        remoteStream={call.remoteStream}
        onClose={call.reset}
        onHangUp={call.leave}
        onToggleMute={call.toggleMute}
        onToggleCamera={call.toggleCamera}
      />
    </>
  );
}

/**
 * The chat control: an actionable message (`call.connect`) rendered as a
 * button. Like a date picker's field, tapping it performs the action — the
 * visitor never has to answer the message.
 */
export function CallControlMessage({
  control,
}: {
  control?: ChatControl | null;
}) {
  if (!control || control.type !== CALL_CONTROL_TYPE || !control.callId) {
    return null;
  }
  return (
    <CallButton
      callId={control.callId}
      className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-teal-500/30 bg-teal-50 px-3 py-2 text-[12.5px] font-semibold text-teal-800 transition-colors hover:bg-teal-100"
    />
  );
}
