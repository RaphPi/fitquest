import { cn } from '@/lib/utils';
import { getLevelTier } from '@/lib/levelTier';

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
  const tier = getLevelTier(level);

  return (
    <div
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-full border-2 bg-card-shield font-display font-black',
        sizes[size],
        className,
      )}
      style={{
        borderColor: tier.color,
        color: tier.color,
        boxShadow: `0 0 12px ${tier.glowColor}`,
      }}
    >
      <span style={{ lineHeight: 1, display: 'block', marginTop: '1px' }}>
        {level}
      </span>
    </div>
  );
}
