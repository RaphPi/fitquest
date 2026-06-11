import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/stores/userStore';
import type { DigestFrequency } from '@/types';

/* ── Avatar choices ─────────────────────────────────────────── */
import warriorSvg from '@/assets/avatars/warrior.svg';
import archerSvg from '@/assets/avatars/archer.svg';
import mageSvg from '@/assets/avatars/mage.svg';
import knightSvg from '@/assets/avatars/knight.svg';

const AVATARS = [
  { id: 0, label: 'Guerrier', src: warriorSvg },
  { id: 1, label: 'Archer', src: archerSvg },
  { id: 2, label: 'Mage', src: mageSvg },
  { id: 3, label: 'Chevalier', src: knightSvg },
];

const LEVELS = [
  { value: 'novice', label: 'Novice', desc: 'Je débute, tout est nouveau pour moi' },
  { value: 'warrior', label: 'Guerrier en devenir', desc: 'Quelques bases, prêt à progresser' },
  { value: 'fighter', label: 'Combattant', desc: 'Expérimenté, je cherche à repousser mes limites' },
];

const DIGESTS: { value: DigestFrequency; label: string }[] = [
  { value: 'NONE', label: 'Jamais' },
  { value: 'WEEKLY', label: 'Hebdomadaire' },
  { value: 'MONTHLY', label: 'Mensuel' },
];

/* ── Password strength ──────────────────────────────────────── */
function passwordStrength(pw: string): { score: number; label: string; color: string } {
  if (pw.length === 0) return { score: 0, label: '', color: '' };
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return { score: s, label: 'Faible', color: '#ef4444' };
  if (s <= 3) return { score: s, label: 'Moyen', color: '#f59e0b' };
  return { score: s, label: 'Fort', color: '#22c55e' };
}

/* ── Step indicator ─────────────────────────────────────────── */
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-1.5 rounded-full transition-all duration-500"
          style={{
            width: i === current ? 24 : 8,
            background: i <= current ? '#6366f1' : '#1e2030',
          }}
        />
      ))}
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */
export default function Register() {
  const { register, isLoading, error, clearError } = useUserStore();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);

  // Form state
  const [username, setUsername] = useState('');
  const [avatarStage, setAvatarStage] = useState(0);
  const [_level, setLevel] = useState('novice');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [emailDigest, setEmailDigest] = useState<DigestFrequency>('NONE');

  const strength = passwordStrength(password);

  function next() {
    clearError();
    setStep((s) => s + 1);
  }
  function back() {
    clearError();
    setStep((s) => s - 1);
  }

  async function handleSubmit() {
    clearError();
    try {
      await register({
        username,
        password,
        email: email || undefined,
        emailDigest: emailDigest !== 'NONE' ? emailDigest : undefined,
        avatarStage,
      });
      setFinishing(true);
      setTimeout(() => navigate('/', { replace: true }), 2000);
    } catch {
      // error shown via store
    }
  }

  /* ── Finishing animation ───────────────────────────────────── */
  if (finishing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f]">
        <div className="animate-pulse text-center">
          <p className="font-display text-2xl font-bold tracking-widest text-[#a78bfa]">
            Ton aventure commence…
          </p>
          <p className="mt-2 text-sm text-[#6366f1]">LEVEL UP !</p>
        </div>
      </div>
    );
  }

  /* ── Shared wrapper ────────────────────────────────────────── */
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f] px-4">
      <div className="mb-6 text-center">
        <h1 className="font-display text-3xl font-thin tracking-[0.3em] text-white">
          FIT<span className="font-black text-[#a78bfa]">QUEST</span>
        </h1>
      </div>

      <div className="w-full max-w-md rounded-xl border border-[#1e2030] bg-[#0f1117] p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <StepDots current={step} total={4} />
          <span className="text-xs text-[#64748b]">Étape {step + 1} / 4</span>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 px-4 py-2 text-sm text-[#ef4444]">
            {error}
          </div>
        )}

        {/* ── Step 0 : Username ─────────────────────────────── */}
        {step === 0 && (
          <div>
            <h2 className="mb-1 font-display text-xl font-bold text-white">
              Qui es-tu, héros ?
            </h2>
            <p className="mb-6 text-sm text-[#64748b]">Choisis ton nom d'aventurier</p>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
              autoFocus
              placeholder="ton_pseudo"
              className="w-full rounded-lg border border-[#1e2030] bg-[#0d0b1e] px-4 py-3 text-white outline-none transition
                placeholder-[#64748b]
                focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/40
                [animation:pulse-border_2s_ease-in-out_infinite]"
              style={{
                boxShadow: username.length >= 3 ? '0 0 0 2px #6366f140' : undefined,
              }}
            />
            <p className="mt-1 text-right text-xs text-[#64748b]">{username.length}/20</p>
            <button
              onClick={next}
              disabled={username.length < 3}
              className="mt-6 w-full rounded-lg bg-[#6366f1] py-3 font-display text-sm font-bold uppercase tracking-widest text-white transition hover:bg-[#4f46e5] disabled:opacity-40"
            >
              Continuer →
            </button>
          </div>
        )}

        {/* ── Step 1 : Avatar ───────────────────────────────── */}
        {step === 1 && (
          <div>
            <h2 className="mb-1 font-display text-xl font-bold text-white">
              Choisis ton avatar
            </h2>
            <p className="mb-6 text-sm text-[#64748b]">Qui représente le mieux ton style ?</p>
            <div className="grid grid-cols-4 gap-3">
              {AVATARS.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setAvatarStage(av.id)}
                  className="flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition"
                  style={{
                    borderColor: avatarStage === av.id ? '#6366f1' : '#1e2030',
                    background: avatarStage === av.id ? '#0d0b1e' : 'transparent',
                    boxShadow: avatarStage === av.id ? '0 0 18px #6366f150' : undefined,
                  }}
                >
                  <img
                    src={av.src}
                    alt={av.label}
                    className="h-14 w-auto"
                    style={{ color: avatarStage === av.id ? '#a78bfa' : '#64748b' }}
                  />
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: avatarStage === av.id ? '#a78bfa' : '#64748b' }}
                  >
                    {av.label}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={back} className="flex-1 rounded-lg border border-[#1e2030] py-3 text-sm text-[#64748b] hover:border-[#6366f1] hover:text-white transition">
                ← Retour
              </button>
              <button onClick={next} className="flex-1 rounded-lg bg-[#6366f1] py-3 font-display text-sm font-bold uppercase tracking-widest text-white hover:bg-[#4f46e5] transition">
                Continuer →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2 : Level ────────────────────────────────── */}
        {step === 2 && (
          <div>
            <h2 className="mb-1 font-display text-xl font-bold text-white">
              Quel est ton niveau ?
            </h2>
            <p className="mb-6 text-sm text-[#64748b]">Sois honnête, ça aide à progresser !</p>
            <div className="space-y-3">
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => setLevel(l.value)}
                  className="w-full rounded-xl border-2 p-4 text-left transition"
                  style={{
                    borderColor: _level === l.value ? '#6366f1' : '#1e2030',
                    background: _level === l.value ? '#0d0b1e' : 'transparent',
                    boxShadow: _level === l.value ? '0 0 16px #6366f140' : undefined,
                  }}
                >
                  <p
                    className="font-display font-bold"
                    style={{ color: _level === l.value ? '#a78bfa' : '#f1f5f9' }}
                  >
                    {l.label}
                  </p>
                  <p className="mt-0.5 text-xs text-[#64748b]">{l.desc}</p>
                </button>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={back} className="flex-1 rounded-lg border border-[#1e2030] py-3 text-sm text-[#64748b] hover:border-[#6366f1] hover:text-white transition">
                ← Retour
              </button>
              <button onClick={next} className="flex-1 rounded-lg bg-[#6366f1] py-3 font-display text-sm font-bold uppercase tracking-widest text-white hover:bg-[#4f46e5] transition">
                Continuer →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3 : Password + email ─────────────────────── */}
        {step === 3 && (
          <div>
            <h2 className="mb-1 font-display text-xl font-bold text-white">
              Finalise ton profil
            </h2>
            <p className="mb-6 text-sm text-[#64748b]">Plus qu'un dernier effort !</p>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-widest text-[#64748b]">
                  Mot de passe *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="min. 8 caractères"
                  className="w-full rounded-lg border border-[#1e2030] bg-[#0d0b1e] px-4 py-3 text-sm text-white placeholder-[#64748b] outline-none transition focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]"
                />
                {password.length > 0 && (
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex flex-1 gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{ background: i <= strength.score ? strength.color : '#1e2030' }}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-medium" style={{ color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-widest text-[#64748b]">
                  Email <span className="normal-case text-[#64748b]/60">(optionnel)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="hero@exemple.com"
                  className="w-full rounded-lg border border-[#1e2030] bg-[#0d0b1e] px-4 py-3 text-sm text-white placeholder-[#64748b] outline-none transition focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]"
                />
              </div>

              {email && (
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-widest text-[#64748b]">
                    Synthèse par email
                  </label>
                  <div className="flex gap-2">
                    {DIGESTS.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => setEmailDigest(d.value)}
                        className="flex-1 rounded-lg border py-2 text-xs font-medium transition"
                        style={{
                          borderColor: emailDigest === d.value ? '#6366f1' : '#1e2030',
                          background: emailDigest === d.value ? '#0d0b1e' : 'transparent',
                          color: emailDigest === d.value ? '#a78bfa' : '#64748b',
                        }}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={back} className="flex-1 rounded-lg border border-[#1e2030] py-3 text-sm text-[#64748b] hover:border-[#6366f1] hover:text-white transition">
                ← Retour
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading || password.length < 8}
                className="flex-1 rounded-lg bg-[#6366f1] py-3 font-display text-sm font-bold uppercase tracking-widest text-white transition hover:bg-[#4f46e5] disabled:opacity-40"
              >
                {isLoading ? 'Création…' : '⚔ Créer mon héros'}
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-5 text-sm text-[#64748b]">
        Déjà un compte ?{' '}
        <a href="/login" className="text-[#a78bfa] hover:underline">
          Se connecter
        </a>
      </p>
    </div>
  );
}
