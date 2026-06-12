import { cn } from '@/lib/utils';

interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
};

export default function LevelBadge({ level, size = 'md', className }: LevelBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border-2 border-primary bg-card-shield font-display font-black leading-none text-primary shadow-glow',
        sizes[size],
        className,
      )}
    >
      <span className="translate-y-px">{level}</span>
    </div>
  );
}
