import { useEffect, useMemo, useState } from 'react';
import { playSound } from '@/lib/sound';
import { RARITY_META } from '@/lib/badgeIcons';
import BadgeIcon from '@/components/badge/BadgeIcon';
import type { BadgeDef } from '@/types';

const PX = "'Press Start 2P', monospace";

const CSS = `
@keyframes fqb-rays { from{transform:translate(-50%,-50%) rotate(0)} to{transform:translate(-50%,-50%) rotate(360deg)} }
@keyframes fqb-flash { 0%{opacity:.85} 100%{opacity:0} }
@keyframes fqb-pop { 0%{opacity:0;transform:scale(.3) rotate(-8deg)} 50%{opacity:1;transform:scale(1.18) rotate(3deg)} 70%{transform:scale(.95)} 100%{transform:scale(1) rotate(0)} }
@keyframes fqb-rise { 0%{opacity:0;transform:translateY(20px) scale(.5)} 25%{opacity:1} 100%{opacity:0;transform:translateY(-120px) scale(1.1)} }
@keyframes fqb-banner { 0%{opacity:0;transform:translateY(10px)} 100%{opacity:1;transform:translateY(0)} }
`;

interface Props {
  badges: BadgeDef[];
  onClose: () => void;
}

/** Déblocage animé d'une série de badges (esprit LevelUpBurst). Tap pour avancer. */
export default function BadgeUnlockOverlay({ badges, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const badge = badges[index];

  // Carillon à chaque badge présenté.
  useEffect(() => {
    if (badge) playSound('badge');
  }, [index, badge]);

  const sparks = useMemo(() => Array.from({ length: 16 }), []);

  if (!badge) return null;
  const meta = RARITY_META[badge.rarity];
  const last = index >= badges.length - 1;

  const advance = () => {
    if (last) onClose();
    else setIndex((i) => i + 1);
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center px-6 backdrop-blur-md"
      style={{ background: 'rgba(6,6,10,0.92)' }}
      onClick={advance}
    >
      <style>{CSS}</style>

      {/* Flash plein écran teinté rareté */}
      <div
        key={`flash-${index}`}
        className="pointer-events-none fixed inset-0"
        style={{ background: `radial-gradient(circle at 50% 42%, ${meta.glow}, transparent 60%)`, animation: 'fqb-flash .7s ease-out forwards' }}
      />

      <div className="relative flex flex-col items-center text-center">
        {/* Rayons tournants */}
        <div
          className="pointer-events-none absolute left-1/2 top-[42px] h-72 w-72"
          style={{
            background: `repeating-conic-gradient(from 0deg, ${meta.glow} 0deg 9deg, transparent 9deg 20deg)`,
            borderRadius: '50%',
            animation: 'fqb-rays 11s linear infinite',
            maskImage: 'radial-gradient(circle, #000 26%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(circle, #000 26%, transparent 70%)',
          }}
        />
        {/* Particules montantes */}
        <div className="pointer-events-none absolute left-1/2 top-[60px]">
          {sparks.map((_, i) => {
            const dx = (i - sparks.length / 2) * 13 + (Math.random() * 10 - 5);
            return (
              <span
                key={`${index}-${i}`}
                className="absolute h-[6px] w-[6px]"
                style={{
                  left: `${dx}px`,
                  background: i % 2 ? meta.color : meta.glow,
                  boxShadow: `0 0 6px ${meta.color}`,
                  imageRendering: 'pixelated',
                  animation: `fqb-rise ${1 + (i % 5) * 0.18}s ease-out ${(i % 4) * 0.1}s infinite`,
                }}
              />
            );
          })}
        </div>

        <div className="text-xs uppercase tracking-[0.3em]" style={{ color: meta.color }}>
          ★ Badge débloqué ★
        </div>

        {/* Icône */}
        <div className="relative z-10 my-4" style={{ animation: 'fqb-pop .6s cubic-bezier(.2,.8,.3,1.4)' }}>
          <BadgeIcon iconType={badge.iconType} rarity={badge.rarity} scale={9} />
        </div>

        <div className="relative z-10" style={{ animation: 'fqb-banner .5s ease-out .25s both' }}>
          <div className="text-[9px] uppercase tracking-widest" style={{ color: meta.color }}>{meta.fr}</div>
          <h2 className="mt-1.5 leading-relaxed" style={{ fontFamily: PX, fontSize: 15, color: meta.color, textShadow: `0 0 14px ${meta.glow}` }}>
            {badge.nameFr}
          </h2>
          <p className="mx-auto mt-3 max-w-xs text-xs text-muted-foreground">{badge.descFr}</p>
        </div>

        {badges.length > 1 && (
          <div className="relative z-10 mt-4 flex gap-1.5">
            {badges.map((_, i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full transition-all"
                style={{ background: i === index ? meta.color : 'rgba(255,255,255,0.2)' }}
              />
            ))}
          </div>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); advance(); }}
          className="relative z-10 mt-5 rounded-2xl border-2 px-7 py-2.5 font-display text-sm font-bold text-white"
          style={{ borderColor: meta.color, background: 'rgba(255,255,255,0.04)', boxShadow: `0 0 16px -4px ${meta.glow}` }}
        >
          {last ? 'Continuer ▸' : `Suivant (${badges.length - index - 1}) ▸`}
        </button>
      </div>
    </div>
  );
}
