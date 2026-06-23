import { getLevelTier } from '@/lib/levelTier';

interface XPBarProps {
  current: number;
  required: number;
  level: number;
  animated?: boolean;
  /** Masque le label « LVL N » (ex. sidebar où le niveau est déjà affiché). */
  showLevel?: boolean;
  /** Masque les chiffres « x / y XP » (ex. sidebar où ils sont affichés à part). */
  showValue?: boolean;
  className?: string;
}

export default function XPBar({ current, required, level, animated = true, showLevel = true, showValue = true, className }: XPBarProps) {
  const pct = Math.min(100, Math.round((current / required) * 100));
  const tier = getLevelTier(level);

  return (
    <div className={className}>
      {(showLevel || showValue) && (
        <div className={`mb-1 flex items-center ${showLevel ? 'justify-between' : 'justify-end'}`}>
          {showLevel && (
            <span className="font-display text-xs font-bold" style={{ color: tier.color }}>
              LVL {level}
            </span>
          )}
          {showValue && (
            <span className="text-xs text-muted-foreground">
              {current} / {required} XP
            </span>
          )}
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-card-shield">
        <div
          className={`relative overflow-hidden h-full rounded-full shadow-glow ${animated ? 'transition-all duration-700 ease-out' : ''}`}
          style={{
            width: `${pct}%`,
            background: `linear-gradient(to right, ${tier.gradient.from}, ${tier.gradient.to})`,
          }}
        >
          <div
            className="absolute inset-y-0 w-16 animate-xp-shimmer"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)' }}
          />
        </div>
      </div>
    </div>
  );
}
