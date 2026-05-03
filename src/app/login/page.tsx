import { redirect } from 'next/navigation';
import { signIn } from '@/auth/config';
import { getOrganizerSession } from '@/auth/session';
import { LoginForm, type LoginActionResult } from './login-form';

export const metadata = { title: 'Sign in' };

function safeCallbackUrl(raw: string | undefined): string {
  if (!raw) return '/app';
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return '/app';
  return raw;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const session = await getOrganizerSession();
  if (session) redirect(safeCallbackUrl(params.callbackUrl));

  async function handle(formData: FormData): Promise<LoginActionResult> {
    'use server';
    const email = String(formData.get('email') ?? '').trim();
    if (!email) return { ok: false };
    try {
      await signIn('nodemailer', { email, redirect: false });
      return { ok: true, email };
    } catch {
      return { ok: false };
    }
  }

  return (
    <main className="container-tight flex min-h-[100svh] flex-col justify-center gap-8 py-16">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Sign in to OpenSignup</h1>
        <p className="text-ink-muted">
          Enter your email and we&apos;ll send you a magic link to sign in. No passwords.
        </p>
      </div>
      {params.error ? (
        <p className="text-danger text-sm" role="alert">
          Something went wrong. Try again.
        </p>
      ) : null}
      <LoginForm action={handle} />
    </main>
  );
}
