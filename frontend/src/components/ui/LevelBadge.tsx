import { cn } from '@/lib/utils';

interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-13 w-13 text-base',
};

export default function LevelBadge({ level, size = 'md', className }: LevelBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border-2 border-primary bg-card-shield font-display font-black text-primary shadow-glow',
        'leading-[1] tracking-tight',
        sizes[size],
        className,
      )}
      style={{ lineHeight: 1 }}
    >
      {level}
    </div>
  );
}
