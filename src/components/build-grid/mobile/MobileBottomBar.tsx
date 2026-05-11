'use client';

import { Eye, Plus } from 'lucide-react';

type MobileBottomBarProps = {
  onAddSlot: () => void;
  onPreview: () => void;
};

export function MobileBottomBar({ onAddSlot, onPreview }: MobileBottomBarProps) {
  return (
    <div
      className="sticky bottom-0 z-10 -mx-4 flex items-center gap-2 border-t border-surface-sunk bg-white px-4 pt-2.5 pb-[calc(env(safe-area-inset-bottom)+12px)] shadow-[0_-4px_20px_rgb(11_18_32/0.04)]"
    >
      <button
        type="button"
        onClick={onAddSlot}
        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:brightness-110"
      >
        <Plus size={16} aria-hidden="true" />
        Add slot
      </button>
      <button
        type="button"
        onClick={onPreview}
        className="inline-flex items-center gap-1.5 rounded-2xl border border-surface-sunk bg-white px-4 py-3 text-sm font-medium text-ink hover:bg-surface-raised"
      >
        <Eye size={16} aria-hidden="true" />
        Preview
      </button>
    </div>
  );
}
