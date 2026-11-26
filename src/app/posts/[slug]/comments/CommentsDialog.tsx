'use client';

import { useEffect, useRef } from 'react';
import { IconLoader2, IconSend, IconX } from '@tabler/icons-react';
import { usePostComments } from './context';

const inputClass =
  'w-full rounded-xl border border-navy-200 bg-white px-3.5 py-2.5 text-sm text-navy-800 placeholder:text-navy-300 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';
const labelClass = 'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-navy-500';

/**
 * Optional identity step shared by every composer on the page. Dismissing it
 * still posts the comment — as Anonymous.
 */
export function CommentsDialog() {
  const {
    dialogOpen,
    identity,
    setIdentity,
    fieldErrors,
    setFieldErrors,
    submitting,
    submitError,
    submitWithDetails,
    dismissDialog,
  } = usePostComments();

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (dialogOpen) nameInputRef.current?.focus();
  }, [dialogOpen]);

  if (!dialogOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close and post as Anonymous"
        onClick={dismissDialog}
        className="absolute inset-0 cursor-default bg-navy-950/55 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="comment-dialog-title"
        aria-describedby="comment-dialog-desc"
        className="relative w-full max-w-md rounded-3xl border border-navy-100 bg-white p-6 shadow-2xl"
        data-testid="post-comment-dialog"
      >
        <button
          type="button"
          onClick={dismissDialog}
          aria-label="Close and post as Anonymous"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-navy-400 transition-colors hover:bg-navy-50 hover:text-navy-700"
        >
          <IconX size={18} />
        </button>

        <h3
          id="comment-dialog-title"
          className="font-display text-lg font-extrabold text-navy-900"
        >
          Add your details
        </h3>
        <p id="comment-dialog-desc" className="mt-1.5 text-sm leading-relaxed text-navy-500">
          All fields are optional. If you close this window, your comment will still be posted
          as <span className="font-semibold text-navy-700">Anonymous</span>.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="comment-name" className={labelClass}>
              Name
            </label>
            <input
              id="comment-name"
              ref={nameInputRef}
              value={identity.name}
              onChange={(event) => setIdentity((v) => ({ ...v, name: event.target.value }))}
              placeholder="e.g. Amaka Obi"
              maxLength={80}
              autoComplete="name"
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="comment-phone" className={labelClass}>
                Phone number
              </label>
              <input
                id="comment-phone"
                value={identity.phone}
                onChange={(event) => {
                  setIdentity((v) => ({ ...v, phone: event.target.value }));
                  setFieldErrors((f) => ({ ...f, phone: '' }));
                }}
                placeholder="+234 800 000 0000"
                maxLength={40}
                inputMode="tel"
                autoComplete="tel"
                aria-invalid={Boolean(fieldErrors.phone)}
                aria-describedby={fieldErrors.phone ? 'comment-phone-error' : undefined}
                className={inputClass}
              />
              {fieldErrors.phone && (
                <p id="comment-phone-error" className="mt-1 text-xs text-rose-600">
                  {fieldErrors.phone}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="comment-email" className={labelClass}>
                Email address
              </label>
              <input
                id="comment-email"
                value={identity.email}
                onChange={(event) => {
                  setIdentity((v) => ({ ...v, email: event.target.value }));
                  setFieldErrors((f) => ({ ...f, email: '' }));
                }}
                placeholder="you@example.com"
                maxLength={254}
                inputMode="email"
                autoComplete="email"
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'comment-email-error' : undefined}
                className={inputClass}
              />
              {fieldErrors.email && (
                <p id="comment-email-error" className="mt-1 text-xs text-rose-600">
                  {fieldErrors.email}
                </p>
              )}
            </div>
          </div>

          <p className="text-xs leading-relaxed text-navy-400">
            Your phone number and email are never shown publicly.
          </p>

          {submitError && (
            <p role="alert" className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
              {submitError}
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={dismissDialog}
            disabled={submitting}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-navy-500 transition-colors hover:bg-navy-50 hover:text-navy-900 disabled:opacity-60"
          >
            Post anonymously
          </button>
          <button
            type="button"
            onClick={submitWithDetails}
            disabled={submitting}
            className="btn-gradient !px-5 !py-2.5 disabled:cursor-not-allowed disabled:opacity-60"
            data-testid="post-comment-dialog-submit"
          >
            {submitting ? (
              <>
                <IconLoader2 size={15} className="animate-spin" />
                Posting…
              </>
            ) : (
              <>
                <IconSend size={15} />
                Post comment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
