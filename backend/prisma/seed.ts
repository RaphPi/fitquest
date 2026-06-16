/**
 * FitQuest — seed de la base.
 * Importe exercises_seed.json : 30 exercices + 3 programmes (avec séances + exercices de séance).
 *
 * NB : ce fichier est une copie synchronisée de la racine du dépôt (source de vérité)
 * afin d'être présent dans le contexte de build Docker du backend.
 */
import { PrismaClient } from '@prisma/client';
import seedJson from './exercises_seed.json';
import { BADGES } from '../src/lib/badges';

const prisma = new PrismaClient();

// ----- Types du fichier de seed ------------------------------
interface Localized {
  fr: string;
  en: string;
}

interface SeedExercise {
  id: string;
  name: Localized;
  category: string;
  muscles_primary: string[];
  muscles_secondary: string[];
  equipment: string;
  level: string;
  type: string;
  instructions: Localized;
  tips?: Localized;
  variations?: string[];
}

interface SeedSessionExercise {
  exercise_id: string;
  sets: number;
  reps?: number;
  duration_seconds?: number;
  rest_between_sets_seconds?: number;
  rest_seconds?: number; // ancien nom conservé pour compat seed existant
  rest_after_exercise_seconds?: number;
}

interface SeedSession {
  id: string;
  name: Localized;
  exercises: SeedSessionExercise[];
}

interface SeedProgram {
  id: string;
  name: Localized;
  description?: Localized;
  level: string;
  days_per_week: number;
  duration_weeks?: number;
  equipment?: string[];
  is_custom?: boolean;
  sessions: SeedSession[];
}

interface SeedData {
  version: string;
  exercises: SeedExercise[];
  programs: SeedProgram[];
}

const seed = seedJson as unknown as SeedData;

async function main(): Promise<void> {
  console.log('🌱 Seed FitQuest…');

  // ----- Exercices -------------------------------------------
  for (const ex of seed.exercises) {
    await prisma.exercise.upsert({
      where: { id: ex.id },
      update: {},
      create: {
        id: ex.id,
        nameFr: ex.name.fr,
        nameEn: ex.name.en,
        category: ex.category,
        musclesPrimary: ex.muscles_primary,
        musclesSecondary: ex.muscles_secondary,
        equipment: ex.equipment,
        level: ex.level,
        type: ex.type,
        instructionsFr: ex.instructions.fr,
        instructionsEn: ex.instructions.en,
        tipsFr: ex.tips?.fr ?? null,
        tipsEn: ex.tips?.en ?? null,
        variations: ex.variations ?? [],
      },
    });
  }
  console.log(`  ✔ ${seed.exercises.length} exercices`);

  // ----- Programmes + séances + exercices de séance ----------
  // On repart d'un état propre pour les programmes seed (idempotent).
  const seedProgramIds = seed.programs.map((p) => p.id);
  await prisma.session.deleteMany({ where: { programId: { in: seedProgramIds } } });
  await prisma.program.deleteMany({ where: { id: { in: seedProgramIds } } });

  for (const prog of seed.programs) {
    await prisma.program.create({
      data: {
        id: prog.id,
        nameFr: prog.name.fr,
        nameEn: prog.name.en,
        descFr: prog.description?.fr ?? null,
        descEn: prog.description?.en ?? null,
        level: prog.level,
        daysPerWeek: prog.days_per_week,
        durationWeeks: prog.duration_weeks ?? null,
        equipment: prog.equipment ?? [],
        isCustom: prog.is_custom ?? false,
        sessions: {
          create: prog.sessions.map((s, sIndex) => ({
            id: s.id,
            nameFr: s.name.fr,
            nameEn: s.name.en,
            order: sIndex,
            exercises: {
              create: s.exercises.map((e, eIndex) => ({
                exerciseId: e.exercise_id,
                order: eIndex,
                sets: e.sets,
                reps: e.reps ?? null,
                durationSeconds: e.duration_seconds ?? null,
                restBetweenSetsSeconds: e.rest_between_sets_seconds ?? e.rest_seconds ?? 60,
                restAfterExerciseSeconds: e.rest_after_exercise_seconds ?? 20,
              })),
            },
          })),
        },
      },
    });
  }
  console.log(`  ✔ ${seed.programs.length} programmes`);

  // ----- Badges (catalogue) ----------------------------------
  // Source de vérité = backend/src/lib/badges.ts. Upsert idempotent.
  for (const b of BADGES) {
    await prisma.badge.upsert({
      where: { id: b.id },
      update: {
        nameFr: b.nameFr, nameEn: b.nameEn,
        descFr: b.descFr, descEn: b.descEn,
        rarity: b.rarity, iconType: b.iconType,
        category: b.category, conditionType: b.conditionType,
        threshold: b.threshold, order: b.order,
      },
      create: {
        id: b.id,
        nameFr: b.nameFr, nameEn: b.nameEn,
        descFr: b.descFr, descEn: b.descEn,
        rarity: b.rarity, iconType: b.iconType,
        category: b.category, conditionType: b.conditionType,
        threshold: b.threshold, order: b.order,
      },
    });
  }
  console.log(`  ✔ ${BADGES.length} badges`);
  console.log('✅ Seed terminé.');
}

main()
  .catch((e) => {
    console.error('❌ Seed échoué :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
