import type { SlotFieldDefinition } from '@/schemas/slot-fields';
import type { SlotStatus } from '@/schemas/slots';

export interface OwnCommitment {
  slotId: string;
  editUrl: string;
  participantName: string;
}

export interface SignupViewSlot {
  id: string;
  ref: string;
  values: Record<string, unknown>;
  slotAt: string | null;
  capacity: number | null;
  status: SlotStatus;
  committed: number;
}

export interface SignupViewField {
  ref: string;
  label: string;
  fieldType: SlotFieldDefinition['fieldType'];
}
