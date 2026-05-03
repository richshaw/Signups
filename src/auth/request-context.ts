import { AsyncLocalStorage } from 'node:async_hooks';
import { isIP } from 'node:net';

interface RequestContext {
  ip: string | null;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function runWithRequestContext<T>(ctx: RequestContext, fn: () => T): T {
  return storage.run(ctx, fn);
}

export function getRequestIp(): string | null {
  return storage.getStore()?.ip ?? null;
}

export function extractClientIp(headers: Headers): string | null {
  const raw =
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip')?.trim() ||
    null;
  return raw && isIP(raw) ? raw : null;
}
