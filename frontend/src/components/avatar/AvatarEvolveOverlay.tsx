import { useEffect, useMemo } from 'react';
import { playSound } from '@/lib/sound';
import { getLevelTier } from '@/lib/levelTier';
import { getAvatarStageMeta, type AvatarClassKey } from '@/lib/avatar';
import Avatar from '@/components/avatar/Avatar';

const PX = "'Press Start 2P', monospace";

const CSS = `
@keyframes fqae-rays  { from{transform:translate(-50%,-50%) rotate(0)} to{transform:translate(-50%,-50%) rotate(360deg)} }
@keyframes fqae-flash { 0%{opacity:.9} 100%{opacity:0} }
@keyframes fqae-pop   { 0%{opacity:0;transform:scale(.4)} 55%{opacity:1;transform:scale(1.12)} 75%{transform:scale(.97)} 100%{transform:scale(1)} }
@keyframes fqae-banner{ 0%{opacity:0;transform:translateY(10px)} 100%{opacity:1;transform:translateY(0)} }
@keyframes fqae-rise  { 0%{opacity:0;transform:translateY(20px) scale(.5)} 25%{opacity:1} 100%{opacity:0;transform:translateY(-120px) scale(1.1)} }
`;

interface Props {
  classKey: AvatarClassKey;
  /** Niveau atteint (détermine le nouveau stade). */
  level: number;
  onClose: () => void;
}

/** Évolution d'avatar au franchissement d'un palier (esprit LevelUpBurst). */
export default function AvatarEvolveOverlay({ classKey, level, onClose }: Props) {
  const tier = getLevelTier(level);
  const meta = getAvatarStageMeta(level);

  useEffect(() => {
    playSound('levelup');
  }, []);

  const sparks = useMemo(() => Array.from({ length: 18 }), []);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center px-6 backdrop-blur-md"
      style={{ background: 'rgba(6,6,10,0.92)' }}
      onClick={onClose}
    >
      <style>{CSS}</style>

      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: `radial-gradient(circle at 50% 44%, ${tier.glowColor}, transparent 60%)`, animation: 'fqae-flash .8s ease-out forwards' }}
      />

      <div className="relative flex flex-col items-center text-center">
        {/* Rayons tournants teintés palier */}
        <div
          className="pointer-events-none absolute left-1/2 top-[46%] h-80 w-80"
          style={{
            background: `repeating-conic-gradient(from 0deg, ${tier.glowColor} 0deg 9deg, transparent 9deg 22deg)`,
            borderRadius: '50%',
            animation: 'fqae-rays 12s linear infinite',
            maskImage: 'radial-gradient(circle, #000 22%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(circle, #000 22%, transparent 70%)',
          }}
        />
        {/* Particules montantes */}
        <div className="pointer-events-none absolute left-1/2 top-[60%]">
          {sparks.map((_, i) => {
            const dx = (i - sparks.length / 2) * 13 + (Math.random() * 10 - 5);
            return (
              <span
                key={i}
                className="absolute h-[6px] w-[6px]"
                style={{
                  left: `${dx}px`,
                  background: i % 2 ? tier.color : tier.colorLight,
                  boxShadow: `0 0 6px ${tier.color}`,
                  imageRendering: 'pixelated',
                  animation: `fqae-rise ${1 + (i % 5) * 0.18}s ease-out ${(i % 4) * 0.1}s infinite`,
                }}
              />
            );
          })}
        </div>

        <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: tier.color }}>
          ✦ Évolution ✦
        </div>

        <div className="relative z-10 my-3" style={{ animation: 'fqae-pop .7s cubic-bezier(.2,.8,.3,1.4)' }}>
          <Avatar classKey={classKey} level={level} size={150} />
        </div>

        <div className="relative z-10" style={{ animation: 'fqae-banner .5s ease-out .25s both' }}>
          <div className="text-[9px] uppercase tracking-widest" style={{ color: tier.color }}>
            Stade {meta.stage} / 5 — {tier.name}
          </div>
          <h2 className="mt-1.5 leading-relaxed" style={{ fontFamily: PX, fontSize: 16, color: tier.color, textShadow: `0 0 14px ${tier.glowColor}` }}>
            {meta.name}
          </h2>
          <p className="mx-auto mt-3 max-w-xs text-xs text-muted-foreground">
            Ton héros s'élève au rang de {meta.name}.
          </p>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="relative z-10 mt-5 rounded-2xl border-2 px-7 py-2.5 font-display text-sm font-bold text-white"
          style={{ borderColor: tier.color, background: 'rgba(255,255,255,0.04)', boxShadow: `0 0 16px -4px ${tier.glowColor}` }}
        >
          Continuer ▸
        </button>
      </div>
    </div>
  );
}
