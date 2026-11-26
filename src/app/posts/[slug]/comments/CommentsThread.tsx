'use client';

import { IconMessageCircle } from '@tabler/icons-react';
import type { PostComment } from '@/lib/types';
import { Composer } from './Composer';
import { usePostComments } from './context';

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

function CommentItem({ comment }: { comment: PostComment }) {
  return (
    <article
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
          <time dateTime={comment.commentedAt} className="text-xs font-medium text-navy-400">
            {formatCommentDate(comment.commentedAt)}
          </time>
        </div>
      </header>
      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-navy-600">
        {comment.body}
      </p>
    </article>
  );
}

/**
 * The canonical comments section: composer plus the full thread. The sidebar
 * composer observes this element and hides once it scrolls into view.
 */
export function CommentsThread() {
  const { comments, total, loading, loadError, reload, threadRef } = usePostComments();

  return (
    <section
      id="comments"
      ref={threadRef}
      aria-labelledby="comments-title"
      className="mt-14 scroll-mt-28 border-t border-navy-100 pt-10"
      data-testid="post-comments"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <IconMessageCircle size={18} />
        </span>
        <h2
          id="comments-title"
          className="font-display text-xl font-extrabold tracking-[-0.01em] text-navy-900"
        >
          Comments
          {!loading && (
            <span className="ml-2 text-sm font-semibold text-navy-400">{total}</span>
          )}
        </h2>
      </div>

      <div className="mt-5">
        <Composer variant="inline" />
      </div>

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
            <button type="button" onClick={() => void reload()} className="font-semibold underline">
              Try again
            </button>
          </div>
        )}

        {!loading && !loadError && comments.length === 0 && (
          <p className="rounded-2xl border border-dashed border-navy-200 bg-white/60 p-6 text-center text-sm text-navy-400">
            No comments yet. Start the conversation.
          </p>
        )}

        {!loading && comments.map((comment) => <CommentItem key={comment._id} comment={comment} />)}
      </div>
    </section>
  );
}
