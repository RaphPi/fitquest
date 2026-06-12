interface FitQuestIconProps {
  className?: string;
}

export default function FitQuestIcon({ className }: FitQuestIconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className={className} role="img" aria-label="FitQuest">
      <defs>
        <linearGradient id="fq-shieldGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6366f1"/>
          <stop offset="1" stopColor="#a78bfa"/>
        </linearGradient>
        <linearGradient id="fq-bladeGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e2e8f0"/>
          <stop offset="0.5" stopColor="#a78bfa"/>
          <stop offset="1" stopColor="#6366f1"/>
        </linearGradient>
        <filter id="fq-glow">
          <feGaussianBlur stdDeviation="1.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <path d="M32 4 L56 13 L56 31 C56 47 43 55 32 60 C21 55 8 47 8 31 L8 13 Z"
            fill="#0d0b1e" stroke="url(#fq-shieldGrad)" strokeWidth="2.5" strokeLinejoin="round"/>
      <path d="M32 8 L52 16 L52 31 C52 44 41 52 32 57"
            fill="none" stroke="url(#fq-shieldGrad)" strokeWidth="0.5" opacity="0.4"/>
      <path d="M32 13 L35.5 38 L32 42 L28.5 38 Z" fill="url(#fq-bladeGrad)" filter="url(#fq-glow)"/>
      <path d="M32 13 L28.5 38 L32 36 Z" fill="#f1f5f9" opacity="0.6"/>
      <rect x="25" y="37" width="14" height="3.5" rx="1.75" fill="#f59e0b"/>
      <rect x="23.5" y="36.5" width="2" height="4.5" rx="1" fill="#d97706"/>
      <rect x="38.5" y="36.5" width="2" height="4.5" rx="1" fill="#d97706"/>
      <rect x="30" y="40" width="4" height="9" rx="1.5" fill="#92400e"/>
      <rect x="30.5" y="41" width="1.5" height="7" rx="0.75" fill="#a16207" opacity="0.6"/>
      <ellipse cx="32" cy="50.5" rx="3.5" ry="2" fill="#f59e0b"/>
      <text x="32" y="51.5" textAnchor="middle" fontFamily="monospace" fontSize="2.5" fontWeight="900" fill="#0a0a0f">LVL</text>
    </svg>
  );
}
