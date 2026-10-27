'use client';

import { useState } from 'react';
import Link from 'next/link';
import { IconArrowRight, IconCircleCheck } from '@tabler/icons-react';

const inputClass =
  'w-full rounded-xl border border-navy-200 bg-white/80 px-4 py-3 text-sm text-navy-800 placeholder:text-navy-300 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';

const fileClass =
  'w-full cursor-pointer rounded-xl border border-navy-200 bg-white/80 text-sm text-navy-500 outline-none transition-all file:mr-3 file:border-0 file:bg-blue-50 file:px-3 file:py-2.5 file:text-xs file:font-bold file:uppercase file:tracking-wider file:text-blue-600 hover:file:bg-blue-100';

const labelClass = 'mb-1.5 block text-xs font-bold uppercase tracking-wider text-navy-500';

const ACCEPTED_EXTENSIONS = ['pdf', 'doc', 'docx'];
const MAX_FILE_BYTES = 5 * 1024 * 1024;

function validateFile(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ACCEPTED_EXTENSIONS.includes(ext)) return 'Accepted formats: PDF, DOC or DOCX';
  if (file.size > MAX_FILE_BYTES) return 'File must be 5 MB or smaller';
  return null;
}

interface ApplicationFormProps {
  slug: string;
  title: string;
}

export function ApplicationForm({ slug, title }: ApplicationFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState({
    name: '',
    email: '',
    phone: '',
    portfolio: '',
    coverLetter: '',
  });
  const [cv, setCv] = useState<File | null>(null);
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const set =
    (key: keyof typeof values) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((v) => ({ ...v, [key]: e.target.value }));
      setFieldErrors((f) => ({ ...f, [key]: '' }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!values.name.trim()) errors.name = 'Name is required';
    if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = 'A valid email is required';
    if (values.portfolio.trim()) {
      try {
        new URL(values.portfolio.trim());
      } catch {
        errors.portfolio = 'Enter a valid URL (https://…)';
      }
    }
    if (!cv) {
      errors.cv = 'A CV / resume is required';
    } else {
      const cvError = validateFile(cv);
      if (cvError) errors.cv = cvError;
    }
    if (coverLetterFile) {
      const clError = validateFile(coverLetterFile);
      if (clError) errors.coverLetterFile = clError;
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    const formData = new FormData();
    formData.append('slug', slug);
    formData.append('title', title);
    formData.append('name', values.name.trim());
    formData.append('email', values.email.trim());
    if (values.phone.trim()) formData.append('phone', values.phone.trim());
    if (values.portfolio.trim()) formData.append('portfolio', values.portfolio.trim());
    if (values.coverLetter.trim()) formData.append('coverLetter', values.coverLetter.trim());
    if (cv) formData.append('cv', cv);
    if (coverLetterFile) formData.append('coverLetterFile', coverLetterFile);

    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch('/api/ehealthwares/apply', { method: 'POST', body: formData });
      if (!res.ok) {
        let message = 'Failed to submit application. Please try again.';
        try {
          const data = await res.json();
          if (data && typeof data.error === 'string') message = data.error;
        } catch {
          /* keep default message */
        }
        throw new Error(message);
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="py-10 text-center">
        <span
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl text-white shadow-lg"
          style={{ backgroundImage: 'linear-gradient(135deg, #2563EB, #16A34A)' }}
        >
          <IconCircleCheck size={30} />
        </span>
        <h3 className="mt-6 font-display text-2xl font-extrabold text-navy-900">
          Application received
        </h3>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-navy-500">
          We review applications as they arrive and typically respond within one week.
        </p>
        <Link
          href="/careers"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 transition-colors hover:text-blue-700"
        >
          Back to all positions
          <IconArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="af-name" className={labelClass}>
          Full name
        </label>
        <input
          id="af-name"
          className={inputClass}
          placeholder="Your full name"
          value={values.name}
          onChange={set('name')}
        />
        {fieldErrors.name && <p className="mt-1 text-xs text-coral-600">{fieldErrors.name}</p>}
      </div>

      <div>
        <label htmlFor="af-email" className={labelClass}>
          Email
        </label>
        <input
          id="af-email"
          type="email"
          className={inputClass}
          placeholder="you@organization.com"
          value={values.email}
          onChange={set('email')}
        />
        {fieldErrors.email && <p className="mt-1 text-xs text-coral-600">{fieldErrors.email}</p>}
      </div>

      <div>
        <label htmlFor="af-phone" className={labelClass}>
          Phone <span className="font-normal normal-case tracking-normal text-navy-300">(optional)</span>
        </label>
        <input
          id="af-phone"
          type="tel"
          className={inputClass}
          placeholder="+234-800-000-000"
          value={values.phone}
          onChange={set('phone')}
        />
      </div>

      <div>
        <label htmlFor="af-portfolio" className={labelClass}>
          Portfolio / LinkedIn URL{' '}
          <span className="font-normal normal-case tracking-normal text-navy-300">(optional)</span>
        </label>
        <input
          id="af-portfolio"
          type="url"
          className={inputClass}
          placeholder="https://linkedin.com/in/…"
          value={values.portfolio}
          onChange={set('portfolio')}
        />
        {fieldErrors.portfolio && (
          <p className="mt-1 text-xs text-coral-600">{fieldErrors.portfolio}</p>
        )}
      </div>

      <div>
        <label htmlFor="af-cover-letter" className={labelClass}>
          Cover letter{' '}
          <span className="font-normal normal-case tracking-normal text-navy-300">(optional)</span>
        </label>
        <textarea
          id="af-cover-letter"
          rows={5}
          className={inputClass}
          placeholder="Tell us why you are a great fit…"
          value={values.coverLetter}
          onChange={set('coverLetter')}
        />
        <p className="mt-1 text-xs text-navy-400">
          Paste your cover letter, or attach a file below
        </p>
      </div>

      <div>
        <label htmlFor="af-cover-letter-file" className={labelClass}>
          Cover letter attachment{' '}
          <span className="font-normal normal-case tracking-normal text-navy-300">(optional)</span>
        </label>
        <input
          id="af-cover-letter-file"
          type="file"
          accept=".pdf,.doc,.docx"
          className={fileClass}
          onChange={(e) => {
            setCoverLetterFile(e.target.files?.[0] ?? null);
            setFieldErrors((f) => ({ ...f, coverLetterFile: '' }));
          }}
        />
        {fieldErrors.coverLetterFile && (
          <p className="mt-1 text-xs text-coral-600">{fieldErrors.coverLetterFile}</p>
        )}
      </div>

      <div>
        <label htmlFor="af-cv" className={labelClass}>
          CV / Resume
        </label>
        <input
          id="af-cv"
          type="file"
          accept=".pdf,.doc,.docx"
          className={fileClass}
          onChange={(e) => {
            setCv(e.target.files?.[0] ?? null);
            setFieldErrors((f) => ({ ...f, cv: '' }));
          }}
        />
        <p className="mt-1 text-xs text-navy-400">PDF, DOC or DOCX — up to 5 MB</p>
        {fieldErrors.cv && <p className="mt-1 text-xs text-coral-600">{fieldErrors.cv}</p>}
      </div>

      {error && <p className="text-sm text-coral-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="btn-gradient w-full !py-3 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          'Submitting…'
        ) : (
          <>
            Submit Application
            <IconArrowRight size={17} />
          </>
        )}
      </button>
    </form>
  );
}
