import { describe, expect, it } from 'vitest';
import type { MagicComposeError, MagicComposeErrorCode } from '@/lib/magic-compose/llm-client';
import type { MagicComposeDraft } from '@/lib/magic-compose/prompt';
import { magicComposeToTemplate } from '@/lib/magic-compose/to-template';
import { mapMagicComposeError } from './errors';
import { buildDraftPreview } from './preview';

const CASES: Array<{ code: MagicComposeErrorCode; expectedHttp: number; expectedCode: string }> = [
  { code: 'not_configured', expectedHttp: 403, expectedCode: 'forbidden' },
  { code: 'rate_limited', expectedHttp: 429, expectedCode: 'rate_limited' },
  { code: 'aborted', expectedHttp: 500, expectedCode: 'internal' },
  { code: 'timeout', expectedHttp: 500, expectedCode: 'internal' },
  { code: 'upstream', expectedHttp: 500, expectedCode: 'internal' },
  { code: 'invalid_json', expectedHttp: 500, expectedCode: 'internal' },
  { code: 'schema_mismatch', expectedHttp: 500, expectedCode: 'internal' },
];

describe('mapMagicComposeError', () => {
  it.each(CASES)('maps $code → ServiceError code $expectedCode', ({ code, expectedCode }) => {
    const error: MagicComposeError = { code, message: 'x' };
    const mapped = mapMagicComposeError(error);
    expect(mapped.code).toBe(expectedCode);
    expect(mapped.message).toEqual(expect.any(String));
    expect(mapped.message.length).toBeGreaterThan(0);
  });

  it('aborted is classified as internal, not invalid_input', () => {
    // Regression: previously aborted mapped to invalid_input/400, misclassifying
    // client-cancelled requests as user input errors in Sentry.
    const mapped = mapMagicComposeError({ code: 'aborted', message: 'cancelled' });
    expect(mapped.code).not.toBe('invalid_input');
    expect(mapped.code).toBe('internal');
  });

  it('timeout hints at LLM_TIMEOUT_MS', () => {
    const mapped = mapMagicComposeError({ code: 'timeout', message: 'x' });
    expect(mapped.message).toMatch(/LLM_TIMEOUT_MS/);
  });
});

describe('buildDraftPreview', () => {
  const CANNED: MagicComposeDraft = {
    title: 'U9 snack duty, Spring',
    description: 'Two families per game.',
    fields: [
      { ref: 'date', label: 'Date', fieldType: 'date', required: true },
      { ref: 'opponent', label: 'Opponent', fieldType: 'text', required: false },
    ],
    slots: [
      { values: { date: '2026-04-25', opponent: 'Hawks' }, capacity: 2 },
      { values: { date: '2026-05-02', opponent: 'Foxes' }, capacity: 2 },
    ],
  };

  it('returns title, description, post-coerced fields and slots', () => {
    const { template } = magicComposeToTemplate(CANNED);
    const preview = buildDraftPreview(CANNED, template);

    expect(preview.title).toBe('U9 snack duty, Spring');
    expect(preview.description).toBe('Two families per game.');
    expect(preview.fields).toEqual([
      { ref: 'date', label: 'Date', fieldType: 'date' },
      { ref: 'opponent', label: 'Opponent', fieldType: 'text' },
    ]);
    expect(preview.slots).toHaveLength(2);
    expect(preview.slots[0]).toEqual({
      values: { date: '2026-04-25', opponent: 'Hawks' },
      capacity: 2,
    });
  });

  it('inherits the converter strip of stray value keys (preview matches build view)', () => {
    const draft: MagicComposeDraft = {
      ...CANNED,
      slots: [{ values: { date: '2026-04-25', stray: 'nope' }, capacity: 1 }],
    };
    const { template } = magicComposeToTemplate(draft);
    const preview = buildDraftPreview(draft, template);
    expect(preview.slots[0]?.values).toEqual({ date: '2026-04-25' });
    expect(preview.slots[0]?.values).not.toHaveProperty('stray');
  });

  it('preserves null capacity as null (unlimited)', () => {
    const draft: MagicComposeDraft = {
      ...CANNED,
      slots: [{ values: { date: '2026-04-25', opponent: 'Hawks' }, capacity: null }],
    };
    const { template } = magicComposeToTemplate(draft);
    const preview = buildDraftPreview(draft, template);
    expect(preview.slots[0]?.capacity).toBeNull();
  });

  it('coerces invalid date values to absent values (preview reflects what build view sees)', () => {
    const draft: MagicComposeDraft = {
      ...CANNED,
      slots: [{ values: { date: 'not-a-date', opponent: 'Hawks' }, capacity: 1 }],
    };
    const { template } = magicComposeToTemplate(draft);
    const preview = buildDraftPreview(draft, template);
    expect(preview.slots[0]?.values).not.toHaveProperty('date');
    expect(preview.slots[0]?.values.opponent).toBe('Hawks');
  });
});
