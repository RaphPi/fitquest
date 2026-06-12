import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

interface BadgeProps {
  icon: string;
  name: string;
  unlocked: boolean;
  rarity?: BadgeRarity;
  className?: string;
}

const rarityBorder: Record<BadgeRarity, string> = {
  common: 'border-border',
  rare: 'border-primary',
  epic: 'border-primary-soft',
  legendary: 'border-xp',
};

const rarityGlow: Record<BadgeRarity, string> = {
  common: '',
  rare: 'shadow-glow',
  epic: 'shadow-[0_0_20px_-2px_var(--accent-soft)]',
  legendary: 'shadow-glow-xp',
};

export default function Badge({ icon, name, unlocked, rarity = 'common', className }: BadgeProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1.5 rounded-lg border-2 bg-card p-3 transition',
        rarityBorder[rarity],
        unlocked ? rarityGlow[rarity] : 'opacity-40 grayscale',
        className,
      )}
    >
      <div className="relative text-2xl leading-none">
        {icon}
        {!unlocked && (
          <Lock className="absolute -bottom-1 -right-1 h-3.5 w-3.5 text-muted-foreground" />
        )}
      </div>
      <span className="text-center text-[10px] font-medium leading-tight text-muted-foreground">
        {name}
      </span>
    </div>
  );
}
