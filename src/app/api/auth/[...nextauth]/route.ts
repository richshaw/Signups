import type { NextRequest } from 'next/server';
import { handlers } from '@/auth/config';
import { extractClientIp, runWithRequestContext } from '@/auth/request-context';

export function GET(req: NextRequest) {
  return runWithRequestContext({ ip: extractClientIp(req.headers) }, () => handlers.GET(req));
}

export function POST(req: NextRequest) {
  return runWithRequestContext({ ip: extractClientIp(req.headers) }, () => handlers.POST(req));
}
