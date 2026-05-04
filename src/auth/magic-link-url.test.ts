import { describe, expect, it } from 'vitest';
import { canonicalizeMagicLinkUrl } from './magic-link-url';

describe('canonicalizeMagicLinkUrl', () => {
  it('rewrites a fly.dev origin to the AUTH_URL origin', () => {
    const raw =
      'https://signups.fly.dev/api/auth/callback/nodemailer?token=abc&email=user%40example.com';
    const result = canonicalizeMagicLinkUrl(raw, 'https://opensignup.org');
    expect(result).toBe(
      'https://opensignup.org/api/auth/callback/nodemailer?token=abc&email=user%40example.com',
    );
  });

  it('preserves path, query, and hash', () => {
    const raw = 'http://internal-host/api/auth/callback/nodemailer?token=t&callbackUrl=%2Fapp#frag';
    const result = canonicalizeMagicLinkUrl(raw, 'https://opensignup.org');
    expect(result).toBe(
      'https://opensignup.org/api/auth/callback/nodemailer?token=t&callbackUrl=%2Fapp#frag',
    );
  });

  it('keeps a non-default port from AUTH_URL', () => {
    const raw = 'http://0.0.0.0:3000/api/auth/callback/nodemailer?token=t';
    const result = canonicalizeMagicLinkUrl(raw, 'http://localhost:3000');
    expect(result).toBe('http://localhost:3000/api/auth/callback/nodemailer?token=t');
  });

  it('switches protocol when AUTH_URL is https and request was http', () => {
    const raw = 'http://signups.fly.dev/api/auth/callback/nodemailer?token=t';
    const result = canonicalizeMagicLinkUrl(raw, 'https://opensignup.org');
    expect(result.startsWith('https://opensignup.org/')).toBe(true);
  });
});
