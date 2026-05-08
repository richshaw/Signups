import type { SignupViewField, SignupViewSlot } from './signup-view-types';

export function formatSlotDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

// Rule (option A — field order, with demote-on-collision):
//   1. Explicit primaryRef wins, unless it equals groupRef.
//   2. Otherwise the first field in definition order, skipping the group field.
//   3. Returns null if every field is the group field.
export function pickPrimaryField(
  fields: readonly SignupViewField[],
  primaryRef?: string | null,
  groupRef?: string | null,
): SignupViewField | null {
  if (!fields.length) return null;
  if (primaryRef && primaryRef !== groupRef) {
    const f = fields.find((x) => x.ref === primaryRef);
    if (f) return f;
  }
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
