// Fiche exercice en lecture seule, utilisée depuis le builder de programme.
import { X, Info, Lightbulb, Link2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { Exercise, Category, Level } from '@/types';

interface ExerciseInfoModalProps {
  exercise: Exercise;
  onClose: () => void;
}

const categoryColors: Record<Category, string> = {
  push: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  pull: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  legs: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  core: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  cardio: 'bg-red-500/20 text-red-300 border-red-500/30',
  back: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
};
const levelColors: Record<Level, string> = {
  beginner: 'text-emerald-400', intermediate: 'text-amber-400', advanced: 'text-red-400',
};

export default function ExerciseInfoModal({ exercise, onClose }: ExerciseInfoModalProps) {
  const { t } = useTranslation();
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/75 p-4 sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <span className={cn('rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider', categoryColors[exercise.category])}>
                {t(`library.category.${exercise.category}`)}
              </span>
              <span className={cn('text-[11px] font-semibold uppercase tracking-wider self-center', levelColors[exercise.level as Level])}>
                {t(`library.level.${exercise.level}`)}
              </span>
            </div>
            <h2 className="font-display text-xl font-black text-foreground">{exercise.nameFr}</h2>
            <p className="text-xs italic text-muted-foreground">{exercise.nameEn}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-border hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>{t(`library.equipment.${exercise.equipment}`)}</span>
            <span>{t(`library.type.${exercise.type}`)}</span>
          </div>

          {/* Muscles */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('library.detail.muscles')}</p>
            <div className="flex flex-wrap gap-1.5">
              {exercise.musclesPrimary.map((m) => (
                <span key={m} className="rounded-md bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">{m}</span>
              ))}
              {exercise.musclesSecondary.map((m) => (
                <span key={m} className="rounded-md bg-border px-2 py-0.5 text-xs text-muted-foreground">{m}</span>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Info className="h-4 w-4 text-primary" />
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('library.detail.instructions')}</p>
            </div>
            <p className="text-sm leading-relaxed text-foreground">{exercise.instructionsFr}</p>
          </div>

          {/* Tips */}
          {exercise.tipsFr && (
            <div className="space-y-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <div className="flex items-center gap-1.5">
                <Lightbulb className="h-4 w-4 text-amber-400" />
                <p className="text-xs font-bold uppercase tracking-widest text-amber-400">{t('library.detail.tips')}</p>
              </div>
              <p className="text-sm leading-relaxed text-foreground">{exercise.tipsFr}</p>
            </div>
          )}

          {exercise.variations.length > 0 && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Link2 className="h-4 w-4" />
              <p className="text-xs">{t('library.detail.variations', { count: exercise.variations.length })}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <button
            onClick={onClose}
            className="w-full rounded-lg border border-border py-2 text-sm font-semibold text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
          >
            {t('library.detail.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
