import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { signups } from '@/db/schema/signups';
import { requireActor } from '@/auth/session';
import { fail, handle, respond } from '@/lib/api-response';
import { serviceError } from '@/lib/errors';
import { link } from '@/lib/links';
import { requireWorkspaceAccess } from '@/lib/policy';
import { addSlot, listSlotsForSignup } from '@/services/slots';

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const { id } = await ctx.params;
    const actor = await requireActor();
    if (actor.kind !== 'organizer') return fail(serviceError('unauthorized', 'sign in required'));
    const db = getDb();
    const found = await db.select().from(signups).where(eq(signups.id, id)).limit(1);
    const row = found[0];
    if (!row) return fail(serviceError('not_found', 'signup not found'));
    requireWorkspaceAccess(actor, row.workspaceId);
    const rows = await listSlotsForSignup(db, id);
    return respond({ ok: true, value: rows });
  });
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const { id } = await ctx.params;
    const actor = await requireActor();
    if (actor.kind !== 'organizer') return fail(serviceError('unauthorized', 'sign in required'));
    const body = await req.json().catch(() => ({}));
    const result = await addSlot(getDb(), actor, id, body);
    if (!result.ok) return fail(result.error);
    return respond(result, {
      self: link(`/api/slots/${result.value.id}`),
      update: link(`/api/slots/${result.value.id}`, 'PATCH'),
      delete: link(`/api/slots/${result.value.id}`, 'DELETE'),
      commit: link(`/api/slots/${result.value.id}/commitments`, 'POST'),
    });
  });
}
