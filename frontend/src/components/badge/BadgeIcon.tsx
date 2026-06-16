import PixelCanvas from '@/components/workout/active/PixelCanvas';
import { renderBadgeIcon } from '@/lib/badgeIcons';
import type { BadgeRarity } from '@/types';

interface Props {
  iconType: string;
  rarity: BadgeRarity;
  /** taille d'un pixel de la grille 13×13 (rendu = 13×scale px). */
  scale?: number;
  /** badge non obtenu → silhouette grisée. */
  locked?: boolean;
  className?: string;
}

/** Icône de badge en pixel art, teintée par rareté (vitrine + animation de déblocage). */
export default function BadgeIcon({ iconType, rarity, scale = 5, locked = false, className }: Props) {
  return (
    <PixelCanvas
      className={className}
      render={(c) => renderBadgeIcon(c, iconType, rarity, scale, locked)}
      deps={[iconType, rarity, scale, locked]}
    />
  );
}
