type SpinnerProps = {
  className?: string;
};

export function Spinner({ className = 'size-4 border-2' }: SpinnerProps) {
  return (
    <span
      aria-hidden="true"
      className={`animate-spin-720 inline-block rounded-full border-current border-t-transparent ${className}`}
    />
  );
}
