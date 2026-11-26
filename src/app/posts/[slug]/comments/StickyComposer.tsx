'use client';

import { IconArrowDown } from '@tabler/icons-react';
import { Composer } from './Composer';
import { usePostComments } from './context';

/**
 * Sticky long-form-page composer. It rides down the sidebar while reading and
 * unmounts once the inline comments section is visible, so there is never more
 * than one comment box on screen.
 */
export function StickyComposer() {
  const { total, loading, threadInView } = usePostComments();

  if (threadInView) return null;

  return (
    <div
      className="rounded-2xl border border-navy-100 bg-white/80 p-5 shadow-sm backdrop-blur"
      data-testid="sticky-comment-composer"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-navy-400">
          Join the conversation
        </span>
        {!loading && (
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
            {total} {total === 1 ? 'comment' : 'comments'}
          </span>
        )}
      </div>

      <div className="mt-4">
        <Composer variant="sidebar" />
      </div>

      <a
        href="#comments"
        className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-blue-600 transition-colors hover:text-blue-700"
      >
        See all comments
        <IconArrowDown size={13} />
      </a>
    </div>
  );
}
