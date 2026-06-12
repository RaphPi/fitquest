import { cn } from '@/lib/utils';

interface NumberStepperProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  variant?: 'default' | 'primary' | 'gold' | 'cyan';
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
  cyan: {
    wrap: 'border-cyan-400/30 bg-cyan-400/8',
    btn: 'text-cyan-400/70 hover:text-cyan-400 hover:bg-cyan-400/15',
    val: 'text-cyan-400 font-bold',
  },
};

export default function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  suffix,
  variant = 'default' as const,
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
          'flex h-10 w-10 shrink-0 items-center justify-center text-lg font-bold transition-colors disabled:opacity-30',
          styles.btn,
        )}
      >
        −
      </button>
      <div className={cn('flex flex-1 min-w-[36px] items-center justify-center gap-0.5 text-sm font-display', styles.val)}>
        <span>{value}</span>
        {suffix && <span className="text-[11px] opacity-70">{suffix}</span>}
      </div>
      <button
        type="button"
        onClick={inc}
        disabled={value >= max}
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center text-lg font-bold transition-colors disabled:opacity-30',
          styles.btn,
        )}
      >
        +
      </button>
    </div>
  );
}
