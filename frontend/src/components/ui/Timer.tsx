import { cn } from '@/lib/utils';

interface TimerProps {
  seconds: number;
  className?: string;
}

export default function Timer({ seconds, className }: TimerProps) {
  const mm = String(Math.floor(Math.abs(seconds) / 60)).padStart(2, '0');
  const ss = String(Math.abs(seconds) % 60).padStart(2, '0');
  const isWarning = seconds <= 5 && seconds >= 0;

  return (
    <span
      className={cn(
        'font-display tabular-nums transition-colors duration-300',
        isWarning ? 'animate-pulse text-danger' : 'text-foreground',
        className,
      )}
    >
      {mm}:{ss}
    </span>
  );
}
