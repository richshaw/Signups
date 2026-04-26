const STYLES: Record<string, string> = {
  open: 'bg-success/10 text-success',
  draft: 'bg-warn/10 text-warn',
  closed: 'bg-ink-soft/10 text-ink-muted',
  archived: 'bg-ink-soft/10 text-ink-muted',
};

const FALLBACK = 'bg-ink-soft/10 text-ink-muted';

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs leading-none font-medium ${STYLES[status] ?? FALLBACK}`}
    >
      {status}
    </span>
  );
}
