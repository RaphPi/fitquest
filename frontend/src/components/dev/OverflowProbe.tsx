import { useEffect, useState } from 'react';

/**
 * [TEMPORAIRE — diagnostic overflow horizontal iOS]
 * Détecte si la page est plus large que le viewport et affiche en bas un
 * bandeau listant les éléments fautifs (tag + classes + position/largeur).
 * À retirer une fois le bug 3 PWA identifié.
 */
interface Offender {
  tag: string;
  cls: string;
  left: number;
  right: number;
  w: number;
}

function scan(): { vw: number; docW: number; offenders: Offender[] } {
  const vw = window.innerWidth;
  const docW = document.documentElement.scrollWidth;
  const offenders: Offender[] = [];
  document.querySelectorAll('*').forEach((el) => {
    if (el.closest('[data-overflow-probe]')) return; // s'ignore soi-même
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    if (r.right > vw + 1 || r.left < -1) {
      offenders.push({
        tag: (el.tagName || '').toLowerCase(),
        cls: (el.getAttribute('class') || '').slice(0, 90),
        left: Math.round(r.left),
        right: Math.round(r.right),
        w: Math.round(r.width),
      });
    }
  });
  // les plus larges d'abord
  offenders.sort((a, b) => b.w - a.w);
  return { vw, docW, offenders: offenders.slice(0, 8) };
}

export default function OverflowProbe() {
  const [data, setData] = useState<ReturnType<typeof scan> | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const run = () => setData(scan());
    const t = setTimeout(run, 600); // après peinture + polices
    window.addEventListener('resize', run);
    window.addEventListener('orientationchange', run);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', run);
      window.removeEventListener('orientationchange', run);
    };
  }, []);

  if (hidden || !data) return null;
  const overflowing = data.docW > data.vw + 1 || data.offenders.length > 0;
  if (!overflowing) return null;

  return (
    <div
      data-overflow-probe
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        maxHeight: '45vh',
        overflow: 'auto',
        background: 'rgba(127,29,29,.97)',
        color: '#fff',
        fontFamily: 'monospace',
        fontSize: 11,
        lineHeight: 1.4,
        padding: '8px 10px',
        borderTop: '2px solid #fca5a5',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
        <span>⚠ OVERFLOW viewport={data.vw} docWidth={data.docW}</span>
        <button onClick={() => setHidden(true)} style={{ color: '#fca5a5', background: 'none', border: 'none', fontWeight: 700 }}>✕</button>
      </div>
      {data.offenders.length === 0 && <div>docWidth &gt; viewport mais aucun élément dépassant détecté (layout viewport iOS élargi).</div>}
      {data.offenders.map((o, i) => (
        <div key={i} style={{ marginTop: 4, wordBreak: 'break-all' }}>
          <b>{o.tag}</b> w={o.w} [{o.left}→{o.right}] · {o.cls || '(no class)'}
        </div>
      ))}
    </div>
  );
}
