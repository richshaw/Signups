'use client';

import { useRef, useState, useTransition } from 'react';
import { Spinner } from '@/components/ui/spinner';

export type LoginErrorReason = 'invalid_email' | 'send_failed';
export type LoginActionResult =
  | { ok: true; email: string }
  | { ok: false; reason: LoginErrorReason };

type Props = {
  action: (formData: FormData) => Promise<LoginActionResult>;
};

type View = 'idle' | 'success' | 'error';

const MIN_LOADING_MS = 500;

export function LoginForm({ action }: Props) {
  const [view, setView] = useState<View>('idle');
  const [pending, startTransition] = useTransition();
  const [confirmedEmail, setConfirmedEmail] = useState('');
  const [errorReason, setErrorReason] = useState<LoginErrorReason>('send_failed');
  const inputRef = useRef<HTMLInputElement>(null);

  const state: 'idle' | 'loading' | 'success' | 'error' = pending ? 'loading' : view;
  const inert = state === 'loading' || state === 'success';

  const handleSubmit = (formData: FormData) => {
    if (inert) return;
    startTransition(async () => {
      const start = Date.now();
      let result: LoginActionResult;
      try {
        result = await action(formData);
      } catch {
        result = { ok: false, reason: 'send_failed' };
      }
      const elapsed = Date.now() - start;
      if (elapsed < MIN_LOADING_MS) {
        await new Promise((r) => setTimeout(r, MIN_LOADING_MS - elapsed));
      }
      if (result.ok) {
        setConfirmedEmail(result.email);
        setView('success');
      } else {
        setErrorReason(result.reason);
        setView('error');
      }
    });
  };

  const reset = () => {
    setView('idle');
    setTimeout(() => inputRef.current?.focus(), 60);
  };

  const buttonBg =
    state === 'success' ? 'bg-success' : state === 'error' ? 'bg-danger' : 'bg-brand';
  const buttonHover = state === 'idle' ? 'hover:brightness-110' : '';
  const buttonLoading = state === 'loading' ? 'brightness-90' : '';

  return (
    <form action={handleSubmit} className="space-y-4" noValidate>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Email</span>
        <input
          ref={inputRef}
          type="email"
          name="email"
          required
          autoComplete="email"
          inputMode="email"
          disabled={inert}
          className="focus:border-brand focus:ring-brand w-full rounded-lg border border-surface-sunk bg-white px-4 py-3 text-base shadow-sm transition focus:outline-none focus:ring-1 disabled:bg-white disabled:opacity-100"
          placeholder="you@example.com"
        />
      </label>
      <button
        type="submit"
        aria-disabled={inert}
        aria-busy={state === 'loading'}
        data-state={state}
        className={`relative w-full rounded-lg px-5 py-3 font-medium text-white transition-colors duration-180 ease-emphasized ${buttonBg} ${buttonHover} ${buttonLoading}`}
      >
        <ButtonLabel state={state} />
      </button>
      <HelperText state={state} email={confirmedEmail} errorReason={errorReason} onReset={reset} />
    </form>
  );
}

function ButtonLabel({ state }: { state: 'idle' | 'loading' | 'success' | 'error' }) {
  if (state === 'loading') {
    return (
      <span className="inline-flex items-center justify-center gap-2">
        <Spinner />
        <span>Sending…</span>
      </span>
    );
  }
  if (state === 'success') {
    return (
      <span className="inline-flex items-center justify-center gap-2">
        <CheckIcon />
        <span>Sent — check your email</span>
      </span>
    );
  }
  return <span>Send magic link</span>;
}

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M5 12.5l4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="24"
        strokeDashoffset="24"
        className="animate-check-draw"
      />
    </svg>
  );
}

type HelperProps = {
  state: 'idle' | 'loading' | 'success' | 'error';
  email: string;
  errorReason: LoginErrorReason;
  onReset: () => void;
};

function HelperText({ state, email, errorReason, onReset }: HelperProps) {
  return (
    <p
      role={state === 'error' ? 'alert' : undefined}
      aria-live={state === 'error' ? undefined : 'polite'}
      className={`text-ink-soft min-h-[1.2em] text-xs ${state === 'error' ? 'text-danger' : ''}`}
    >
      {state === 'success' && (
        <>
          Link sent to <strong className="text-ink font-medium">{email}</strong>. Check your inbox.{' '}
          <button
            type="button"
            onClick={onReset}
            className="text-brand underline-offset-2 hover:underline"
          >
            Send again
          </button>
        </>
      )}
      {state === 'error' && (
        <>
          {errorReason === 'invalid_email'
            ? 'That doesn’t look like a valid email address.'
            : 'Couldn’t send. Please try again.'}{' '}
          <button
            type="button"
            onClick={onReset}
            className="underline-offset-2 hover:underline"
          >
            Try again
          </button>
        </>
      )}
    </p>
  );
}
