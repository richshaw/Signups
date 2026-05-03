import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { and, eq } from 'drizzle-orm';
import { getDb, type Db } from '@/db/client';
import { activity } from '@/db/schema/activity';
import { workspaceMembers } from '@/db/schema/members';
import { organizers } from '@/db/schema/organizers';
import { signups } from '@/db/schema/signups';
import { workspaces } from '@/db/schema/workspaces';
import { makeId } from '@/lib/ids';

const headerStore: { current: Map<string, string> } = { current: new Map() };

vi.mock('next/headers', () => ({
  headers: async () => ({
    get: (name: string) => headerStore.current.get(name.toLowerCase()) ?? null,
  }),
}));

function setHeaders(map: Record<string, string>): void {
  headerStore.current = new Map(
    Object.entries(map).map(([k, v]) => [k.toLowerCase(), v]),
  );
}

const realBrowserUa =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

describe('view-tracker (db)', () => {
  let db: Db;
  let workspaceId: string;
  let organizerId: string;
  let signupId: string;

  beforeAll(async () => {
    db = getDb();
    organizerId = makeId('org');
    workspaceId = makeId('ws');
    signupId = makeId('sig');
    const memberId = makeId('mem');
    const slug = `vt-${workspaceId.slice(-8).toLowerCase()}`;

    await db.transaction(async (tx) => {
      await tx
        .insert(organizers)
        .values({ id: organizerId, email: `${slug}@example.test`, name: 'View Tracker Test' });
      await tx.insert(workspaces).values({
        id: workspaceId,
        slug,
        name: 'View Tracker WS',
        type: 'personal',
        plan: 'free',
      });
      await tx.insert(workspaceMembers).values({
        id: memberId,
        workspaceId,
        organizerId,
        role: 'owner',
        status: 'active',
      });
      await tx.insert(signups).values({
        id: signupId,
        workspaceId,
        organizerId,
        slug: `s-${signupId.slice(-8).toLowerCase()}`,
        title: 'View Tracker signup',
        status: 'open',
      });
    });
  });

  afterAll(async () => {
    await db.delete(workspaces).where(eq(workspaces.id, workspaceId));
    await db.delete(organizers).where(eq(organizers.id, organizerId));
  });

  beforeEach(async () => {
    await db.delete(activity).where(eq(activity.signupId, signupId));
    setHeaders({});
  });

  describe('recordPublicView', () => {
    it('writes a signup.viewed row for a real browser UA', async () => {
      setHeaders({ 'user-agent': realBrowserUa, referer: 'https://news.ycombinator.com/' });
      const { recordPublicView } = await import('./view-tracker');
      await recordPublicView({
        signupId,
        workspaceId,
        signupStatus: 'open',
        isReturning: false,
      });
      const rows = await db
        .select()
        .from(activity)
        .where(
          and(eq(activity.signupId, signupId), eq(activity.eventType, 'signup.viewed')),
        );
      expect(rows).toHaveLength(1);
      const row = rows[0]!;
      expect(row.actorType).toBe('system');
      expect(row.actorId).toBeNull();
      expect(row.workspaceId).toBe(workspaceId);
      const payload = row.payload as Record<string, unknown>;
      expect(payload.uaClass).toBe('browser');
      expect(payload.refererHost).toBe('news.ycombinator.com');
      expect(payload.isReturning).toBe(false);
      expect(payload.signupStatus).toBe('open');
    });

    it('records isReturning=true when passed', async () => {
      setHeaders({ 'user-agent': realBrowserUa });
      const { recordPublicView } = await import('./view-tracker');
      await recordPublicView({
        signupId,
        workspaceId,
        signupStatus: 'open',
        isReturning: true,
      });
      const rows = await db
        .select()
        .from(activity)
        .where(
          and(eq(activity.signupId, signupId), eq(activity.eventType, 'signup.viewed')),
        );
      expect(rows).toHaveLength(1);
      expect((rows[0]!.payload as Record<string, unknown>).isReturning).toBe(true);
    });

    it('does not write when DNT=1', async () => {
      setHeaders({ 'user-agent': realBrowserUa, dnt: '1' });
      const { recordPublicView } = await import('./view-tracker');
      await recordPublicView({
        signupId,
        workspaceId,
        signupStatus: 'open',
        isReturning: false,
      });
      const rows = await db
        .select()
        .from(activity)
        .where(eq(activity.signupId, signupId));
      expect(rows).toHaveLength(0);
    });

    it('does not write when Sec-GPC=1', async () => {
      setHeaders({ 'user-agent': realBrowserUa, 'sec-gpc': '1' });
      const { recordPublicView } = await import('./view-tracker');
      await recordPublicView({
        signupId,
        workspaceId,
        signupStatus: 'open',
        isReturning: false,
      });
      const rows = await db
        .select()
        .from(activity)
        .where(eq(activity.signupId, signupId));
      expect(rows).toHaveLength(0);
    });

    it('does not write for a Googlebot UA', async () => {
      setHeaders({
        'user-agent':
          'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      });
      const { recordPublicView } = await import('./view-tracker');
      await recordPublicView({
        signupId,
        workspaceId,
        signupStatus: 'open',
        isReturning: false,
      });
      const rows = await db
        .select()
        .from(activity)
        .where(eq(activity.signupId, signupId));
      expect(rows).toHaveLength(0);
    });

    it('writes when UA is missing (uaClass=unknown)', async () => {
      setHeaders({});
      const { recordPublicView } = await import('./view-tracker');
      await recordPublicView({
        signupId,
        workspaceId,
        signupStatus: 'closed',
        isReturning: false,
      });
      const rows = await db
        .select()
        .from(activity)
        .where(
          and(eq(activity.signupId, signupId), eq(activity.eventType, 'signup.viewed')),
        );
      expect(rows).toHaveLength(1);
      const payload = rows[0]!.payload as Record<string, unknown>;
      expect(payload.uaClass).toBe('unknown');
      expect(payload.signupStatus).toBe('closed');
      expect(payload.refererHost).toBeNull();
    });
  });

  describe('recordEditLinkFollowed', () => {
    it('writes a row with participant actor', async () => {
      setHeaders({ 'user-agent': realBrowserUa });
      const { recordEditLinkFollowed } = await import('./view-tracker');
      const participantId = makeId('par');
      const commitmentId = makeId('com');
      await recordEditLinkFollowed({
        signupId,
        workspaceId,
        commitmentId,
        participantId,
      });
      const rows = await db
        .select()
        .from(activity)
        .where(
          and(
            eq(activity.signupId, signupId),
            eq(activity.eventType, 'commitment.edit_link_followed'),
          ),
        );
      expect(rows).toHaveLength(1);
      const row = rows[0]!;
      expect(row.actorType).toBe('participant');
      expect(row.actorId).toBe(participantId);
      expect((row.payload as Record<string, unknown>).commitmentId).toBe(commitmentId);
    });

    it('skips on DNT=1', async () => {
      setHeaders({ 'user-agent': realBrowserUa, dnt: '1' });
      const { recordEditLinkFollowed } = await import('./view-tracker');
      await recordEditLinkFollowed({
        signupId,
        workspaceId,
        commitmentId: makeId('com'),
        participantId: makeId('par'),
      });
      const rows = await db
        .select()
        .from(activity)
        .where(eq(activity.signupId, signupId));
      expect(rows).toHaveLength(0);
    });
  });

  describe('recordOrganizerView', () => {
    it('writes a signup.editor_opened row with section payload', async () => {
      const { recordOrganizerView } = await import('./view-tracker');
      await recordOrganizerView({
        actor: { actorId: organizerId, actorType: 'organizer' },
        signupId,
        workspaceId,
        eventType: 'signup.editor_opened',
        payload: { section: 'slots' },
      });
      const rows = await db
        .select()
        .from(activity)
        .where(
          and(
            eq(activity.signupId, signupId),
            eq(activity.eventType, 'signup.editor_opened'),
          ),
        );
      expect(rows).toHaveLength(1);
      const row = rows[0]!;
      expect(row.actorType).toBe('organizer');
      expect(row.actorId).toBe(organizerId);
      expect((row.payload as Record<string, unknown>).section).toBe('slots');
    });

    it('writes signup.draft_started without a signupId', async () => {
      const { recordOrganizerView } = await import('./view-tracker');
      await recordOrganizerView({
        actor: { actorId: organizerId, actorType: 'organizer' },
        signupId: null,
        workspaceId,
        eventType: 'signup.draft_started',
      });
      const rows = await db
        .select()
        .from(activity)
        .where(
          and(
            eq(activity.workspaceId, workspaceId),
            eq(activity.eventType, 'signup.draft_started'),
          ),
        );
      expect(rows.length).toBeGreaterThanOrEqual(1);
      expect(rows[0]!.signupId).toBeNull();
    });
  });
});
