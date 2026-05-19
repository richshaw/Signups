'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Pencil, GripVertical } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { buildColsTemplate } from './columnSizing';
import { fieldTypeMeta } from './fieldTypes';
import { ResizeHandle } from './ResizeHandle';
import { useReorderable } from './useReorderable';
import type { GridField } from './useGridState';

interface GridHeaderProps {
  fields: GridField[];
  onEditField: (field: GridField) => void;
  onAddField: () => void;
  onMoveField: (fromIdx: number, toIdx: number) => void;
  onResize: (fieldId: string, width: number) => void;
  onResetWidth: (fieldId: string) => void;
  onAnnounce?: (message: string) => void;
}

const FLASH_MS = 700;

export function GridHeader({
  fields,
  onEditField,
  onAddField,
  onMoveField,
  onResize,
  onResetWidth,
  onAnnounce,
}: GridHeaderProps) {
  const [justMovedId, setJustMovedId] = useState<string | null>(null);
  const [hoverDragId, setHoverDragId] = useState<string | null>(null);
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());

  const setButtonRef = useCallback((id: string) => (el: HTMLButtonElement | null) => {
    if (el) buttonRefs.current.set(id, el);
    else buttonRefs.current.delete(id);
  }, []);

  // Clear flash highlight after a short delay.
  useEffect(() => {
    if (justMovedId === null) return;
    const id = setTimeout(() => setJustMovedId(null), FLASH_MS);
    return () => clearTimeout(id);
  }, [justMovedId]);

  const idToIndex = useCallback(
    (id: string) => fields.findIndex((f) => f.id === id),
    [fields],
  );

  const handleReorder = useCallback(
    (fromIdx: number, toIdx: number) => {
      const moved = fields[fromIdx];
      if (!moved) return;
      onMoveField(fromIdx, toIdx);
      setJustMovedId(moved.id);
      onAnnounce?.(`Moved field "${moved.name}" to position ${toIdx + 1} of ${fields.length}.`);
      // Restore focus to the pencil after the reorder so keyboard users keep their place.
      requestAnimationFrame(() => {
        buttonRefs.current.get(moved.id)?.focus();
      });
    },
    [fields, onMoveField, onAnnounce],
  );

  const { dragId, overId, source, target } = useReorderable<HTMLElement>({
    idToIndex,
    onReorder: handleReorder,
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (!(e.metaKey || e.ctrlKey)) return;
    if (e.key === 'ArrowLeft' && idx > 0) {
      e.preventDefault();
      handleReorder(idx, idx - 1);
    } else if (e.key === 'ArrowRight' && idx < fields.length - 1) {
      e.preventDefault();
      handleReorder(idx, idx + 1);
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: buildColsTemplate(fields),
        borderBottom: '1px solid #eef1f5',
      }}
      className="bg-surface-raised"
    >
      {/* Leading # column — 38px */}
      <div className="flex items-center justify-center px-2 py-2 border-r border-surface-sunk">
        <span className="text-[11px] text-ink-soft font-mono">#</span>
      </div>

      {/* Field columns */}
      {fields.map((f, i) => {
        const meta = fieldTypeMeta(f.type);
        const Icon = meta.icon;
        const isFlashing = justMovedId === f.id;
        const isDragging = dragId === f.id;
        const isDropTarget = overId === f.id && dragId !== null && dragId !== f.id;
        const showGrip = hoverDragId === f.id || isDragging;
        const headerBg = isDropTarget
          ? 'bg-brand-soft/40'
          : isFlashing
            ? 'bg-brand-soft/60'
            : '';
        const targetProps = target(f.id);
        return (
          <div
            key={f.id}
            style={{
              position: 'relative',
              boxShadow: isDropTarget ? 'inset 2px 0 0 0 #1f6feb' : undefined,
              opacity: isDragging ? 0.5 : 1,
            }}
            className={`flex items-center border-r border-surface-sunk transition-colors ${headerBg}`}
            onDragOver={targetProps.onDragOver}
            onDragLeave={targetProps.onDragLeave}
            onDrop={targetProps.onDrop}
          >
            {/* Drag source: type icon span that swaps to GripVertical on hover. */}
            <span
              {...source(f.id)}
              onMouseEnter={() => setHoverDragId(f.id)}
              onMouseLeave={() => setHoverDragId((prev) => (prev === f.id ? null : prev))}
              aria-label={`Drag to reorder field "${f.name}"`}
              title="Drag to reorder"
              className="flex flex-shrink-0 items-center justify-center pl-2 pr-1 py-2 cursor-grab active:cursor-grabbing text-brand"
            >
              {showGrip ? (
                <GripVertical size={12} className="text-ink-soft" />
              ) : (
                <Icon size={12} className="text-brand" />
              )}
            </span>

            <span className="flex-1 min-w-0 text-[13px] font-medium text-ink truncate py-2">
              {f.name}
            </span>

            {/* Inline edit pencil — variant C: pencil at rest, brand-tinted chip on hover/focus. */}
            <button
              ref={setButtonRef(f.id)}
              type="button"
              data-field-edit-button
              onClick={() => onEditField(f)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              aria-label={`Edit field "${f.name}"`}
              title="Edit field"
              className="group/edit ml-auto mr-2 flex flex-shrink-0 items-center justify-center rounded px-1 py-1 text-ink-soft hover:bg-brand/15 hover:text-brand focus:outline-none focus:bg-brand/15 focus:text-brand transition-colors"
            >
              <Pencil size={11} />
            </button>

            <ResizeHandle
              field={f}
              fieldIndex={i}
              onResize={(width) => onResize(f.id, width)}
              onReset={() => onResetWidth(f.id)}
            />
          </div>
        );
      })}

      {/* Trailing Capacity header — 90px */}
      <div className="flex items-center justify-center gap-1 px-2 py-2 border-r border-surface-sunk">
        <span className="text-[13px] font-medium text-ink truncate">Cap.</span>
        <Tooltip label="Maximum number of people who can sign up for this slot.">
          <span
            tabIndex={0}
            role="img"
            aria-label="About the Cap column"
            className="inline-flex h-[13px] w-[13px] cursor-help items-center justify-center rounded-full border border-ink-soft text-[9px] font-bold leading-none text-ink-soft"
          >
            i
          </span>
        </Tooltip>
      </div>

      {/* Trailing labeled "+ Add field" link — 130px. Right-aligned to match
          the per-row trailing actions cell. */}
      <button
        type="button"
        onClick={onAddField}
        aria-label="Add field"
        className="flex h-full w-full items-center justify-end gap-1.5 border-l border-surface-sunk px-3 text-sm font-medium text-ink-muted hover:bg-surface-sunk/50 hover:text-ink transition-colors"
      >
        <Plus size={13} />
        Add field
      </button>
    </div>
  );
}
