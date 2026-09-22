import type { Metadata } from 'next';
import { MyAIhaApp } from './MyAIhaApp';

export const metadata: Metadata = {
  title: 'MyAIha — Chat',
  description:
    'Chat with MyAIha — sign in with your phone and continue your conversations across devices.',
  robots: { index: false },
};

export default function MyAIhaAppPage() {
  return <MyAIhaApp />;
}
