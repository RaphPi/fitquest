import { cn } from '@/lib/utils';

interface NumberStepperProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  variant?: 'default' | 'primary' | 'gold';
  className?: string;
}

const variantStyles = {
  default: {
    wrap: 'border-border bg-card',
    btn: 'text-muted-foreground hover:text-foreground hover:bg-white/10',
    val: 'text-foreground',
  },
  primary: {
    wrap: 'border-primary/30 bg-primary/8',
    btn: 'text-primary/70 hover:text-primary hover:bg-primary/15',
    val: 'text-primary font-bold',
  },
  gold: {
    wrap: 'border-xp/30 bg-xp/8',
    btn: 'text-xp/70 hover:text-xp hover:bg-xp/15',
    val: 'text-xp font-bold',
  },
};

export default function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  suffix,
  variant = 'default',
  className,
}: NumberStepperProps) {
  const styles = variantStyles[variant];

  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));

  return (
    <div
      className={cn(
        'flex items-center rounded-lg border overflow-hidden',
        styles.wrap,
        className,
      )}
    >
      <button
        type="button"
        onClick={dec}
        disabled={value <= min}
        className={cn(
          'flex h-8 w-7 shrink-0 items-center justify-center text-base font-bold transition-colors disabled:opacity-30',
          styles.btn,
        )}
      >
        −
      </button>
      <div className={cn('flex min-w-[32px] items-center justify-center gap-0.5 text-xs font-display', styles.val)}>
        <span>{value}</span>
        {suffix && <span className="text-[10px] opacity-70">{suffix}</span>}
      </div>
      <button
        type="button"
        onClick={inc}
        disabled={value >= max}
        className={cn(
          'flex h-8 w-7 shrink-0 items-center justify-center text-base font-bold transition-colors disabled:opacity-30',
          styles.btn,
        )}
      >
        +
      </button>
    </div>
  );
}
