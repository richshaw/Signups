'use client';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { SignupViewBody } from '@/app/s/[slug]/signup-view';
import type { SignupViewField, SignupViewSlot } from '@/app/s/[slug]/signup-view-types';
import type { SignupMeta } from '../BuildGrid';
import type { GridField, GridRow } from '../useGridState';

type MobilePreviewSheetProps = {
  open: boolean;
  onClose: () => void;
  signupMeta: SignupMeta;
  fields: GridField[];
  rows: GridRow[];
  groupByFieldRef: string | null;
};

// Same adapter shape as SideRail: build-grid edit state → public-view render types.
function toViewField(f: GridField): SignupViewField {
  return { ref: f.ref, label: f.name, fieldType: f.type };
}

function toViewSlot(r: GridRow): SignupViewSlot {
  return {
    id: r.id,
    ref: r.id,
    values: r.values,
    slotAt: null,
    capacity: r.capacity,
    status: 'open',
    committed: 0,
  };
}

export function MobilePreviewSheet({
  open,
  onClose,
  signupMeta,
  fields,
  rows,
  groupByFieldRef,
}: MobilePreviewSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title="What participants see">
      <SignupViewBody
        signup={{
          title: signupMeta.title,
          description: signupMeta.description,
          status: signupMeta.status,
        }}
        fields={fields.map(toViewField)}
        groupByRef={groupByFieldRef}
        slots={rows.map(toViewSlot)}
        slug={signupMeta.slug}
        mode="preview"
        showStateBanner={false}
      />
    </BottomSheet>
  );
}
