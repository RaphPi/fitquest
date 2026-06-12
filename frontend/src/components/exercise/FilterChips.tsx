import { cn } from '@/lib/utils';

interface FilterChipsProps<T extends string> {
  options: { value: T; label: string }[];
  selected: T[];
  onToggle: (value: T) => void;
  className?: string;
}

export default function FilterChips<T extends string>({
  options,
  selected,
  onToggle,
  className,
}: FilterChipsProps<T>) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {options.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            onClick={() => onToggle(opt.value)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-all duration-150',
              active
                ? 'border-primary bg-primary/20 text-primary shadow-glow'
                : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
