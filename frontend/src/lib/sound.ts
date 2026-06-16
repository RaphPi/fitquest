// FitQuest — sons du mode séance (WebAudio, zéro asset).
// Tout passe par playSound() qui respecte le réglage « son activé » des paramètres.
import { useSettingsStore } from '@/stores/settingsStore';

type SoundName = 'victory' | 'levelup' | 'resume' | 'flee' | 'badge';

interface Note { freq: number; t: number; dur: number; type?: OscillatorType; gain?: number; }

// Petites partitions (fréquences en Hz, temps/durée en secondes).
const SCORES: Record<SoundName, Note[]> = {
  // Fanfare de victoire : montée majeure + accord final tenu.
  victory: [
    { freq: 392.0, t: 0.0, dur: 0.13, type: 'square' },
    { freq: 523.25, t: 0.12, dur: 0.13, type: 'square' },
    { freq: 659.25, t: 0.24, dur: 0.13, type: 'square' },
    { freq: 783.99, t: 0.36, dur: 0.34, type: 'square' },
    { freq: 523.25, t: 0.36, dur: 0.34, type: 'triangle', gain: 0.12 },
    { freq: 1046.5, t: 0.36, dur: 0.34, type: 'triangle', gain: 0.1 },
  ],
  // Scintillement de montée de niveau : arpège brillant aigu.
  levelup: [
    { freq: 659.25, t: 0.0, dur: 0.1, type: 'square' },
    { freq: 880.0, t: 0.09, dur: 0.1, type: 'square' },
    { freq: 1046.5, t: 0.18, dur: 0.1, type: 'square' },
    { freq: 1318.5, t: 0.27, dur: 0.32, type: 'square' },
    { freq: 1567.98, t: 0.34, dur: 0.3, type: 'triangle', gain: 0.1 },
  ],
  // Reprise après repos : deux bips clairs ascendants.
  resume: [
    { freq: 880.0, t: 0.0, dur: 0.1, type: 'square' },
    { freq: 1174.66, t: 0.11, dur: 0.16, type: 'square' },
  ],
  // Le boss s'enfuit (survie) : deux notes descendantes.
  flee: [
    { freq: 440.0, t: 0.0, dur: 0.14, type: 'sawtooth', gain: 0.12 },
    { freq: 311.13, t: 0.14, dur: 0.24, type: 'sawtooth', gain: 0.12 },
  ],
  // Badge débloqué : carillon « trophée » — quinte montante + accord cristallin tenu.
  badge: [
    { freq: 587.33, t: 0.0, dur: 0.12, type: 'triangle' },
    { freq: 880.0, t: 0.1, dur: 0.12, type: 'triangle' },
    { freq: 1174.66, t: 0.22, dur: 0.4, type: 'triangle' },
    { freq: 1760.0, t: 0.26, dur: 0.36, type: 'sine', gain: 0.1 },
    { freq: 2349.32, t: 0.3, dur: 0.32, type: 'sine', gain: 0.07 },
  ],
};

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Joue un son nommé si le son est activé dans les paramètres. */
export function playSound(name: SoundName): void {
  if (!useSettingsStore.getState().soundEnabled) return;
  const audio = getCtx();
  if (!audio) return;
  const now = audio.currentTime;
  for (const n of SCORES[name]) {
    const osc = audio.createOscillator();
    const g = audio.createGain();
    osc.type = n.type ?? 'square';
    osc.frequency.value = n.freq;
    const peak = n.gain ?? 0.18;
    const start = now + n.t;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(peak, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, start + n.dur);
    osc.connect(g).connect(audio.destination);
    osc.start(start);
    osc.stop(start + n.dur + 0.02);
  }
}
