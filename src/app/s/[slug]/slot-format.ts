import type { SignupViewField, SignupViewSlot } from './signup-view-types';

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

export function formatSlotDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  // `date`-type slot fields are validated as YYYY-MM-DD. `new Date('YYYY-MM-DD')`
  // parses as UTC midnight and would shift to the prior calendar day in
  // negative-offset zones — construct a local-midnight Date instead so the
  // displayed weekday/day matches what the organizer typed.
  const dateOnly = iso.match(DATE_ONLY);
  const d = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

// Returns the first field in definition order, skipping the group field.
// Returns null if every field is the group field (or there are no fields).
export function pickPrimaryField(
  fields: readonly SignupViewField[],
  groupRef?: string | null,
): SignupViewField | null {
  for (const f of fields) {
    if (f.ref === groupRef) continue;
    return f;
  }
  return null;
}

export function renderFieldValue(
  field: SignupViewField,
  raw: unknown,
): string | null {
  if (raw === undefined || raw === null || raw === '') return null;
  if (field.fieldType === 'date') {
    const formatted = formatSlotDate(String(raw));
    if (formatted) return formatted;
  }
  return String(raw);
}

export function formatGroupLabel(field: SignupViewField, raw: unknown): string {
  return renderFieldValue(field, raw) ?? `(no ${field.label.toLowerCase()})`;
}

export function buildMetaSegments({
  fields,
  slot,
  primaryRef,
  groupRef,
}: {
  fields: readonly SignupViewField[];
  slot: Pick<SignupViewSlot, 'values'>;
  primaryRef?: string | null;
  groupRef?: string | null;
}): string[] {
  const out: string[] = [];
  for (const f of fields) {
    if (f.ref === primaryRef) continue;
    if (f.ref === groupRef) continue;
    const formatted = renderFieldValue(f, slot.values[f.ref]);
    if (!formatted) continue;
    out.push(formatted);
  }
  return out;
}
