import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  accent?: boolean;
  compact?: boolean;
  className?: string;
}

export default function StatCard({ icon: Icon, value, label, accent = false, compact = false, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1 rounded-lg border bg-card',
        compact ? 'p-3' : 'p-4',
        accent && 'border-primary/40 shadow-glow',
        className,
      )}
    >
      {/* Wrapper hauteur fixe pour aligner sur StreakCard (h-5) */}
      <div className={cn('flex items-center justify-center', compact ? 'h-5' : 'h-6')}>
        <Icon className={cn(compact ? 'h-4 w-4' : 'h-5 w-5', accent ? 'text-primary' : 'text-muted-foreground')} />
      </div>
      <span className={cn('font-display font-black', compact ? 'text-xl' : 'text-2xl', accent ? 'text-primary' : 'text-foreground')}>
        {value}
      </span>
      <span className={cn(
        'uppercase tracking-widest text-muted-foreground',
        compact ? 'text-xs whitespace-nowrap' : 'text-xs',
      )}>
        {label}
      </span>
    </div>
  );
}
