import type { Metadata } from 'next';
import { MyAIhaCall } from './MyAIhaCall';

export const metadata: Metadata = {
  title: 'MyAIha — Call',
  description: 'Join your MyAIha consultation.',
  robots: { index: false },
};

export default function MyAIhaCallPage({ params }: { params: { conversationId: string } }) {
  return <MyAIhaCall conversationId={params.conversationId} />;
}
