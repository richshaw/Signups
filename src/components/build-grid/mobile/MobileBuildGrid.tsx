'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { SaveStatus } from '../SaveStatus';
import { FieldChipStrip } from './FieldChipStrip';
import { MobileGroupByControl } from './MobileGroupByControl';
import { SlotList } from './SlotList';
import { MobileBottomBar } from './MobileBottomBar';
import { MobilePreviewSheet } from './MobilePreviewSheet';
import type { SignupMeta } from '../BuildGrid';
import type { GridField, GridRow, SaveStatus as SaveStatusType } from '../useGridState';

type MobileBuildGridProps = {
  signupMeta: SignupMeta;
  fields: GridField[];
  rows: GridRow[];
  groupByFieldRef: string | null;
  saveStatus: SaveStatusType;
  onEditField: (field: GridField) => void;
  onAddField: () => void;
  onGroupByChange: (ref: string | null) => void;
  onEditCell: (rowId: string, fieldRef: string, value: string) => void;
  onSetCapacity: (rowId: string, capacity: number | null) => void;
  onDeleteRow: (rowId: string) => void;
  onAddRow: () => void;
};

export function MobileBuildGrid({
  signupMeta,
  fields,
  rows,
  groupByFieldRef,
  saveStatus,
  onEditField,
  onAddField,
  onGroupByChange,
  onEditCell,
  onSetCapacity,
  onDeleteRow,
  onAddRow,
}: MobileBuildGridProps) {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-280px)] flex-col">
      <div className="flex flex-col gap-4 pb-3">
        <SectionHeader
          label="COLUMNS"
          count={fields.length}
          action={{ label: 'Edit', icon: <Pencil size={13} aria-hidden="true" />, onClick: onAddField }}
          right={<SaveStatus status={saveStatus} />}
        />
        <FieldChipStrip fields={fields} onEditField={onEditField} onAddField={onAddField} />

        <MobileGroupByControl
          fields={fields}
          value={groupByFieldRef}
          onChange={onGroupByChange}
        />

        <SectionHeader label="SLOTS" count={rows.length} />
        <SlotList
          rows={rows}
          fields={fields}
          groupByFieldRef={groupByFieldRef}
          onEditCell={onEditCell}
          onSetCapacity={onSetCapacity}
          onDeleteRow={onDeleteRow}
        />
      </div>

      <MobileBottomBar onAddSlot={onAddRow} onPreview={() => setPreviewOpen(true)} />

      <MobilePreviewSheet
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        signupMeta={signupMeta}
        fields={fields}
        rows={rows}
        groupByFieldRef={groupByFieldRef}
      />
    </div>
  );
}

function SectionHeader({
  label,
  count,
  action,
  right,
}: {
  label: string;
  count?: number;
  action?: { label: string; icon?: React.ReactNode; onClick: () => void };
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <div className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-soft">
        {label}
        {count != null ? <span>· {count}</span> : null}
      </div>
      <div className="flex items-center gap-3">
        {right}
        {action ? (
          <button
            type="button"
            onClick={action.onClick}
            className="inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-ink"
          >
            {action.icon}
            {action.label}
          </button>
        ) : null}
      </div>
    </div>
  );
}
