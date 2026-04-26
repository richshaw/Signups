'use client';

import { useState } from 'react';

export function DateField({ defaultValue = '' }: { defaultValue?: string }) {
  const [hasValue, setHasValue] = useState(defaultValue !== '');
  return (
    <label className="focus-within:border-brand focus-within:ring-brand relative flex w-full items-center rounded-lg border border-surface-sunk px-3 py-2 focus-within:ring-1">
      {!hasValue ? (
        <span className="text-ink-muted pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          Date
        </span>
      ) : null}
      <input
        type="date"
        name="date"
        aria-label="Date"
        defaultValue={defaultValue}
        onChange={(e) => setHasValue(e.currentTarget.value !== '')}
        className={`w-full min-w-0 border-0 bg-transparent p-0 focus:outline-none focus:ring-0 ${
          hasValue ? '' : 'text-transparent [&::-webkit-datetime-edit]:text-transparent'
        }`}
      />
    </label>
  );
}
