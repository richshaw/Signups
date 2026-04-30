import type { SlotFieldDefinition } from '@/schemas/slot-fields';

const TYPE_LABELS: Record<SlotFieldDefinition['fieldType'], string> = {
  text: 'Short text',
  date: 'Date',
  time: 'Time',
  number: 'Number',
  enum: 'Choose one',
};

export function fieldTypeLabel(field: SlotFieldDefinition): string {
  return TYPE_LABELS[field.fieldType];
}

export function fieldEnumChoices(field: SlotFieldDefinition): string[] | null {
  if (field.fieldType === 'enum' && field.config.fieldType === 'enum') {
    return field.config.choices;
  }
  return null;
}
