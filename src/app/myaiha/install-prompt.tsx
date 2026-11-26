'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'myaiha.pwa.dismissed';

/**
 * Install banner for the MyAIHA PWA (Chromium `beforeinstallprompt`, plus an
 * iOS Safari "Add to Home Screen" hint). Rendered only on the MyAIHA app page.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === '1') return;
    } catch {
      /* private mode */
    }

    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const ua = window.navigator.userAgent || '';
    const isIos = /iphone|ipad|ipod/i.test(ua);
    const isSafari = /safari/i.test(ua) && !/crios|fxios|chrome|android/i.test(ua);
    if (isIos && isSafari) {
      setIosHint(true);
      setVisible(true);
      return;
    }

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt().catch(() => undefined);
    await deferred.userChoice.catch(() => undefined);
    setDeferred(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-2xl border border-[#e2e8ee] bg-white p-3 shadow-xl dark:border-[#1e2c3d] dark:bg-[#101c2b] md:inset-x-auto md:right-4 md:mx-0">
      <div className="flex items-start gap-3">
        <Image
          src="/myaiha/icon-192.png"
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#0f2a43] dark:text-white">Install MyAIha</p>
          {iosHint ? (
            <p className="mt-0.5 text-xs text-[#5b6b7c] dark:text-[#a7b4c1]">
              Tap <span className="font-semibold">Share</span> →{' '}
              <span className="font-semibold">Add to Home Screen</span> to install.
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-[#5b6b7c] dark:text-[#a7b4c1]">
              Add MyAIha to your home screen for full-screen chat and calls.
            </p>
          )}
          <div className="mt-2 flex gap-2">
            {!iosHint && (
              <button
                type="button"
                onClick={() => void install()}
                className="rounded-lg bg-[#0f766e] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#115e59]"
              >
                Install
              </button>
            )}
            <button
              type="button"
              onClick={dismiss}
              className="rounded-lg border border-[#e2e8ee] px-3 py-1.5 text-xs font-semibold text-[#0f2a43] hover:bg-[#f6f9fb] dark:border-[#1e2c3d] dark:text-white dark:hover:bg-white/5"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
