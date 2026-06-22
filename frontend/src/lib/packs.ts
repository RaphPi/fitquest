export interface PackMeta {
  id: string;
  nameFr: string;
  nameEn: string;
  descFr: string;
  descEn: string;
  goals: string[];
  level: "beginner" | "intermediate" | "advanced";
  equipment: string[];
  daysPerWeek: number;
  durationWeeks: number | null;
  url: string;
}

const BASE =
  "https://raw.githubusercontent.com/RaphPi/fitquest/main/packs";

export const PACKS: PackMeta[] = [
  {
    id: "remise_en_forme_debutant",
    nameFr: "Départ Zéro — Full Body 3j",
    nameEn: "Zero Start — Full Body 3d",
    descFr: "Programme pour (re)démarrer l'activité physique. 3 séances de 30 min par semaine, poids du corps.",
    descEn: "Program to (re)start physical activity. 3×30-min sessions per week, bodyweight.",
    goals: ["remise_en_forme"],
    level: "beginner",
    equipment: ["none"],
    daysPerWeek: 3,
    durationWeeks: 8,
    url: `${BASE}/remise_en_forme_debutant.json`,
  },
  {
    id: "forme_generale_equilibre",
    nameFr: "Équilibre Total — Full Body 3j",
    nameEn: "Total Balance — Full Body 3d",
    descFr: "Programme d'équilibre complet : force, endurance, mobilité. 3 séances de 40 min, poids du corps.",
    descEn: "Complete balance program: strength, endurance, mobility. 3×40-min sessions, bodyweight.",
    goals: ["forme_generale"],
    level: "intermediate",
    equipment: ["none"],
    daysPerWeek: 3,
    durationWeeks: 12,
    url: `${BASE}/forme_generale_equilibre.json`,
  },
  {
    id: "perte_de_gras_circuit",
    nameFr: "Brûle-Graisse — Circuit 3j",
    nameEn: "Fat Burner — Circuit 3d",
    descFr: "Circuit haute intensité pour maximiser la dépense calorique. 3 séances de 35 min, poids du corps.",
    descEn: "High-intensity circuit to maximize calorie burn. 3×35-min sessions, bodyweight.",
    goals: ["perte_de_gras"],
    level: "intermediate",
    equipment: ["none"],
    daysPerWeek: 3,
    durationWeeks: 8,
    url: `${BASE}/perte_de_gras_circuit.json`,
  },
  {
    id: "perte_de_gras_hiit",
    nameFr: "Métabolisme Max — HIIT 4j",
    nameEn: "Max Metabolism — HIIT 4d",
    descFr: "HIIT explosif + renforcement. 4 séances par semaine pour maximiser la dépense tout en conservant le muscle.",
    descEn: "Explosive HIIT + strength. 4 sessions/week to maximize burn while preserving muscle.",
    goals: ["perte_de_gras", "endurance"],
    level: "intermediate",
    equipment: ["none"],
    daysPerWeek: 4,
    durationWeeks: 8,
    url: `${BASE}/perte_de_gras_hiit.json`,
  },
  {
    id: "endurance_hautes_reps",
    nameFr: "Endurance Musculaire — Hautes Reps",
    nameEn: "Muscular Endurance — High Reps",
    descFr: "Volume élevé de répétitions avec peu de repos. Développe la résistance à la fatigue. 3 séances de 40 min.",
    descEn: "High rep volume with minimal rest. Builds fatigue resistance. 3×40-min sessions.",
    goals: ["endurance"],
    level: "intermediate",
    equipment: ["none"],
    daysPerWeek: 3,
    durationWeeks: 8,
    url: `${BASE}/endurance_hautes_reps.json`,
  },
  {
    id: "endurance_upper_lower",
    nameFr: "Cardio-Force — Upper/Lower 4j",
    nameEn: "Cardio-Strength — Upper/Lower 4d",
    descFr: "Split Upper/Lower 4j alliant renforcement et endurance cardio. Alternance pour une récupération optimale.",
    descEn: "4-day Upper/Lower split combining strength and cardio endurance. Optimal recovery alternation.",
    goals: ["endurance", "forme_generale"],
    level: "intermediate",
    equipment: ["none"],
    daysPerWeek: 4,
    durationWeeks: 8,
    url: `${BASE}/endurance_upper_lower.json`,
  },
  {
    id: "force_5x5_bodyweight",
    nameFr: "Force 5×5 — Poids du Corps",
    nameEn: "Strength 5×5 — Bodyweight",
    descFr: "Schème 5×5 au poids du corps avec longs temps de repos. Force pure, progression sur 12 semaines.",
    descEn: "5×5 scheme with bodyweight and long rest periods. Pure strength, 12-week progression.",
    goals: ["force"],
    level: "intermediate",
    equipment: ["none"],
    daysPerWeek: 3,
    durationWeeks: 12,
    url: `${BASE}/force_5x5_bodyweight.json`,
  },
  {
    id: "force_avec_equipement",
    nameFr: "Force + Équipement — Push/Pull/Legs",
    nameEn: "Strength + Equipment — Push/Pull/Legs",
    descFr: "PPL avec barre de traction et haltères. Mouvements composés lourds, 3 séances par semaine.",
    descEn: "PPL with pull-up bar and dumbbells. Heavy compound movements, 3 sessions/week.",
    goals: ["force", "prise_de_masse"],
    level: "intermediate",
    equipment: ["pull_bar", "dumbbells"],
    daysPerWeek: 3,
    durationWeeks: 12,
    url: `${BASE}/force_avec_equipement.json`,
  },
  {
    id: "masse_ppl_barre",
    nameFr: "Hypertrophie — Push/Pull/Legs Barre",
    nameEn: "Hypertrophy — Push/Pull/Legs Bar",
    descFr: "PPL classique pour la prise de masse. 8-12 reps, barre de traction requise. 3 séances par semaine.",
    descEn: "Classic PPL for muscle mass. 8-12 reps, pull-up bar required. 3 sessions/week.",
    goals: ["prise_de_masse"],
    level: "intermediate",
    equipment: ["pull_bar"],
    daysPerWeek: 3,
    durationWeeks: 12,
    url: `${BASE}/masse_ppl_barre.json`,
  },
  {
    id: "masse_full_body_4j",
    nameFr: "Volume & Fréquence — Full Body 4j",
    nameEn: "Volume & Frequency — Full Body 4d",
    descFr: "Full Body haute fréquence A/B : chaque groupe musculaire 2×/semaine. 4 séances, poids du corps.",
    descEn: "High-frequency A/B Full Body: each muscle group 2×/week. 4 sessions, bodyweight.",
    goals: ["prise_de_masse", "force"],
    level: "intermediate",
    equipment: ["none"],
    daysPerWeek: 4,
    durationWeeks: 12,
    url: `${BASE}/masse_full_body_4j.json`,
  },
];
