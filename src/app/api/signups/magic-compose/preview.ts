import type { MagicComposeDraft } from '@/lib/magic-compose/prompt';
import type { SignupTemplate } from '@/lib/signup-templates';
import type { SlotFieldInput } from '@/schemas/slot-fields';

/** Client-side preview of the converted template; consumed by the Drafting animation. */
export interface DraftPreview {
  title: string;
  description: string;
  fields: Array<{
    ref: string;
    label: string;
    fieldType: SlotFieldInput['fieldType'];
  }>;
  slots: Array<{
    values: Record<string, unknown>;
    capacity: number | null;
  }>;
}

/**
 * Project the post-conversion template + draft into the shape the Drafting
 * animation needs. Pure — sibling module so it can be unit-tested without
 * pulling next-auth via route.ts imports.
 */
export function buildDraftPreview(
  draft: MagicComposeDraft,
  template: SignupTemplate,
): DraftPreview {
  return {
    title: draft.title,
    description: draft.description,
    fields: template.fields.map((f) => ({
      ref: f.ref,
      label: f.label,
      fieldType: f.fieldType,
    })),
    slots: template.slots.map((s) => ({
      values: s.values,
      capacity: s.capacity,
    })),
  };
}
