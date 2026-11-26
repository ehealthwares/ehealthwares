'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { PostComment } from '@/lib/types';

export interface CommentIdentity {
  name: string;
  phone: string;
  email: string;
}

export const EMPTY_IDENTITY: CommentIdentity = { name: '', phone: '', email: '' };

interface PostCommentsValue {
  postSlug: string;
  comments: PostComment[];
  total: number;
  loading: boolean;
  loadError: string | null;
  reload: () => Promise<void>;

  text: string;
  setText: (value: string) => void;
  identity: CommentIdentity;
  setIdentity: React.Dispatch<React.SetStateAction<CommentIdentity>>;
  fieldErrors: Record<string, string>;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  submitting: boolean;
  submitError: string | null;
  setSubmitError: (value: string | null) => void;
  posted: boolean;

  /** Validate the draft and open the details dialog. False when the draft is empty. */
  requestPost: () => boolean;
  dialogOpen: boolean;
  submitWithDetails: () => void;
  /** Close the dialog and post the comment as Anonymous. */
  dismissDialog: () => void;

  /** Attach to the inline comments section; drives `threadInView`. */
  threadRef: (node: HTMLElement | null) => void;
  threadInView: boolean;
}

const PostCommentsContext = createContext<PostCommentsValue | null>(null);

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

export function PostCommentsProvider({
  postSlug,
  children,
}: {
  postSlug: string;
  children: React.ReactNode;
}) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [text, setText] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [identity, setIdentity] = useState<CommentIdentity>(EMPTY_IDENTITY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [posted, setPosted] = useState(false);

  const [threadEl, setThreadEl] = useState<HTMLElement | null>(null);
  const [threadInView, setThreadInView] = useState(false);

  const submittingRef = useRef(false);
  const threadRef = useCallback((node: HTMLElement | null) => setThreadEl(node), []);

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

  /**
   * The sidebar composer hides once the inline thread is on screen, so only
   * one composer is ever visible.
   */
  useEffect(() => {
    if (!threadEl) return;
    const observer = new IntersectionObserver(
      ([entry]) => setThreadInView(entry.isIntersecting),
      { threshold: 0.05, rootMargin: '-80px 0px 0px 0px' },
    );
    observer.observe(threadEl);
    return () => observer.disconnect();
  }, [threadEl]);

  const postComment = useCallback(
    async (details: CommentIdentity | null) => {
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

  const requestPost = useCallback(() => {
    setSubmitError(null);
    if (!text.trim()) {
      setSubmitError('Write a comment before posting.');
      return false;
    }
    setPosted(false);
    setDialogOpen(true);
    return true;
  }, [text]);

  const submitWithDetails = useCallback(() => {
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
  }, [identity, postComment]);

  const dismissDialog = useCallback(() => {
    if (submittingRef.current) return;
    setDialogOpen(false);
    setFieldErrors({});
    void postComment(null);
  }, [postComment]);

  const updateText = useCallback((value: string) => {
    setText(value);
    setPosted(false);
    setSubmitError(null);
  }, []);

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
  }, [dialogOpen, dismissDialog]);

  const value: PostCommentsValue = {
    postSlug,
    comments,
    total: comments.length,
    loading,
    loadError,
    reload: load,
    text,
    setText: updateText,
    identity,
    setIdentity,
    fieldErrors,
    setFieldErrors,
    submitting,
    submitError,
    setSubmitError,
    posted,
    requestPost,
    dialogOpen,
    submitWithDetails,
    dismissDialog,
    threadRef,
    threadInView,
  };

  return (
    <PostCommentsContext.Provider value={value}>{children}</PostCommentsContext.Provider>
  );
}

export function usePostComments(): PostCommentsValue {
  const value = useContext(PostCommentsContext);
  if (!value) {
    throw new Error('usePostComments must be used inside <PostCommentsProvider>');
  }
  return value;
}
