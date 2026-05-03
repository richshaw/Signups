import { describe, expect, it } from 'vitest';
import { extractClientIp, getRequestIp, runWithRequestContext } from './request-context';

function headers(init: Record<string, string>): Headers {
  return new Headers(init);
}

describe('extractClientIp', () => {
  it('returns the first hop of x-forwarded-for', () => {
    expect(extractClientIp(headers({ 'x-forwarded-for': '203.0.113.5, 10.0.0.1' }))).toBe(
      '203.0.113.5',
    );
  });

  it('falls back to x-real-ip', () => {
    expect(extractClientIp(headers({ 'x-real-ip': '198.51.100.7' }))).toBe('198.51.100.7');
  });

  it('returns null for missing headers', () => {
    expect(extractClientIp(headers({}))).toBeNull();
  });

  it('returns null for invalid IP strings', () => {
    expect(extractClientIp(headers({ 'x-forwarded-for': 'not-an-ip' }))).toBeNull();
    expect(extractClientIp(headers({ 'x-real-ip': '999.999.999.999' }))).toBeNull();
  });

  it('accepts IPv6', () => {
    expect(extractClientIp(headers({ 'x-forwarded-for': '2001:db8::1' }))).toBe('2001:db8::1');
  });
});

describe('runWithRequestContext / getRequestIp', () => {
  it('returns null when called outside any context', () => {
    expect(getRequestIp()).toBeNull();
  });

  it('exposes the ip set in the surrounding context', () => {
    const result = runWithRequestContext({ ip: '203.0.113.5' }, () => getRequestIp());
    expect(result).toBe('203.0.113.5');
  });

  it('exposes ip across an awaited boundary', async () => {
    const result = await runWithRequestContext({ ip: '198.51.100.7' }, async () => {
      await Promise.resolve();
      return getRequestIp();
    });
    expect(result).toBe('198.51.100.7');
  });

  it('isolates contexts across concurrent calls', async () => {
    const [a, b] = await Promise.all([
      runWithRequestContext({ ip: '10.0.0.1' }, async () => {
        await new Promise((r) => setTimeout(r, 5));
        return getRequestIp();
      }),
      runWithRequestContext({ ip: '10.0.0.2' }, async () => getRequestIp()),
    ]);
    expect(a).toBe('10.0.0.1');
    expect(b).toBe('10.0.0.2');
  });
});
