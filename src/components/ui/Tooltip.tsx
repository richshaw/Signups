'use client';

import { useState, type ReactNode } from 'react';

type TooltipProps = {
  label: string;
  side?: 'top' | 'bottom';
  children: ReactNode;
};

export function Tooltip({ label, side = 'bottom', children }: TooltipProps) {
  const [open, setOpen] = useState(false);

  const show = () => setOpen(true);
  const hide = () => setOpen(false);

  const popoverPosition =
    side === 'bottom'
      ? 'top-[calc(100%+6px)]'
      : 'bottom-[calc(100%+6px)]';

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocusCapture={show}
      onBlurCapture={hide}
    >
      {children}
      {open && label && (
        <span
          role="tooltip"
          className={`pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[11px] font-medium text-white ${popoverPosition}`}
        >
          {label}
        </span>
      )}
    </span>
  );
}
