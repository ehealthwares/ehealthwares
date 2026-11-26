'use client';

import { useRef } from 'react';
import { IconCircleCheck, IconSend } from '@tabler/icons-react';
import { usePostComments } from './context';

const inputClass =
  'w-full rounded-xl border border-navy-200 bg-white px-3.5 py-2.5 text-sm text-navy-800 placeholder:text-navy-300 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';

interface ComposerProps {
  variant?: 'inline' | 'sidebar';
}

/**
 * The comment box, used both inline above the thread and in the sticky
 * sidebar. Draft text and posting state live in the provider, so the two
 * variants are interchangeable and the name/phone/email dialog is shared.
 */
export function Composer({ variant = 'inline' }: ComposerProps) {
  const { text, setText, requestPost, submitting, submitError, posted } = usePostComments();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sidebar = variant === 'sidebar';
  const id = `${variant}-comment-body`;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!requestPost()) textareaRef.current?.focus();
  };

  return (
    <form
      onSubmit={handleSubmit}
      data-testid={sidebar ? 'sidebar-comment-form' : 'post-comment-form'}
    >
      <label htmlFor={id} className="sr-only">
        Your comment
      </label>
      <textarea
        id={id}
        ref={textareaRef}
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={sidebar ? 3 : 4}
        maxLength={2000}
        placeholder={
          sidebar ? 'Share your perspective…' : 'Share your perspective on this post…'
        }
        className={`${inputClass} resize-y leading-relaxed`}
      />

      {sidebar ? (
        <>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[11px] leading-relaxed text-navy-400">
              Details are optional
            </span>
            {text.length > 1800 && (
              <span className="text-xs text-navy-400">{text.length}/2000</span>
            )}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="btn-gradient mt-2 w-full !px-4 !py-2.5 disabled:cursor-not-allowed disabled:opacity-60"
            data-testid="sidebar-comment-submit"
          >
            <IconSend size={15} />
            Post comment
          </button>
        </>
      ) : (
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
      )}

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
  );
}
