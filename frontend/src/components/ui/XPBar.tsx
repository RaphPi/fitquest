import { getLevelTier } from '@/lib/levelTier';

interface XPBarProps {
  current: number;
  required: number;
  level: number;
  animated?: boolean;
  className?: string;
}

export default function XPBar({ current, required, level, animated = true, className }: XPBarProps) {
  const pct = Math.min(100, Math.round((current / required) * 100));
  const tier = getLevelTier(level);

  return (
    <div className={className}>
      <div className="mb-1 flex items-center justify-between">
        <span className="font-display text-xs font-bold" style={{ color: tier.color }}>
          LVL {level}
        </span>
        <span className="text-xs text-muted-foreground">
          {current} / {required} XP
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-card-shield">
        <div
          className={`h-full rounded-full shadow-glow ${animated ? 'transition-all duration-700 ease-out' : ''}`}
          style={{
            width: `${pct}%`,
            background: `linear-gradient(to right, ${tier.gradient.from}, ${tier.gradient.to})`,
          }}
        />
      </div>
    </div>
  );
}
