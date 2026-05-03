import { headers } from 'next/headers';
import type { ActivityEvent } from '@/db/schema/activity';
import { getDb } from '@/db/client';
import { recordActivity, type ActivityActor } from '@/lib/activity';
import { log } from '@/lib/log';

const BOT_RE =
  /bot|crawler|spider|slurp|facebookexternalhit|whatsapp|telegrambot|discordbot|slackbot|twitterbot|linkedinbot|googlebot|bingbot|preview|headlesschrome|phantomjs|httpie|curl|wget/i;

export type UaClass = 'browser' | 'bot' | 'unknown';

export function classifyUa(ua: string | null | undefined): UaClass {
  if (!ua) return 'unknown';
  return BOT_RE.test(ua) ? 'bot' : 'browser';
}

export function refererHost(ref: string | null | undefined): string | null {
  if (!ref) return null;
  try {
    return new URL(ref).host || null;
  } catch {
    return null;
  }
}

export function isDoNotTrack(headerMap: {
  get: (name: string) => string | null;
}): boolean {
  return headerMap.get('dnt') === '1' || headerMap.get('sec-gpc') === '1';
}

async function writeActivity(args: {
  signupId: string | null;
  workspaceId: string | null;
  actor: ActivityActor;
  eventType: ActivityEvent;
  payload?: Record<string, unknown>;
}): Promise<void> {
  await getDb().transaction((tx) =>
    recordActivity(tx, {
      signupId: args.signupId,
      workspaceId: args.workspaceId,
      actor: args.actor,
      eventType: args.eventType,
      payload: args.payload ?? {},
    }),
  );
}

export async function recordPublicView(args: {
  signupId: string;
  workspaceId: string | null;
  signupStatus: string;
  isReturning: boolean;
}): Promise<void> {
  try {
    const h = await headers();
    if (isDoNotTrack(h)) return;
    const uaClass = classifyUa(h.get('user-agent'));
    if (uaClass === 'bot') return;
    await writeActivity({
      signupId: args.signupId,
      workspaceId: args.workspaceId,
      actor: { actorId: null, actorType: 'system' },
      eventType: 'signup.viewed',
      payload: {
        uaClass,
        refererHost: refererHost(h.get('referer')),
        isReturning: args.isReturning,
        signupStatus: args.signupStatus,
      },
    });
  } catch (err) {
    log.warn({ err }, 'recordPublicView failed');
  }
}

export async function recordEditLinkFollowed(args: {
  signupId: string;
  workspaceId: string | null;
  commitmentId: string;
  participantId: string | null;
}): Promise<void> {
  try {
    const h = await headers();
    if (isDoNotTrack(h)) return;
    if (classifyUa(h.get('user-agent')) === 'bot') return;
    await writeActivity({
      signupId: args.signupId,
      workspaceId: args.workspaceId,
      actor: { actorId: args.participantId, actorType: 'participant' },
      eventType: 'commitment.edit_link_followed',
      payload: { commitmentId: args.commitmentId },
    });
  } catch (err) {
    log.warn({ err }, 'recordEditLinkFollowed failed');
  }
}

export async function recordOrganizerView(args: {
  actor: ActivityActor;
  signupId: string | null;
  workspaceId: string | null;
  eventType: ActivityEvent;
  payload?: Record<string, unknown>;
}): Promise<void> {
  try {
    await writeActivity({
      signupId: args.signupId,
      workspaceId: args.workspaceId,
      actor: args.actor,
      eventType: args.eventType,
      payload: args.payload,
    });
  } catch (err) {
    log.warn({ err, event: args.eventType }, 'recordOrganizerView failed');
  }
}
