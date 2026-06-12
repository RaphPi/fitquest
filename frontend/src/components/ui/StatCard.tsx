import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  accent?: boolean;
  className?: string;
}

export default function StatCard({ icon: Icon, value, label, accent = false, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1 rounded-lg border bg-card p-4',
        accent && 'border-primary/40 shadow-glow',
        className,
      )}
    >
      <Icon className={cn('h-5 w-5', accent ? 'text-primary' : 'text-muted-foreground')} />
      <span className={cn('font-display text-2xl font-black', accent ? 'text-primary' : 'text-foreground')}>
        {value}
      </span>
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
  );
}
