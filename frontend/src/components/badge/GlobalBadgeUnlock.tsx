import { useBadgeStore } from '@/stores/badgeStore';
import BadgeUnlockOverlay from '@/components/badge/BadgeUnlockOverlay';

/** Affiche les déblocages de badges empilés hors séance (ex. création de programme). */
export default function GlobalBadgeUnlock() {
  const queue = useBadgeStore((s) => s.unlockQueue);
  const clearQueue = useBadgeStore((s) => s.clearQueue);
  if (queue.length === 0) return null;
  return <BadgeUnlockOverlay badges={queue} onClose={clearQueue} />;
}
