import { useEffect, useMemo, useRef } from 'react';
import { getLevelTier } from '@/lib/levelTier';
import { getAvatarStage, type AvatarClassKey } from '@/lib/avatar';
import { renderAvatarSprite } from '@/lib/avatarSprites';

/* ── Keyframes (effets ambiants — le héros lui-même est en pixel art canvas) ── */
const KEYFRAMES = `
@keyframes fqav-rise   { 0%{opacity:0;transform:translateY(6px) scale(.6)} 25%{opacity:1} 100%{opacity:0;transform:translateY(-26px) scale(1.05)} }
@keyframes fqav-twinkle{ 0%,100%{opacity:.25;transform:scale(.7)} 50%{opacity:1;transform:scale(1.1)} }
@keyframes fqav-pulse  { 0%,100%{opacity:.55;transform:translate(-50%,-50%) scale(1)} 50%{opacity:.9;transform:translate(-50%,-50%) scale(1.06)} }
@keyframes fqav-spin   { from{transform:translate(-50%,-50%) rotate(0)} to{transform:translate(-50%,-50%) rotate(360deg)} }
`;
let injected = false;
function ensureKeyframes() {
  if (injected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.dataset.fqAvatar = '1';
  el.textContent = KEYFRAMES;
  document.head.appendChild(el);
  injected = true;
}

const INTERNAL_SCALE = 8; // 16×24 → canvas 128×192, upscalé crisp via image-rendering:pixelated

interface AvatarProps {
  classKey: AvatarClassKey;
  /** Niveau du héros — détermine le stade (1..5) et la teinte du palier. */
  level: number;
  /** Largeur du rendu en px (hauteur = size × 1.5). */
  size?: number;
  /** Mode sélecteur (Register) : classe seule, sans accessoires de stade ni aura. */
  bare?: boolean;
  /** Désactive les animations (miniatures). */
  animate?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/* ── Runes flottantes (stade ≥ 4) ─────────────────────────────── */
function Runes({ c, animate }: { c: string; animate: boolean }) {
  const pts = [
    { x: '2%', y: '24%' }, { x: '92%', y: '30%' },
    { x: '6%', y: '70%' }, { x: '88%', y: '66%' },
  ];
  return (
    <div className="pointer-events-none absolute inset-0">
      {pts.map((p, i) => (
        <span
          key={i}
          className="absolute h-[6px] w-[6px]"
          style={{
            left: p.x, top: p.y,
            background: c,
            boxShadow: `0 0 6px ${c}`,
            transform: 'rotate(45deg)',
            imageRendering: 'pixelated',
            animation: animate ? `fqav-twinkle ${2 + (i % 3) * 0.6}s ease-in-out ${i * 0.35}s infinite` : undefined,
          }}
        />
      ))}
    </div>
  );
}

/* ── Particules montantes (stade ≥ 3, plus denses au stade max) ─── */
function Sparks({ c, count = 7, size = 5 }: { c: string; count?: number; size?: number }) {
  const sparks = useMemo(() => Array.from({ length: count }), [count]);
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[6%] mx-auto h-1/2 w-3/4">
      {sparks.map((_, i) => (
        <span
          key={i}
          className="absolute bottom-0 rounded-[1px]"
          style={{
            width: size, height: size,
            left: `${6 + (i * 88) / sparks.length}%`,
            background: c,
            boxShadow: `0 0 8px ${c}`,
            imageRendering: 'pixelated',
            animation: `fqav-rise ${1.6 + (i % 4) * 0.3}s ease-out ${(i % 5) * 0.22}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export default function Avatar({
  classKey,
  level,
  size = 120,
  bare = false,
  animate = true,
  className,
  style,
}: AvatarProps) {
  ensureKeyframes();
  const tier = getLevelTier(level);
  const stage = getAvatarStage(level);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderAvatarSprite(canvas, {
      classKey,
      stage,
      tier: bare ? undefined : tier,
      scale: INTERNAL_SCALE,
      bare,
    });
  }, [classKey, stage, tier, bare]);

  const canvasStyle: React.CSSProperties = {
    width: size,
    height: size * 1.5,
    imageRendering: 'pixelated',
    display: 'block',
  };

  if (bare) {
    return <canvas ref={canvasRef} className={className} style={{ ...canvasStyle, ...style }} />;
  }

  const isMax = stage >= 5;
  // Aura nettement plus dense au stade Légende pour le distinguer du Champion.
  const auraOpacity = isMax ? 0.85 : 0.1 + stage * 0.1;

  return (
    <div
      className={className}
      style={{ position: 'relative', width: size, height: size * 1.5, display: 'inline-block', ...style }}
    >
      {/* Aura radiale */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2"
        style={{
          width: isMax ? '150%' : '125%', height: isMax ? '150%' : '125%',
          transform: 'translate(-50%,-50%)',
          background: `radial-gradient(circle, ${tier.glowColor} 0%, transparent ${isMax ? 70 : 62}%)`,
          opacity: auraOpacity,
          animation: animate && isMax ? 'fqav-pulse 2.6s ease-in-out infinite' : undefined,
        }}
      />
      {/* Halo tournant (stade max) — double anneau plus marqué */}
      {isMax && animate && (
        <>
          <div
            className="pointer-events-none absolute left-1/2 top-1/2"
            style={{
              width: '128%', height: '128%',
              transform: 'translate(-50%,-50%)',
              borderRadius: '50%',
              background: `repeating-conic-gradient(from 0deg, ${tier.color} 0deg 7deg, transparent 7deg 20deg)`,
              maskImage: 'radial-gradient(circle, transparent 56%, #000 59%, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(circle, transparent 56%, #000 59%, transparent 80%)',
              animation: 'fqav-spin 14s linear infinite',
              opacity: 0.85,
            }}
          />
          <div
            className="pointer-events-none absolute left-1/2 top-1/2"
            style={{
              width: '112%', height: '112%',
              transform: 'translate(-50%,-50%)',
              borderRadius: '50%',
              background: `repeating-conic-gradient(from 30deg, ${tier.colorLight} 0deg 5deg, transparent 5deg 26deg)`,
              maskImage: 'radial-gradient(circle, transparent 50%, #000 53%, transparent 70%)',
              WebkitMaskImage: 'radial-gradient(circle, transparent 50%, #000 53%, transparent 70%)',
              animation: 'fqav-spin 9s linear infinite reverse',
              opacity: 0.7,
            }}
          />
        </>
      )}

      {stage >= 4 && <Runes c={tier.colorLight} animate={animate} />}
      {isMax
        ? <Sparks c={tier.color} count={14} size={6} />
        : stage >= 3 && <Sparks c={tier.colorLight} />}

      <canvas
        ref={canvasRef}
        className="relative"
        style={{ ...canvasStyle, margin: '0 auto', filter: `drop-shadow(0 0 5px ${tier.glowColor})` }}
      />
    </div>
  );
}
