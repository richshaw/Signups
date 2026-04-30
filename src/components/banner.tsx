type Kind = 'preview' | 'closed';

const STYLES: Record<Kind, string> = {
  preview: 'bg-brand/10 text-brand',
  closed: 'bg-surface-sunk text-ink-muted',
};

export function Banner({
  kind,
  title,
  body,
}: {
  kind: Kind;
  title: string;
  body: string;
}) {
  return (
    <div role="status" className={`space-y-1 rounded-lg px-5 py-4 ${STYLES[kind]}`}>
      <p className="text-base font-semibold">{title}</p>
      <p className="text-sm">{body}</p>
    </div>
  );
}
