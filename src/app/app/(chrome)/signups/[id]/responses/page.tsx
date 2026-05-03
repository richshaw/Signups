import { redirect } from 'next/navigation';
import { after } from 'next/server';
import { getDb } from '@/db/client';
import { getOrganizerSession, toActor } from '@/auth/session';
import { loadSignupForOrganizer } from '@/services/signups.cached';
import { listCommitmentsForSignup } from '@/services/commitments';
import type { SlotFieldDefinition } from '@/schemas/slot-fields';
import { recordOrganizerView } from '@/lib/view-tracker';

type PageParams = { params: Promise<{ id: string }> };

function summarizeValues(
  fields: SlotFieldDefinition[],
  values: Record<string, unknown>,
): string {
  const parts: string[] = [];
  for (const f of fields) {
    const v = values[f.ref];
    if (v === undefined || v === null || v === '') continue;
    parts.push(`${f.label}: ${String(v)}`);
  }
  return parts.join(' · ');
}

export default async function ResponsesTab({ params }: PageParams) {
  const { id } = await params;
  const session = await getOrganizerSession();
  if (!session) redirect(`/login?callbackUrl=/app/signups/${id}/responses`);
  const result = await loadSignupForOrganizer(toActor(session), id);
  if (!result.ok) return null;
  const sig = result.value;
  after(() =>
    recordOrganizerView({
      actor: { actorId: session.organizerId, actorType: 'organizer' },
      signupId: sig.id,
      workspaceId: sig.workspaceId,
      eventType: 'signup.editor_opened',
      payload: { section: 'responses' },
    }),
  );
  const commitments = await listCommitmentsForSignup(getDb(), id);

  return (
    <section className="space-y-4">
      <p className="text-ink-muted text-sm">
        Everyone who&rsquo;s signed up so far. Export to CSV from the header.
      </p>
      {commitments.length === 0 ? (
        <p className="text-ink-muted rounded-lg border border-dashed border-surface-sunk p-6 text-center text-sm">
          No signups yet. Share the public link to start collecting.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-surface-sunk bg-white">
          <table className="w-full text-sm">
            <thead className="bg-surface-raised text-ink-muted">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Slot</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-sunk">
              {commitments.map((c) => {
                const slot = sig.slots.find((s) => s.id === c.slotId);
                const summary = slot
                  ? summarizeValues(sig.fields, (slot.values as Record<string, unknown>) ?? {})
                  : '';
                return (
                  <tr key={c.id}>
                    <td className="px-4 py-3 font-medium">{c.participantName}</td>
                    <td className="text-ink-muted px-4 py-3">{c.participantEmail}</td>
                    <td className="px-4 py-3">{summary || slot?.ref || '—'}</td>
                    <td className="px-4 py-3">{c.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
