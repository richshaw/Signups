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
