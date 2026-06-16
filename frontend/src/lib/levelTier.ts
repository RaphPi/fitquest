// FitQuest — paliers de niveau avec couleurs et glow RPG.

export interface LevelTier {
  name: string;
  color: string;        // rgba() texte/bordure
  colorLight: string;   // rgba() glow subtil
  glowColor: string;    // rgba() shadow-glow
  gradient: {
    from: string;       // gradient XPBar from
    to: string;         // gradient XPBar to
  };
}

const TIERS: Record<string, LevelTier> = {
  bronze: {
    name: 'Bronze',
    color: 'rgba(168, 120, 80, 1)',           // bronze foncé
    colorLight: 'rgba(205, 155, 115, 0.6)',   // bronze clair
    glowColor: 'rgba(168, 120, 80, 0.5)',     // glow bronze
    gradient: {
      from: 'rgba(168, 120, 80, 1)',
      to: 'rgba(205, 155, 115, 1)',
    },
  },
  silver: {
    name: 'Argent',
    color: 'rgba(192, 204, 218, 1)',          // argent
    colorLight: 'rgba(221, 229, 240, 0.6)',   // argent clair
    glowColor: 'rgba(192, 204, 218, 0.5)',    // glow argent
    gradient: {
      from: 'rgba(192, 204, 218, 1)',
      to: 'rgba(221, 229, 240, 1)',
    },
  },
  gold: {
    name: 'Or',
    color: 'rgba(234, 179, 8, 1)',            // or (match xp existing)
    colorLight: 'rgba(253, 224, 71, 0.6)',    // or clair
    glowColor: 'rgba(234, 179, 8, 0.6)',      // glow or
    gradient: {
      from: 'rgba(234, 179, 8, 1)',
      to: 'rgba(253, 224, 71, 1)',
    },
  },
  emerald: {
    name: 'Émeraude',
    color: 'rgba(16, 185, 129, 1)',           // émeraude
    colorLight: 'rgba(110, 227, 160, 0.6)',   // émeraude clair
    glowColor: 'rgba(16, 185, 129, 0.6)',     // glow émeraude
    gradient: {
      from: 'rgba(16, 185, 129, 1)',
      to: 'rgba(110, 227, 160, 1)',
    },
  },
  diamond: {
    name: 'Diamant',
    color: 'rgba(34, 211, 238, 1)',           // cyan (match durations existing)
    colorLight: 'rgba(165, 243, 252, 0.6)',   // cyan clair
    glowColor: 'rgba(34, 211, 238, 0.6)',     // glow diamond
    gradient: {
      from: 'rgba(34, 211, 238, 1)',
      to: 'rgba(165, 243, 252, 1)',
    },
  },
};

export function getLevelTier(level: number): LevelTier {
  if (level < 10) return TIERS.bronze;
  if (level < 20) return TIERS.silver;
  if (level < 35) return TIERS.gold;
  if (level < 50) return TIERS.emerald;
  return TIERS.diamond;
}
