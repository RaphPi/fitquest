import { useState, useEffect, useRef } from 'react';
import { Pencil, Check } from 'lucide-react';
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
  directEdit?: boolean;
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
  variant = 'default',
  className,
  directEdit = false,
}: NumberStepperProps) {
  const styles = variantStyles[variant];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const precision = (step.toString().split('.')[1] ?? '').length;
  const dec = () => onChange(parseFloat(Math.max(min, value - step).toFixed(precision)));
  const inc = () => onChange(parseFloat(Math.min(max, value + step).toFixed(precision)));

  const startEdit = () => {
    setDraft(String(value));
    setEditing(true);
  };

  const commitEdit = () => {
    const parsed = parseFloat(draft);
    if (!isNaN(parsed)) {
      onChange(parseFloat(Math.min(max, Math.max(min, parsed)).toFixed(precision)));
    }
    setEditing(false);
  };

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className={cn('flex flex-1 items-center rounded-lg border overflow-hidden', styles.wrap)}>
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

        <div className="flex flex-1 min-w-[3rem] items-center justify-center gap-0.5 px-1 font-display">
          {editing ? (
            <>
              <input
                ref={inputRef}
                type="number"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
                  if (e.key === 'Escape') { setDraft(String(value)); setEditing(false); }
                }}
                className={cn(
                  'w-full bg-transparent text-center text-sm outline-none',
                  '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
                  styles.val,
                )}
              />
              {suffix && <span className={cn('shrink-0 text-[11px] opacity-70', styles.val)}>{suffix}</span>}
            </>
          ) : (
            <>
              <span className={cn('text-sm', styles.val)}>{value}</span>
              {suffix && <span className={cn('text-[11px] opacity-70', styles.val)}>{suffix}</span>}
            </>
          )}
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

      {directEdit && (
        <button
          type="button"
          onClick={editing ? commitEdit : startEdit}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:border-primary/40 hover:text-primary"
        >
          {editing
            ? <Check className="h-3.5 w-3.5" />
            : <Pencil className="h-3.5 w-3.5" />
          }
        </button>
      )}
    </div>
  );
}
