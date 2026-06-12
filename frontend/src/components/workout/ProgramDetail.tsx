import { useEffect, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight, Dumbbell, Timer, Pencil, Trash2, Plus } from 'lucide-react';
import { useProgramStore } from '@/stores/programStore';
import { useExerciseStore } from '@/stores/exerciseStore';
import type { Program, WorkoutSession, Level } from '@/types';
import GlowButton from '@/components/ui/GlowButton';

interface ProgramDetailProps {
  program: Program;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const levelLabels: Record<Level, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
};

export default function ProgramDetail({ program, onBack, onEdit, onDelete }: ProgramDetailProps) {
  const { exercises, fetchExercises } = useExerciseStore();
  const { isSaving } = useProgramStore();
  const [expandedSession, setExpandedSession] = useState<string | null>(
    program.sessions[0]?.id ?? null,
  );
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    if (exercises.length === 0) fetchExercises();
  }, [exercises.length, fetchExercises]);

  const getExerciseName = (exerciseId: string) => {
    return exercises.find((e) => e.id === exerciseId)?.nameFr ?? exerciseId;
  };

  const getExerciseType = (exerciseId: string) => {
    return exercises.find((e) => e.id === exerciseId)?.type ?? 'reps';
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-xl font-black text-foreground">{program.nameFr}</h2>
            {program.descFr && <p className="text-sm text-muted-foreground">{program.descFr}</p>}
          </div>
          {program.isCustom && (
            <div className="flex gap-1 shrink-0">
              <button
                onClick={onEdit}
                className="rounded-lg p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDeleteConfirm(true)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-danger/10 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border border-border px-2.5 py-0.5">
            {levelLabels[program.level as Level] ?? program.level}
          </span>
          <span className="rounded-full border border-border px-2.5 py-0.5">
            {program.daysPerWeek} j/semaine
          </span>
          {program.durationWeeks && (
            <span className="rounded-full border border-border px-2.5 py-0.5">
              {program.durationWeeks} semaines
            </span>
          )}
          <span className="rounded-full border border-border px-2.5 py-0.5">
            {program.sessions.length} séance{program.sessions.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Sessions list */}
      {program.sessions.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Aucune séance dans ce programme.
          {program.isCustom && (
            <div className="mt-3">
              <GlowButton variant="primary" size="sm" onClick={onEdit}>
                <Plus className="mr-1.5 h-4 w-4" />
                Ajouter une séance
              </GlowButton>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {program.sessions.map((session: WorkoutSession) => {
            const isOpen = expandedSession === session.id;
            return (
              <div key={session.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-white/5"
                  onClick={() => setExpandedSession(isOpen ? null : session.id)}
                >
                  <div>
                    <p className="font-display text-sm font-bold text-foreground">{session.nameFr}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {session.exercises.length} exercice{session.exercises.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </button>

                {isOpen && session.exercises.length > 0 && (
                  <div className="border-t border-border divide-y divide-border">
                    {session.exercises.map((se) => {
                      const exType = getExerciseType(se.exerciseId);
                      return (
                        <div key={se.id} className="flex items-center gap-3 px-4 py-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            {exType === 'duration' ? (
                              <Timer className="h-4 w-4 text-primary" />
                            ) : (
                              <Dumbbell className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {getExerciseName(se.exerciseId)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {se.sets} série{se.sets !== 1 ? 's' : ''} ×{' '}
                              {exType === 'duration'
                                ? `${se.durationSeconds ?? '?'}s`
                                : `${se.reps ?? '?'} reps`}
                              {' · '}
                              repos {se.restSeconds}s
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-foreground">Supprimer ce programme ?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Cette action est irréversible. Toutes les séances seront supprimées.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 rounded-lg border border-border py-2 text-sm font-semibold text-foreground hover:bg-white/5"
              >
                Annuler
              </button>
              <button
                disabled={isSaving}
                onClick={() => { setDeleteConfirm(false); onDelete(); }}
                className="flex-1 rounded-lg bg-danger/80 py-2 text-sm font-semibold text-white hover:bg-danger disabled:opacity-50"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
