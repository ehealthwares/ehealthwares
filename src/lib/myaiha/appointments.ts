'use client';

/**
 * The patient's appointments as the engine exposes them to the MyAIha app
 * (`GET /patient/appointments?phone=`), backed by the EMR. Each row carries the
 * video room (`callId`) the consultation uses.
 */

import { getChatPhone } from './chat';
import { MYAIHA } from './config';

export interface MyAIhaAppointment {
  id: string;
  appointmentNumber?: string;
  providerName?: string;
  date: string;
  startTime: string;
  modality?: 'IN_PERSON' | 'VIDEO' | 'AUDIO';
  status?: string;
  reason?: string | null;
  /** Room to join on the engine's `/calls` namespace. */
  callId: string;
}

export async function fetchMyAppointments(): Promise<MyAIhaAppointment[]> {
  const phone = getChatPhone();
  const res = await fetch(
    `${MYAIHA.API_BASE}/patient/appointments?phone=${encodeURIComponent(phone)}`,
    { headers: { 'Content-Type': 'application/json' } }
  );
  if (!res.ok) {
    throw new Error(`Could not load appointments (${res.status})`);
  }
  const body = await res.json().catch(() => null);
  return Array.isArray(body) ? (body as MyAIhaAppointment[]) : [];
}

/** Statuses where the consultation has not happened yet. */
export function isUpcoming(appointment: MyAIhaAppointment): boolean {
  return (
    appointment.status === 'SCHEDULED' || appointment.status === 'CHECKED_IN'
  );
}
