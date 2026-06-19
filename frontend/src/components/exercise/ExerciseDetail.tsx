import { useState } from 'react';
import { X, Dumbbell, User, Zap, Info, Lightbulb, Link2, Pencil, Trash2, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { Exercise, Category, Equipment, Level } from '@/types';
import type { ExercisePR } from '@/stores/exerciseStore';
import GlowButton from '@/components/ui/GlowButton';

interface ExerciseDetailProps {
  exercise: Exercise;
  pr?: ExercisePR;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

const categoryColors: Record<Category, string> = {
  push: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  pull: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  legs: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  core: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  cardio: 'bg-red-500/20 text-red-300 border-red-500/30',
  back: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
};

const equipmentIcons: Record<Equipment, typeof Dumbbell> = {
  none: User, dumbbells: Dumbbell, barbell: Dumbbell, pull_bar: Zap, other: Dumbbell,
};

const levelColors: Record<Level, string> = {
  beginner: 'text-emerald-400', intermediate: 'text-amber-400', advanced: 'text-red-400',
};

export default function ExerciseDetail({ exercise, pr, onClose, onEdit, onDelete, isDeleting }: ExerciseDetailProps) {
  const { t } = useTranslation();
  const EquipIcon = equipmentIcons[exercise.equipment];
  const [confirmDelete, setConfirmDelete] = useState(false);

  const hasPr = !!pr && ((pr.maxWeightKg != null && pr.maxWeightKg > 0) || (pr.maxReps != null && pr.maxReps > 0));

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <span className={cn('rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider', categoryColors[exercise.category])}>
                {t(`library.category.${exercise.category}`)}
              </span>
              <span className={cn('text-[11px] font-semibold uppercase tracking-wider self-center', levelColors[exercise.level])}>
                {t(`library.level.${exercise.level}`)}
              </span>
            </div>
            <h2 className="font-display text-xl font-black text-foreground">{exercise.nameFr}</h2>
            <p className="text-xs text-muted-foreground italic">{exercise.nameEn}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-border hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Meta */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <EquipIcon className="h-4 w-4" />
              <span>{t(`library.equipment.${exercise.equipment}`)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="font-semibold text-foreground">{t('library.detail.type')}</span>
              <span>{t(`library.type.${exercise.type}`)}</span>
            </div>
          </div>

          {/* Records personnels */}
          {hasPr && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Trophy className="h-4 w-4 text-amber-400" />
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t('library.detail.personalRecords')}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {pr!.maxWeightKg != null && pr!.maxWeightKg > 0 && (
                  <div className="flex flex-col items-center rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2">
                    <span className="font-display text-xl font-black leading-none text-amber-300">{pr!.maxWeightKg} kg</span>
                    <span className="text-xs text-muted-foreground">{t('library.detail.maxWeight')}</span>
                  </div>
                )}
                {pr!.maxReps != null && pr!.maxReps > 0 && (
                  <div className="flex flex-col items-center rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2">
                    <span className="font-display text-xl font-black leading-none text-amber-300">{pr!.maxReps}</span>
                    <span className="text-xs text-muted-foreground">{t('library.detail.maxReps')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Muscles */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t('library.detail.muscles')}</p>
            <div className="space-y-1">
              <div className="flex flex-wrap gap-1.5">
                {exercise.musclesPrimary.map((m) => (
                  <span key={m} className="rounded-md bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">{m}</span>
                ))}
              </div>
              {exercise.musclesSecondary.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {exercise.musclesSecondary.map((m) => (
                    <span key={m} className="rounded-md bg-border px-2 py-0.5 text-xs text-muted-foreground">{m}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Info className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t('library.detail.instructions')}</p>
            </div>
            <p className="text-sm leading-relaxed text-foreground">{exercise.instructionsFr}</p>
          </div>

          {/* Tips */}
          {exercise.tipsFr && (
            <div className="space-y-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <div className="flex items-center gap-1.5">
                <Lightbulb className="h-4 w-4 text-amber-400" />
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">{t('library.detail.tips')}</p>
              </div>
              <p className="text-sm leading-relaxed text-foreground">{exercise.tipsFr}</p>
            </div>
          )}

          {/* Variations */}
          {exercise.variations.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {t('library.detail.variations', { count: exercise.variations.length })}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 border-t border-border p-4">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all',
              confirmDelete
                ? 'border-danger/60 bg-danger/15 text-red-400 hover:bg-danger/25'
                : 'border-border text-muted-foreground hover:border-danger/40 hover:text-red-400',
            )}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {confirmDelete ? t('library.detail.confirmDelete') : t('library.detail.delete')}
          </button>
          {confirmDelete && (
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
            >
              {t('library.detail.cancel')}
            </button>
          )}
          <div className="flex-1" />
          <GlowButton variant="primary" size="sm" onClick={onEdit}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            {t('library.detail.edit')}
          </GlowButton>
          <GlowButton variant="primary" size="sm" onClick={onClose} className="bg-transparent border-border text-muted-foreground hover:text-foreground hover:shadow-none">
            {t('library.detail.close')}
          </GlowButton>
        </div>
      </div>
    </div>
  );
}
