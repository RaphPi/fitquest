import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Pause, Minus, Plus, Info } from 'lucide-react';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useUserStore } from '@/stores/userStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useExerciseStore } from '@/stores/exerciseStore';
import { effortPoints, typeCopy } from '@/lib/bossFight';
import { levelProgressPct } from '@/lib/xp';
import { playSound } from '@/lib/sound';
import { renderBoss, drawSprite, WEAPONS, SHIELD, ANVIL, HAMMER } from '@/lib/pixelSprites';
import { getAvatarStage, avatarClassFromStage } from '@/lib/avatar';
import PixelCanvas from '@/components/workout/active/PixelCanvas';
import ExerciseInfoModal from '@/components/workout/ExerciseInfoModal';
import BadgeUnlockOverlay from '@/components/badge/BadgeUnlockOverlay';
import AvatarEvolveOverlay from '@/components/avatar/AvatarEvolveOverlay';

const CSS = `
@keyframes fq-bossIdle { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
@keyframes fq-recoil { 0%{transform:translate(0,0) scale(1)} 20%{transform:translate(8px,5px) scale(.93) rotate(-4deg)} 55%{transform:translate(-3px,2px) scale(.98)} 100%{transform:translate(0,0) scale(1)} }
@keyframes fq-float { 0%{opacity:0;transform:translateY(10px) scale(.6)} 20%{opacity:1;transform:translateY(-6px) scale(1.1)} 85%{opacity:1;transform:translateY(-44px) scale(1.1)} 100%{opacity:0;transform:translateY(-78px) scale(1)} }
@keyframes fq-pulse { 0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.75} 50%{transform:translate(-50%,-50%) scale(1.12);opacity:1} }
@keyframes fq-shake { 0%,100%{transform:translateX(0)} 15%{transform:translateX(-6px)} 30%{transform:translateX(6px)} 45%{transform:translateX(-5px)} 60%{transform:translateX(4px)} 80%{transform:translateX(-2px)} }
@keyframes fq-mp { 0%{opacity:0;transform:translate(0,0) scale(.5)} 20%{opacity:1} 100%{opacity:0;transform:translate(var(--mx),var(--my)) scale(1.1)} }
@keyframes fq-surpass { 0%{opacity:0;transform:translateX(-50%) scale(.4)} 20%{opacity:1;transform:translateX(-50%) scale(1.1)} 80%{opacity:1} 100%{opacity:0;transform:translateX(-50%) scale(1)} }
@keyframes fq-lvlpop { 0%{opacity:0;transform:scale(.3)} 45%{opacity:1;transform:scale(1.25)} 65%{transform:scale(.94)} 100%{transform:scale(1)} }
@keyframes fq-lvlglow { 0%,100%{text-shadow:0 0 8px rgba(245,158,11,.6),2px 2px 0 #7f1d1d} 50%{text-shadow:0 0 22px rgba(245,158,11,1),2px 2px 0 #7f1d1d} }
@keyframes fq-rays { from{transform:translate(-50%,-50%) rotate(0)} to{transform:translate(-50%,-50%) rotate(360deg)} }
@keyframes fq-rise { 0%{opacity:0;transform:translateY(30px) scale(.5)} 25%{opacity:1} 100%{opacity:0;transform:translateY(-140px) scale(1.1)} }
@keyframes fq-flash { 0%{opacity:.9} 100%{opacity:0} }
@keyframes fq-xpcount { 0%{opacity:0;transform:translateY(8px)} 100%{opacity:1;transform:translateY(0)} }
@keyframes fq-hammer { 0%,50%{transform:rotate(-46deg)} 68%{transform:rotate(10deg)} 78%{transform:rotate(2deg)} 100%{transform:rotate(-46deg)} }
@keyframes fq-fspark { 0%{opacity:0;transform:translate(0,0) scale(1)} 8%{opacity:1} 100%{opacity:0;transform:translate(var(--sx),var(--sy)) scale(.3)} }
.fq-idle { animation:fq-bossIdle 3s ease-in-out infinite; }
.fq-recoil { animation:fq-recoil .45s; }
.fq-scan::after { content:'';position:absolute;inset:0;pointer-events:none;mix-blend-mode:overlay;opacity:.45;background:repeating-linear-gradient(0deg,rgba(0,0,0,.32) 0 1px,transparent 1px 3px); }
.fq-shake { animation:fq-shake .38s; }
`;

const PX = "'Press Start 2P', monospace";

function fmt(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface Particle { id: number; mx: string; my: string; color: string; }

export default function ActiveWorkout() {
  const navigate = useNavigate();
  const {
    session, phase, restKind, exerciseIndex, setIndex, bossMaxHp, bossHp,
    completed, result, isSubmitting, recordSet, skipExercise, resumeFromRest,
    pause, resume, abandon, quit, submit, elapsedSecs,
  } = useWorkoutStore();
  const user = useUserStore((s) => s.user);
  const bossKey = useSettingsStore((s) => s.boss);
  const weaponKey = useSettingsStore((s) => s.weapon);
  const autoAdvanceRest = useSettingsStore((s) => s.autoAdvanceRest);
  const exercises = useExerciseStore((s) => s.exercises);
  const fetchExercises = useExerciseStore((s) => s.fetchExercises);

  const [, forceTick] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [inputVal, setInputVal] = useState(0);
  const [striking, setStriking] = useState(false);
  const [combo, setCombo] = useState(0);
  const [displayHp, setDisplayHp] = useState(bossHp);
  const [floatDmg, setFloatDmg] = useState(0);
  const [surpass, setSurpass] = useState(false);
  const [hitKey, setHitKey] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [restRemaining, setRestRemaining] = useState(0);
  const [showBadges, setShowBadges] = useState(false);
  const [showEvolve, setShowEvolve] = useState(false);
  const restTotalRef = useRef(1);

  // Évolution d'avatar : le stade a-t-il franchi un palier sur cette séance ?
  const stageUp = !!result && getAvatarStage(result.user.level) > getAvatarStage(result.user.level - result.levelsGained);

  const cur = session?.exercises[exerciseIndex];
  const copy = cur ? typeCopy(cur.type) : typeCopy('reps');
  const clock = useMemo(() => new Date().toTimeString().slice(0, 5), []);
  const curExercise = useMemo(
    () => exercises.find((e) => e.id === cur?.exerciseId) ?? null,
    [exercises, cur?.exerciseId],
  );

  // Chrono : re-render chaque seconde.
  useEffect(() => {
    const id = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Catalogue d'exercices (pour la fiche info) — chargé si absent.
  useEffect(() => {
    if (exercises.length === 0) void fetchExercises();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync displayHp hors animation.
  useEffect(() => {
    if (!striking) setDisplayHp(bossHp);
  }, [bossHp, striking]);

  // Décompte de repos (Transition / Repos).
  useEffect(() => {
    if (phase !== 'rest' || !session) return;
    const total = restKind === 'transition'
      ? session.exercises[exerciseIndex].restBetweenSetsSeconds
      : (session.exercises[exerciseIndex - 1]?.restAfterExerciseSeconds ?? 20);
    restTotalRef.current = Math.max(1, total);
    setRestRemaining(total);
    const id = setInterval(() => {
      setRestRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          // Enchaînement auto seulement si activé dans les paramètres ;
          // sinon on reste à 0 en attendant que l'utilisateur appuie sur « Reprendre ».
          if (autoAdvanceRest) { playSound('resume'); resumeFromRest(); }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, exerciseIndex, setIndex, restKind]);

  // Soumission auto en fin de séance.
  useEffect(() => {
    if (phase === 'done' && !result && !isSubmitting) void submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Sons à l'apparition du résultat : victoire/fuite, puis level-up en bonus.
  // Les badges débloqués s'enchaînent APRÈS le level-up (séquençage des animations).
  useEffect(() => {
    if (!result) return;
    playSound(result.user ? (bossHp <= 0 ? 'victory' : 'flee') : 'victory');
    if (result.leveledUp) setTimeout(() => playSound('levelup'), 650);
    // Séquence : level-up inline → évolution d'avatar (si palier franchi) → badges.
    const delay = result.leveledUp ? 2000 : 850;
    if (stageUp) {
      const id = setTimeout(() => setShowEvolve(true), delay);
      return () => clearTimeout(id);
    }
    if (result.newBadges.length > 0) {
      const id = setTimeout(() => setShowBadges(true), delay);
      return () => clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  if (!session || !cur) return <Navigate to="/workout" replace />;

  const hpFrac = (striking ? displayHp : bossHp) / Math.max(1, bossMaxHp);
  const elapsed = elapsedSecs();
  const dealt = bossMaxHp - bossHp;

  function openConfirm() {
    if (!cur) return;
    setInputVal(cur.target);
    setConfirmOpen(true);
  }

  function spawnMagic(n: number) {
    const cols = ['#f59e0b', '#fcd34d', '#a78bfa', '#7dd3fc', '#fff3c4', '#fb7185'];
    const next: Particle[] = [];
    const count = Math.min(46, 22 + n * 3);
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = 70 + Math.random() * 150;
      next.push({ id: Date.now() + i, mx: `${Math.cos(ang) * dist}px`, my: `${Math.sin(ang) * dist}px`, color: cols[i % cols.length] });
    }
    setParticles(next);
    setTimeout(() => setParticles([]), 1400);
  }

  function doStrike(value: number) {
    if (!cur || striking) return;
    setConfirmOpen(false);
    const dmg = effortPoints(cur.type, value);
    const over = value > cur.target;
    const startHp = bossHp;
    setStriking(true);
    setSurpass(false);
    setCombo(0);
    setFloatDmg(dmg);
    setHitKey((k) => k + 1);
    let shown = 0;
    const stepMs = Math.max(28, 700 / Math.max(1, dmg));
    const iv = setInterval(() => {
      shown += 1;
      setCombo(shown);
      setDisplayHp(Math.max(0, startHp - shown));
      if (shown >= dmg) {
        clearInterval(iv);
        if (over) { setSurpass(true); spawnMagic(value - cur.target); }
        setTimeout(() => {
          setStriking(false);
          recordSet(value);
        }, over ? 900 : 550);
      }
    }, stepMs);
  }

  // ─── Sous-rendus ───
  const bossCanvas = (scale: number) => (
    <PixelCanvas
      key={`boss-${hitKey}`}
      className={`relative z-10 ${striking ? 'fq-recoil' : 'fq-idle'}`}
      render={(c) => renderBoss(c, bossKey, hpFrac, scale)}
      deps={[bossKey, Math.round(hpFrac * 100), scale, hitKey]}
    />
  );

  const setsRow = (
    <div className="flex justify-center gap-2">
      {Array.from({ length: cur.sets }).map((_, i) => (
        <div
          key={i}
          className={`grid h-8 w-8 place-items-center rounded-lg border text-xs font-bold ${
            i < setIndex
              ? 'border-success bg-success text-[#05260f]'
              : i === setIndex
                ? 'border-primary text-primary-soft shadow-[0_0_12px_-2px_var(--accent)]'
                : 'border-border bg-card text-muted-foreground'
          }`}
          style={{ fontFamily: "'Orbitron'" }}
        >
          {i < setIndex ? '✓' : i + 1}
        </div>
      ))}
    </div>
  );

  return (
    <div className={`fixed inset-0 z-[60] flex flex-col overflow-hidden text-foreground fq-scan ${striking ? 'fq-shake' : ''}`}
      style={{ background: 'radial-gradient(560px 440px at 50% 32%, rgba(239,68,68,.16), transparent 60%), radial-gradient(700px 400px at 50% 98%, rgba(99,102,241,.13), transparent 60%), #06060a' }}>
      <style>{CSS}</style>

      {/* HEADER */}
      <header
        className="z-20 flex items-center justify-between px-4 pb-2"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
      >
        <button onClick={pause} className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground">
          <Pause className="h-4 w-4" />
        </button>
        <div className="text-center">
          <div className="text-[10px]" style={{ fontFamily: PX }}>{session.sessionName.toUpperCase()}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            <span className="font-display text-cyan-300">⏱ {fmt(elapsed)}</span> · {clock}
          </div>
        </div>
        <div className="text-right font-display text-[11px] text-muted-foreground">
          Exo<b className="block text-sm text-foreground">{exerciseIndex + 1}/{session.exercises.length}</b>
        </div>
      </header>

      {/* segments exercices */}
      <div className="z-20 flex gap-1 px-4">
        {session.exercises.map((_, i) => (
          <div key={i} className="h-1.5 flex-1 overflow-hidden rounded bg-border">
            <div className="h-full" style={{
              width: i < exerciseIndex ? '100%' : i === exerciseIndex ? '50%' : '0%',
              background: i < exerciseIndex ? 'var(--success)' : 'linear-gradient(90deg,var(--danger),#fca5a5)',
            }} />
          </div>
        ))}
      </div>

      {/* BOSS HP */}
      <div className="z-20 px-4 pt-3">
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-[10px] text-red-300" style={{ fontFamily: PX }}>{session.bossTitle.toUpperCase()}</span>
          <span className="font-display text-xs text-muted-foreground"><b className="text-foreground">{striking ? displayHp : bossHp}</b> / {bossMaxHp} PV</span>
        </div>
        <div className="relative h-4 overflow-hidden border-2 bg-[#1a0d12]" style={{ borderColor: 'rgba(239,68,68,.5)' }}>
          <div className="h-full transition-[width] duration-200" style={{
            width: `${hpFrac * 100}%`,
            backgroundImage: 'linear-gradient(90deg,#ef4444,#f87171), repeating-linear-gradient(90deg, rgba(0,0,0,.18) 0 6px, transparent 6px 8px)',
          }} />
        </div>
      </div>

      {/* CORPS : grille responsive (desktop = panneaux latéraux) */}
      <div className="z-20 grid flex-1 grid-cols-1 lg:grid-cols-[260px_1fr_280px]">
        {/* Panneau gauche (desktop) : stats de séance */}
        <aside className="hidden flex-col gap-3 border-r border-border/60 p-5 lg:flex">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Combat</div>
          <StatLine label="Durée" value={fmt(elapsed)} />
          <StatLine label="Heure" value={clock} />
          <StatLine label="Dégâts infligés" value={`${dealt}`} accent />
          <StatLine label="Séries faites" value={`${completed.length}`} />
          <div className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">Dernier coup</div>
          <div className="font-display text-2xl text-primary-soft">{combo > 0 ? `×${combo}` : '—'}</div>
        </aside>

        {/* Arène centrale */}
        <main className="relative flex flex-col items-center justify-center">
          <div className="pointer-events-none absolute left-1/2 top-[44%] h-56 w-56 rounded-full" style={{ background: 'radial-gradient(circle, rgba(239,68,68,.20), transparent 62%)', animation: 'fq-pulse 3s ease-in-out infinite' }} />
          {/* Flash doré de surpassement */}
          {surpass && <div key={`sf-${hitKey}`} className="pointer-events-none absolute inset-0 z-20" style={{ background: 'radial-gradient(circle at 50% 44%, rgba(245,158,11,.5), transparent 60%)', animation: 'fq-flash 1s ease-out forwards' }} />}
          {surpass && <div className="absolute top-[4%] z-30 font-black text-xp" style={{ fontFamily: PX, fontSize: 16, left: '50%', textShadow: '0 0 16px rgba(245,158,11,1),2px 2px 0 #7f1d1d', animation: 'fq-surpass 1.5s ease-out' }}>✦ SURPASSEMENT ✦</div>}
          {combo > 0 && striking && <div className="absolute top-[12%] z-30 -translate-x-1/2 text-[15px] text-primary-soft" style={{ fontFamily: PX, left: '50%', textShadow: '2px 2px 0 #312e81' }}>COMBO x{combo}</div>}
          {striking && <div key={`f-${hitKey}`} className="absolute top-[24%] z-30 font-display text-2xl font-black text-xp" style={{ left: '55%', textShadow: '2px 2px 0 #7f1d1d', animation: 'fq-float 1.3s ease-out' }}>-{floatDmg}</div>}
          <div className="pointer-events-none absolute top-[42%] z-30" style={{ left: '50%' }}>
            {particles.map((p) => (
              <span key={p.id} className="absolute h-[10px] w-[10px]" style={{ background: p.color, boxShadow: `0 0 6px ${p.color}`, ['--mx' as string]: p.mx, ['--my' as string]: p.my, animation: 'fq-mp 1.1s ease-out forwards', imageRendering: 'pixelated' }} />
            ))}
          </div>
          {bossCanvas(11)}
          <div className="mt-1 h-3.5 w-36 rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(0,0,0,.55), transparent 70%)' }} />
          <div className="mt-3 text-[8px] tracking-wider text-red-300/80" style={{ fontFamily: PX }}>~ {session.bossTitle.toUpperCase()} ~</div>

          {/* armes POV */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between px-4">
            <PixelCanvas className="rotate-[10deg]" render={(c) => drawSprite(c, SHIELD, 6)} deps={[]} />
            <PixelCanvas className="-rotate-[12deg]" render={(c) => drawSprite(c, WEAPONS[weaponKey].sprite, WEAPONS[weaponKey].scale)} deps={[weaponKey]} />
          </div>
        </main>

        {/* Panneau droit (desktop) : liste des exercices */}
        <aside className="hidden flex-col gap-2 border-l border-border/60 p-5 lg:flex">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Séance</div>
          {session.exercises.map((ex, i) => {
            const isCurrent = i === exerciseIndex;
            const isDone = i < exerciseIndex;
            return (
              <div
                key={ex.sessionExerciseId}
                className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-all ${
                  isCurrent
                    ? 'border-primary bg-primary/15 text-foreground shadow-[0_0_16px_-4px_var(--accent)]'
                    : isDone
                      ? 'border-success/30 bg-success/5 text-muted-foreground'
                      : 'border-border text-muted-foreground'
                }`}
              >
                {/* Pastille d'état */}
                <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-black ${
                  isDone ? 'bg-success text-[#04250f]' : isCurrent ? 'bg-primary text-white' : 'border border-border text-muted-foreground'
                }`}>
                  {isDone ? '✓' : i + 1}
                </span>
                <span className={`flex-1 truncate ${isCurrent ? 'font-semibold' : ''}`}>{ex.name}</span>
                {isCurrent && <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-primary-soft">en cours</span>}
                <span className="ml-1 shrink-0 font-display text-[11px]">{ex.sets}×{ex.target}{ex.type === 'duration' ? 's' : ''}</span>
              </div>
            );
          })}
        </aside>
      </div>

      {/* EXERCICE COURANT (sous l'arène, toutes tailles) */}
      <div className="z-20 px-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="font-display text-xl font-bold">{cur.name}</div>
          {curExercise && (
            <button onClick={() => setInfoOpen(true)} title="Fiche de l'exercice"
              className="grid h-6 w-6 place-items-center rounded-full border border-border text-muted-foreground hover:text-primary">
              <Info className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="mt-1.5 flex items-center justify-center gap-3">
          <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary-soft">{cur.category.toUpperCase()}</span>
          <span className="text-[11px] font-bold text-muted-foreground">Série {setIndex + 1}/{cur.sets}</span>
        </div>
        {/* Objectif bien visible */}
        <div className="mt-2.5 inline-flex items-baseline gap-2 rounded-2xl border-2 px-6 py-2"
          style={cur.type === 'duration'
            ? { borderColor: 'rgba(34,211,238,.5)', background: 'rgba(34,211,238,.08)' }
            : { borderColor: 'rgba(255,255,255,.2)', background: 'rgba(255,255,255,.04)' }}>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Objectif</span>
          <span className="font-display text-5xl font-black leading-none"
            style={{ color: cur.type === 'duration' ? 'rgba(34,211,238,1)' : '#ffffff' }}>{cur.target}</span>
          <span className="text-sm font-bold text-muted-foreground">{cur.type === 'duration' ? 'sec' : 'reps'}</span>
        </div>
        <div className="mt-2.5">{setsRow}</div>
      </div>

      {/* FOOTER : XP + CTA */}
      <footer
        className="z-20 px-4 pt-3"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.25rem)' }}
      >
        <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
          <span>Niveau {user?.level ?? 1}</span>
          <span className="font-display text-xp">{dealt} pts d'effort</span>
        </div>
        <div className="mb-3 h-2 overflow-hidden border border-[#2a2d40] bg-border">
          <div className="h-full transition-[width] duration-700" style={{ width: `${levelProgressPct(user?.currentXP ?? 0, user?.level ?? 1)}%`, backgroundImage: 'linear-gradient(90deg,#b45309,var(--xp))' }} />
        </div>
        <button onClick={openConfirm} disabled={striking || phase !== 'fight'}
          className="flex h-14 w-full items-center justify-center gap-2 border-2 text-white disabled:opacity-50"
          style={{ fontFamily: PX, fontSize: 12, borderColor: '#fca5a5', background: 'linear-gradient(180deg,#ef4444,#991b1b)', boxShadow: '0 6px 0 #5b1212' }}>
          ⚔ {copy.cta}
        </button>
        <div className="mt-3 flex gap-2">
          <button onClick={() => setInfoOpen(true)} disabled={!curExercise}
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card text-xs font-semibold text-muted-foreground disabled:opacity-40">
            <Info className="h-4 w-4" /> Fiche
          </button>
          <button onClick={skipExercise} className="h-10 flex-1 rounded-xl border border-border bg-card text-xs font-semibold text-muted-foreground">Passer l'exo ▸</button>
        </div>
      </footer>

      {/* Fiche exercice */}
      {infoOpen && curExercise && (
        <ExerciseInfoModal exercise={curExercise} onClose={() => setInfoOpen(false)} />
      )}

      {/* CONFIRM */}
      {confirmOpen && (
        <Overlay>
          <div className="w-full max-w-sm rounded-2xl border-2 border-border p-6" style={{ background: 'linear-gradient(180deg,#12141d,#0c0d14)' }}>
            <h3 className="text-center text-[11px] leading-relaxed" style={{ fontFamily: PX }}>{copy.confirmTitle}</h3>
            <p className="mb-4 mt-2.5 text-center text-xs text-muted-foreground">{copy.confirmHint}</p>
            <div className="mb-1 flex items-center justify-center gap-4">
              <button onClick={() => setInputVal((v) => Math.max(0, v - 1))} className="grid h-14 w-14 place-items-center rounded-2xl border border-border bg-card text-2xl"><Minus className="h-6 w-6" /></button>
              <div className="min-w-[100px] text-center font-display text-5xl font-bold">{inputVal}</div>
              <button onClick={() => setInputVal((v) => v + 1)} className="grid h-14 w-14 place-items-center rounded-2xl border border-border bg-card text-2xl"><Plus className="h-6 w-6" /></button>
            </div>
            <div className="mb-3 text-center text-xs text-muted-foreground">{copy.unit} · cible {cur.target}</div>
            <div className="mb-4 text-center text-xs" style={{ color: inputVal > cur.target ? 'var(--accent-soft)' : inputVal === cur.target ? 'var(--success)' : 'var(--xp)' }}>
              {inputVal > cur.target ? `✦ Surpassement ! (+${inputVal - cur.target}) — magie bonus` : inputVal === cur.target ? '🎯 Objectif atteint' : '⚠️ Sous la cible — moins de dégâts'}
            </div>
            <button onClick={() => doStrike(inputVal)} className="h-14 w-full border-2 text-white" style={{ fontFamily: PX, fontSize: 12, borderColor: '#fca5a5', background: 'linear-gradient(180deg,#ef4444,#991b1b)', boxShadow: '0 5px 0 #5b1212' }}>⚔ PORTER LE COUP</button>
            <button onClick={() => setConfirmOpen(false)} className="mt-3 w-full text-xs text-muted-foreground">Annuler</button>
          </div>
        </Overlay>
      )}

      {/* REST */}
      {phase === 'rest' && (
        <Overlay blur>
          <div className="flex flex-col items-center gap-4 text-center">
            {restKind === 'repos' ? (
              <>
                <div style={{ fontFamily: PX, fontSize: 11, color: 'var(--xp)', textShadow: '0 0 10px rgba(245,158,11,.6)' }}>⚒ À LA FORGE</div>
                <Forge />
                <p className="-mt-1 text-xs italic text-muted-foreground">« Le forgeron répare ton bouclier… »</p>
              </>
            ) : (
              <div style={{ fontFamily: PX, fontSize: 11, color: 'var(--accent-soft)', textShadow: '0 0 10px rgba(167,139,250,.6)' }}>⏳ REPRENDS TON SOUFFLE</div>
            )}
            <RestRing remaining={restRemaining} total={restTotalRef.current} color={restKind === 'transition' ? '#a78bfa' : '#f59e0b'} />
            <div className="rounded-xl border border-border bg-card px-4 py-2.5">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Prochaine attaque</div>
              <div className="mt-0.5 font-display text-sm font-bold">Série {setIndex + 1} — {cur.name}</div>
            </div>
            <button onClick={() => { playSound('resume'); resumeFromRest(); }}
              className="rounded-xl border border-primary bg-primary px-8 py-3 font-display text-base font-bold text-white shadow-glow">
              Reprendre ⚔
            </button>
          </div>
        </Overlay>
      )}

      {/* PAUSE */}
      {phase === 'pause' && (
        <Overlay blur>
          <div className="flex flex-col items-center gap-5 text-center">
            <div style={{ fontFamily: PX, fontSize: 18 }}>⏸ EN PAUSE</div>
            <div className="font-display text-4xl text-cyan-300">{fmt(elapsed)}</div>
            <p className="text-xs text-muted-foreground">Chrono &amp; durée figés — prends ton temps</p>
            <div className="flex w-60 flex-col gap-2.5">
              <button onClick={resume} className="h-12 rounded-2xl border border-success bg-success font-display text-sm font-bold text-[#04250f]">▶ Reprendre</button>
              <button onClick={abandon} className="h-12 rounded-2xl border border-danger/40 font-display text-sm font-bold text-red-300">Abandonner</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* DONE : victoire / survie */}
      {phase === 'done' && (
        <Overlay blur>
          <div className="flex flex-col items-center gap-3 text-center">
            <PixelCanvas className={bossHp <= 0 ? 'rotate-90 opacity-30' : 'opacity-75'} render={(c) => renderBoss(c, bossKey, bossHp <= 0 ? 0.1 : 0.25, 8)} deps={[bossHp]} />
            <div style={{ fontFamily: PX, fontSize: 18, color: bossHp <= 0 ? 'var(--xp)' : 'var(--accent-soft)', textShadow: bossHp <= 0 ? '2px 2px 0 #7f1d1d' : 'none' }}>
              {bossHp <= 0 ? 'BOSS VAINCU !' : 'BIEN BATTU !'}
            </div>
            <p className="max-w-xs text-sm italic text-muted-foreground">
              {bossHp <= 0 ? '« Impossible… si fort… » — le boss s\'effondre.' : '« Je pars… mais on se reverra ! » — le boss s\'enfuit en boitant.'}
            </p>
            {isSubmitting && <div className="text-xs text-muted-foreground">Calcul des récompenses…</div>}
            {result && (
              <>
                {result.leveledUp && <LevelUpBurst level={result.user.level} gained={result.levelsGained} />}
                <div className="font-display text-2xl text-xp" style={{ animation: 'fq-xpcount .5s ease-out' }}>+{result.xpEarned} XP</div>
                <div className="mt-1 flex gap-3">
                  <ResultStat v={`${dealt}/${bossMaxHp}`} l="dégâts" />
                  <ResultStat v={`${completed.length}`} l="séries" />
                  <ResultStat v={fmt(elapsed)} l="durée" />
                </div>
              </>
            )}
            <button onClick={() => { quit(); navigate('/'); }} disabled={isSubmitting}
              className="mt-2 rounded-2xl border-none bg-gradient-to-br from-primary to-indigo-800 px-6 py-3 font-display text-sm font-bold text-white disabled:opacity-50">
              {result ? 'Récupérer le butin ▸' : '…'}
            </button>
          </div>
        </Overlay>
      )}

      {/* ÉVOLUTION D'AVATAR (palier franchi) — avant les badges */}
      {showEvolve && result && user && (
        <AvatarEvolveOverlay
          classKey={avatarClassFromStage(user.avatarStage)}
          level={result.user.level}
          onClose={() => {
            setShowEvolve(false);
            if (result.newBadges.length > 0) setShowBadges(true);
          }}
        />
      )}

      {/* DÉBLOCAGE DE BADGES (après le level-up / l'évolution le cas échéant) */}
      {showBadges && result && result.newBadges.length > 0 && (
        <BadgeUnlockOverlay badges={result.newBadges} onClose={() => setShowBadges(false)} />
      )}
    </div>
  );
}

function Overlay({ children, blur }: { children: React.ReactNode; blur?: boolean }) {
  return (
    <div className={`absolute inset-0 z-50 flex items-center justify-center px-5 ${blur ? 'backdrop-blur-md' : ''}`} style={{ background: blur ? 'rgba(8,8,13,.95)' : 'rgba(6,6,10,.6)' }}>
      {children}
    </div>
  );
}

function StatLine({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`font-display text-sm ${accent ? 'text-xp' : 'text-foreground'}`}>{value}</span>
    </div>
  );
}

function LevelUpBurst({ level, gained }: { level: number; gained: number }) {
  const sparks = Array.from({ length: 14 });
  return (
    <div className="relative my-1 grid place-items-center">
      {/* Flash plein écran */}
      <div className="pointer-events-none fixed inset-0 z-40" style={{ background: 'radial-gradient(circle at 50% 45%, rgba(245,158,11,.45), transparent 60%)', animation: 'fq-flash .6s ease-out forwards' }} />
      {/* Rayons dorés tournants */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64" style={{
        transformOrigin: 'center',
        background: 'repeating-conic-gradient(from 0deg, rgba(245,158,11,.18) 0deg 10deg, transparent 10deg 20deg)',
        borderRadius: '50%',
        animation: 'fq-rays 9s linear infinite',
        maskImage: 'radial-gradient(circle, #000 30%, transparent 72%)',
        WebkitMaskImage: 'radial-gradient(circle, #000 30%, transparent 72%)',
      }} />
      {/* Particules montantes */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-30">
        {sparks.map((_, i) => {
          const dx = (i - sparks.length / 2) * 12 + (Math.random() * 10 - 5);
          return (
            <span key={i} className="absolute h-[6px] w-[6px]" style={{
              left: `${dx}px`,
              background: ['#f59e0b', '#fcd34d', '#fff3c4'][i % 3],
              imageRendering: 'pixelated',
              animation: `fq-rise ${1 + (i % 5) * 0.18}s ease-out ${(i % 4) * 0.1}s infinite`,
            }} />
          );
        })}
      </div>
      {/* Texte */}
      <div className="relative z-30 flex flex-col items-center" style={{ animation: 'fq-lvlpop .6s cubic-bezier(.2,.8,.3,1.4)' }}>
        <div className="text-xp" style={{ fontFamily: PX, fontSize: 13, animation: 'fq-lvlglow 1.4s ease-in-out infinite' }}>★ LEVEL UP ★</div>
        <div className="mt-1.5 font-display text-3xl font-black text-primary-soft" style={{ textShadow: '0 0 14px rgba(99,102,241,.8)' }}>NIVEAU {level}</div>
        {gained > 1 && <div className="mt-0.5 text-[11px] font-bold text-xp">+{gained} niveaux d'un coup !</div>}
      </div>
    </div>
  );
}

function ResultStat({ v, l }: { v: string; l: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-2">
      <div className="font-display text-lg font-bold">{v}</div>
      <div className="mt-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">{l}</div>
    </div>
  );
}

function RestRing({ remaining, total, color }: { remaining: number; total: number; color: string }) {
  const r = 92;
  const sw = 13;
  const pad = 24; // marge pour que le glow ne soit pas rogné (plus de carré visible)
  const box = 2 * r + sw + pad * 2;
  const c = box / 2;
  const circ = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, remaining / Math.max(1, total)));
  return (
    <div className="relative grid place-items-center" style={{ width: box, height: box }}>
      <svg width={box} height={box} className="-rotate-90" style={{ overflow: 'visible' }}>
        <circle cx={c} cy={c} r={r} stroke="#1e2030" strokeWidth={sw} fill="none" />
        <circle cx={c} cy={c} r={r} stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - frac)} style={{ filter: `drop-shadow(0 0 10px ${color})`, transition: 'stroke-dashoffset 1s linear' }} />
      </svg>
      <div className="absolute font-display font-bold" style={{ fontSize: 56 }}>{fmt(remaining)}</div>
    </div>
  );
}

/** Scène de forge animée affichée pendant le repos entre exercices. */
function Forge() {
  const sparks = Array.from({ length: 9 });
  return (
    <div className="relative grid h-40 w-60 place-items-center">
      <div className="pointer-events-none absolute h-28 w-28 rounded-full" style={{ background: 'radial-gradient(circle, rgba(245,158,11,.35), transparent 65%)', animation: 'fq-pulse 1.1s ease-in-out infinite' }} />
      {/* Enclume */}
      <div className="absolute" style={{ bottom: 8 }}>
        <PixelCanvas render={(c) => drawSprite(c, ANVIL, 5)} deps={[]} />
      </div>
      {/* Marteau qui frappe (pivot bas) */}
      <div className="absolute" style={{ bottom: 64, left: '54%', transformOrigin: 'bottom center', animation: 'fq-hammer 1.1s ease-in-out infinite' }}>
        <PixelCanvas render={(c) => drawSprite(c, HAMMER, 4)} deps={[]} />
      </div>
      {/* Étincelles synchronisées sur l'impact (~0.75s) */}
      <div className="absolute" style={{ bottom: 58, left: '44%' }}>
        {sparks.map((_, i) => {
          const ang = (-15 - i * 17) * (Math.PI / 180);
          const d = 24 + (i % 3) * 9;
          return (
            <span key={i} className="absolute h-[5px] w-[5px]" style={{
              background: i % 2 ? '#fcd34d' : '#f59e0b',
              boxShadow: '0 0 5px #f59e0b',
              ['--sx' as string]: `${Math.cos(ang) * d}px`,
              ['--sy' as string]: `${-Math.abs(Math.sin(ang)) * d}px`,
              imageRendering: 'pixelated',
              animation: `fq-fspark 1.1s ease-out ${0.7}s infinite`,
            }} />
          );
        })}
      </div>
    </div>
  );
}
