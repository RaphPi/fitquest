const STYLES = `
@keyframes fq-flame { 0%,100%{transform:scaleX(1) scaleY(1) translateY(0)} 25%{transform:scaleX(.88) scaleY(1.12) translateY(-3px)} 50%{transform:scaleX(1.08) scaleY(.94) translateY(2px)} 75%{transform:scaleX(.94) scaleY(1.07) translateY(-1px)} }
@keyframes fq-inner-fl { 0%,100%{transform:scaleX(1) scaleY(1)} 33%{transform:scaleX(.72) scaleY(1.18)} 66%{transform:scaleX(1.18) scaleY(.76)} }
@keyframes fq-glow-pulse { 0%,100%{opacity:.35} 50%{opacity:.7} }
`;

function flameColors(streak: number) {
  if (streak >= 30) return { outer: '#8b5cf6', inner: '#c4b5fd', glow: 'rgba(139,92,246,0.55)', badge: 'LÉGENDAIRE' };
  if (streak >= 7)  return { outer: '#ef4444', inner: '#fca5a5', glow: 'rgba(239,68,68,0.55)',   badge: 'EN FEU' };
  return                   { outer: '#f97316', inner: '#fed7aa', glow: 'rgba(249,115,22,0.55)',   badge: 'CHAUD' };
}

interface Props {
  streak: number;
}

export default function StreakCard({ streak }: Props) {
  const animated = streak >= 3;
  const { outer, inner, glow, badge } = animated
    ? flameColors(streak)
    : { outer: '#64748b', inner: '#94a3b8', glow: 'transparent', badge: '' };

  return (
    <div
      className="flex flex-col items-center gap-1 rounded-lg border bg-card p-3"
      style={animated ? { borderColor: outer + '66', boxShadow: `0 0 14px ${glow}` } : {}}
    >
      <style>{STYLES}</style>

      {/* Flame SVG */}
      <div style={{ position: 'relative', width: 28, height: 36 }}>
        {animated && (
          <div
            style={{
              position: 'absolute',
              inset: -10,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${glow} 0%, transparent 68%)`,
              animation: 'fq-glow-pulse 1.6s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />
        )}
        <div
          style={{
            animation: animated ? 'fq-flame 1.4s ease-in-out infinite' : 'none',
            transformOrigin: 'bottom center',
          }}
        >
          <svg width="28" height="36" viewBox="0 0 32 42" fill="none">
            <path
              d="M16 2C20 9 27 15 27 23C27 33 22 41 16 41C10 41 5 33 5 23C5 15 12 9 16 2Z"
              fill={outer}
            />
            <path
              d="M16 15C18 19 21 22 21 27C21 33 18 39 16 39C14 39 11 33 11 27C11 22 14 19 16 15Z"
              fill={inner}
              style={{
                transformBox: 'fill-box',
                transformOrigin: '50% 80%',
                animation: animated ? 'fq-inner-fl .9s ease-in-out infinite .12s' : 'none',
              }}
            />
          </svg>
        </div>
      </div>

      <span
        className="font-display text-xl font-black"
        style={{ color: animated ? outer : '' }}
      >
        {streak}
      </span>
      <span className="text-[10px] text-muted-foreground leading-none">
        jours d'affilée
      </span>
      <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
        {animated ? badge : 'SÉRIE'}
      </span>
    </div>
  );
}
