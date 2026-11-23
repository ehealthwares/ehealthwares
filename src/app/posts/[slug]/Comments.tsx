'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  IconCircleCheck,
  IconLoader2,
  IconMessageCircle,
  IconSend,
  IconX,
} from '@tabler/icons-react';
import type { PostComment } from '@/lib/types';

interface CommentsProps {
  postSlug: string;
}

interface Identity {
  name: string;
  phone: string;
  email: string;
}

const EMPTY_IDENTITY: Identity = { name: '', phone: '', email: '' };

const inputClass =
  'w-full rounded-xl border border-navy-200 bg-white px-3.5 py-2.5 text-sm text-navy-800 placeholder:text-navy-300 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';
const labelClass = 'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-navy-500';

function formatCommentDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'A';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function readError(data: unknown, fallback: string): string {
  if (data && typeof data === 'object') {
    const payload = data as {
      message?: unknown;
      error?: { message?: unknown } | string;
    };
    const nested =
      payload.error && typeof payload.error === 'object' ? payload.error.message : undefined;
    const message = payload.message ?? nested;
    if (Array.isArray(message) && message.length) return String(message[0]);
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

export function Comments({ postSlug }: CommentsProps) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [text, setText] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [identity, setIdentity] = useState<Identity>(EMPTY_IDENTITY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [posted, setPosted] = useState(false);

  const submittingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/ehealthwares/posts/${encodeURIComponent(postSlug)}/comments`,
        { cache: 'no-store' },
      );
      if (!res.ok) throw new Error('load failed');
      const data = await res.json();
      setComments(Array.isArray(data) ? (data as PostComment[]) : []);
      setLoadError(null);
    } catch {
      setLoadError('We could not load the comments. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, [postSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (dialogOpen) nameInputRef.current?.focus();
  }, [dialogOpen]);

  const postComment = useCallback(
    async (details: Identity | null) => {
      if (submittingRef.current) return;
      const body = text.trim();
      if (!body) return;

      submittingRef.current = true;
      setSubmitting(true);
      setSubmitError(null);

      const payload: Record<string, string> = { body };
      if (details) {
        if (details.name.trim()) payload.name = details.name.trim();
        if (details.phone.trim()) payload.phone = details.phone.trim();
        if (details.email.trim()) payload.email = details.email.trim();
      }

      try {
        const res = await fetch(
          `/api/ehealthwares/posts/${encodeURIComponent(postSlug)}/comments`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          },
        );
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(readError(data, 'We could not post your comment.'));
        }

        if (data && typeof data === 'object' && '_id' in data) {
          const created = data as PostComment;
          setComments((prev) => [created, ...prev.filter((c) => c._id !== created._id)]);
        } else {
          await load();
        }

        setText('');
        setIdentity(EMPTY_IDENTITY);
        setFieldErrors({});
        setDialogOpen(false);
        setPosted(true);
        textareaRef.current?.blur();
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : 'We could not post your comment.',
        );
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [load, postSlug, text],
  );

  const openDialog = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);
    if (!text.trim()) {
      setSubmitError('Write a comment before posting.');
      textareaRef.current?.focus();
      return;
    }
    setPosted(false);
    setDialogOpen(true);
  };

  const submitWithDetails = () => {
    const errors: Record<string, string> = {};
    const email = identity.email.trim();
    const phone = identity.phone.trim();
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = 'Enter a valid email address';
    }
    if (phone && phone.replace(/\D/g, '').length < 7) {
      errors.phone = 'Enter a valid phone number';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    void postComment(identity);
  };

  /** Dismissing the dialog still posts the comment — as Anonymous. */
  const dismissDialog = () => {
    if (submittingRef.current) return;
    setDialogOpen(false);
    setFieldErrors({});
    void postComment(null);
  };

  useEffect(() => {
    if (!dialogOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        dismissDialog();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <section
      id="comments"
      aria-labelledby="comments-title"
      className="mt-14 border-t border-navy-100 pt-10"
      data-testid="post-comments"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <IconMessageCircle size={18} />
        </span>
        <h2 id="comments-title" className="font-display text-xl font-extrabold tracking-[-0.01em] text-navy-900">
          Comments
          {!loading && (
            <span className="ml-2 text-sm font-semibold text-navy-400">
              {comments.length}
            </span>
          )}
        </h2>
      </div>

      {/* Composer */}
      <form onSubmit={openDialog} className="mt-5" data-testid="post-comment-form">
        <label htmlFor="comment-body" className="sr-only">
          Your comment
        </label>
        <textarea
          id="comment-body"
          ref={textareaRef}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setPosted(false);
            if (submitError) setSubmitError(null);
          }}
          rows={4}
          maxLength={2000}
          placeholder="Share your perspective on this post…"
          className={`${inputClass} resize-y leading-relaxed`}
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs leading-relaxed text-navy-400">
            Next you can add your name and contact details — or skip them and post as{' '}
            <span className="font-semibold text-navy-600">Anonymous</span>.
          </p>
          <div className="flex items-center gap-3">
            {text.length > 1800 && (
              <span className="text-xs text-navy-400">{text.length}/2000</span>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="btn-gradient !px-5 !py-2.5 disabled:cursor-not-allowed disabled:opacity-60"
              data-testid="post-comment-submit"
            >
              <IconSend size={15} />
              Post comment
            </button>
          </div>
        </div>
        {submitError && (
          <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
            {submitError}
          </p>
        )}
        {posted && (
          <p
            role="status"
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700"
          >
            <IconCircleCheck size={16} />
            Your comment has been posted.
          </p>
        )}
      </form>

      {/* List */}
      <div className="mt-8 space-y-4" data-testid="post-comment-list">
        {loading && (
          <>
            {[0, 1].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-navy-100 bg-white/70 p-5">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-navy-100" />
                  <div className="h-3 w-32 rounded bg-navy-100" />
                </div>
                <div className="mt-4 h-3 w-full rounded bg-navy-50" />
                <div className="mt-2 h-3 w-2/3 rounded bg-navy-50" />
              </div>
            ))}
          </>
        )}

        {!loading && loadError && (
          <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-5 text-sm text-rose-700">
            {loadError}{' '}
            <button type="button" onClick={() => void load()} className="font-semibold underline">
              Try again
            </button>
          </div>
        )}

        {!loading && !loadError && comments.length === 0 && (
          <p className="rounded-2xl border border-dashed border-navy-200 bg-white/60 p-6 text-center text-sm text-navy-400">
            No comments yet. Start the conversation.
          </p>
        )}

        {!loading &&
          comments.map((comment) => (
            <article
              key={comment._id}
              className="rounded-2xl border border-navy-100 bg-white/75 p-5 shadow-sm"
              data-testid="post-comment"
            >
              <header className="flex items-start gap-3">
                <span
                  className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-xs font-bold text-white ${
                    comment.isAnonymous ? 'bg-navy-300' : ''
                  }`}
                  style={
                    comment.isAnonymous
                      ? undefined
                      : { backgroundImage: 'linear-gradient(135deg, #2563EB, #7C3AED)' }
                  }
                  aria-hidden="true"
                >
                  {initials(comment.isAnonymous ? 'Anonymous' : comment.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-navy-900">
                      {comment.isAnonymous ? 'Anonymous' : comment.name}
                    </span>
                    {comment.isAnonymous && (
                      <span className="rounded-full bg-navy-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-navy-400">
                        No details shared
                      </span>
                    )}
                  </div>
                  <time
                    dateTime={comment.commentedAt}
                    className="text-xs font-medium text-navy-400"
                  >
                    {formatCommentDate(comment.commentedAt)}
                  </time>
                </div>
              </header>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-navy-600">
                {comment.body}
              </p>
            </article>
          ))}
      </div>

      {/* Identity dialog */}
      {dialogOpen && (
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
              All fields are optional. If you close this window, your comment will still be
              posted as <span className="font-semibold text-navy-700">Anonymous</span>.
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
      )}
    </section>
  );
}
