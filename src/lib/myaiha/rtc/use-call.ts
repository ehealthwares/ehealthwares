'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getAuth } from '../identity';
import { MYAIHA } from '../config';
import { CallClient, IDLE_CALL, type CallAuth, type CallState, type CallStreams } from './call-client';

export type UseCallOptions = {
  /** Guest identity for the `/calls` handshake (usually the device chat phone). */
  phone?: string;
  guest?: boolean;
};

/**
 * React binding for `CallClient` in the MyAIHA app. Opens no media and no
 * socket until `start(callId)` is called.
 */
export function useCall(options: UseCallOptions = {}) {
  const [state, setState] = useState<CallState>(IDLE_CALL);
  const [streams, setStreams] = useState<CallStreams>({ local: null, remote: null });
  const clientRef = useRef<CallClient | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const start = useCallback((callId: string, startOptions?: { audioOnly?: boolean }) => {
    clientRef.current?.dispose();
    const token = getAuth()?.token ?? null;
    const auth: CallAuth = {
      token,
      phone: optionsRef.current.phone,
      // Join either way: a valid token wins at the gateway, otherwise the guest
      // phone identity is used so the patient is never locked out of the call.
      guest: optionsRef.current.guest ?? !token,
    };
    const client = new CallClient({
      socketUrl: MYAIHA.SOCKET_BASE,
      auth,
      onChange: (next, nextStreams) => {
        setState(next);
        setStreams(nextStreams);
      },
    });
    clientRef.current = client;
    void client.start(callId, startOptions);
  }, []);

  const leave = useCallback(() => clientRef.current?.leave(), []);
  const toggleMute = useCallback(() => clientRef.current?.toggleMute(), []);
  const toggleCamera = useCallback(() => clientRef.current?.toggleCamera(), []);
  const reset = useCallback(() => {
    clientRef.current?.dispose();
    clientRef.current = null;
    setState(IDLE_CALL);
    setStreams({ local: null, remote: null });
  }, []);

  useEffect(
    () => () => {
      clientRef.current?.dispose();
      clientRef.current = null;
    },
    []
  );

  const active =
    state.status === 'connecting' ||
    state.status === 'waiting' ||
    state.status === 'connecting-peer' ||
    state.status === 'connected' ||
    state.status === 'reconnecting';

  return {
    ...state,
    active,
    localStream: streams.local,
    remoteStream: streams.remote,
    start,
    leave,
    toggleMute,
    toggleCamera,
    reset,
  };
}
