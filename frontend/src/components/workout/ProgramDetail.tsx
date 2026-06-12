import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ChevronDown, ChevronRight, Clock, Dumbbell,
  Layers, Calendar, Pencil, Trash2, Plus, Info, Swords,
} from 'lucide-react';
import { useProgramStore } from '@/stores/programStore';
import { useExerciseStore } from '@/stores/exerciseStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { buildActiveSession } from '@/lib/launchSession';
import type { Program, WorkoutSession, Exercise, Level } from '@/types';
import GlowButton from '@/components/ui/GlowButton';
import SetsFlow from '@/components/workout/SetsFlow';
import ExerciseInfoModal from '@/components/workout/ExerciseInfoModal';
import {
  estimateSessionMinutes,
  estimateProgramMinutes,
  countProgramExercises,
  countProgramSets,
} from '@/lib/duration';

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
  const navigate = useNavigate();
  const { exercises, fetchExercises } = useExerciseStore();
  const startSession = useWorkoutStore((s) => s.start);
  const { isSaving } = useProgramStore();
  const [openSession, setOpenSession] = useState<string | null>(program.sessions[0]?.id ?? null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [infoExercise, setInfoExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    if (exercises.length === 0) fetchExercises();
  }, [exercises.length, fetchExercises]);

  const exMap = new Map<string, Exercise>(exercises.map((e) => [e.id, e]));

  const avgMin = estimateProgramMinutes(program);
  const totalEx = countProgramExercises(program);
  const totalSets = countProgramSets(program);

  const toggleSession = (id: string) =>
    setOpenSession((prev) => (prev === id ? null : id));

  const launchSession = (session: WorkoutSession) => {
    const data = buildActiveSession(program.id, session, exMap);
    if (!data) return;
    startSession(data);
    navigate('/workout/active');
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </button>

      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="inline-flex w-fit rounded-full border border-border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {levelLabels[program.level as Level] ?? program.level}
            </span>
            <h2 className="font-display text-xl font-black leading-tight text-foreground">
              {program.nameFr}
            </h2>
            {program.descFr && (
              <p className="text-sm text-muted-foreground leading-relaxed">{program.descFr}</p>
            )}
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              onClick={onEdit}
              className="rounded-lg p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
              title="Modifier"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-danger/10 hover:text-red-400 transition-colors"
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Program stats row */}
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {program.daysPerWeek} j/semaine
            {program.durationWeeks ? ` · ${program.durationWeeks} sem.` : ''}
          </span>
          <span className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-muted-foreground">
            <Dumbbell className="h-3.5 w-3.5" />
            {program.sessions.length} séance{program.sessions.length !== 1 ? 's' : ''}
          </span>
          {totalEx > 0 && (
            <span className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-muted-foreground">
              <Layers className="h-3.5 w-3.5" />
              {totalEx} exercices · {totalSets} séries
            </span>
          )}
          {avgMin > 0 && (
            <span className="flex items-center gap-1.5 rounded-lg border border-xp/30 bg-xp/10 px-2.5 py-1.5 text-xs font-semibold text-xp">
              <Clock className="h-3.5 w-3.5" />
              ~{avgMin} min/séance
            </span>
          )}
        </div>
      </div>

      {/* Sessions accordion */}
      {program.sessions.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">Aucune séance dans ce programme.</p>
          <GlowButton variant="primary" size="sm" onClick={onEdit}>
            <Plus className="mr-1.5 h-4 w-4" />
            Ajouter une séance
          </GlowButton>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {program.sessions.map((session: WorkoutSession, idx) => {
            const isOpen = openSession === session.id;
            const sessionMin = estimateSessionMinutes(session);
            const label = String.fromCharCode(65 + idx); // A, B, C...

            return (
              <div
                key={session.id}
                className={`overflow-hidden rounded-xl border transition-colors duration-200 ${
                  isOpen ? 'border-primary/30 bg-card' : 'border-border bg-card'
                }`}
              >
                {/* Accordion header */}
                <div className="flex w-full items-center gap-3 p-4">
                  <button
                    className="flex flex-1 items-center gap-3 text-left min-w-0"
                    onClick={() => toggleSession(session.id)}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-display text-xs font-black ${
                        isOpen
                          ? 'border-primary/40 bg-primary/15 text-primary'
                          : 'border-border bg-background text-muted-foreground'
                      }`}
                    >
                      {label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-display text-sm font-bold ${isOpen ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {session.nameFr}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {session.exercises.length} exercice{session.exercises.length !== 1 ? 's' : ''}
                        {sessionMin > 0 ? ` · ${session.exercises.reduce((a, e) => a + e.sets, 0)} séries · ~${sessionMin} min` : ''}
                      </p>
                    </div>
                  </button>
                  {/* Lancement rapide — sans avoir à déplier la séance */}
                  {session.exercises.some((e) => e.sets > 0) && (
                    <button
                      onClick={() => launchSession(session)}
                      title="Lancer la séance"
                      className="flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 font-display text-xs font-bold uppercase tracking-wide text-white transition-transform active:scale-[0.97]"
                      style={{ borderColor: '#fca5a5', background: 'linear-gradient(180deg,#ef4444,#991b1b)', boxShadow: '0 3px 0 #5b1212' }}
                    >
                      <Swords className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Lancer</span>
                    </button>
                  )}
                  <button onClick={() => toggleSession(session.id)} className="shrink-0 p-1">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-primary" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>

                {/* Accordion body */}
                {isOpen && session.exercises.length > 0 && (
                  <div className="border-t border-border">
                    {session.exercises.map((se, eIdx) => {
                      const ex = exMap.get(se.exerciseId);
                      const isDuration = ex?.type === 'duration';
                      const isLast = eIdx === session.exercises.length - 1;

                      return (
                        <div key={se.id}>
                          {/* Exercise block */}
                          <div className="px-4 pt-3 pb-2">
                            {/* Exercise header */}
                            <div className="flex items-center gap-2 mb-2.5">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[10px] font-black text-primary">
                                {eIdx + 1}
                              </span>
                              <span className="font-display text-sm font-bold text-foreground flex-1 min-w-0 truncate">
                                {ex?.nameFr ?? se.exerciseId}
                              </span>
                              {ex && (
                                <button
                                  onClick={() => setInfoExercise(ex)}
                                  className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-primary transition-colors"
                                  title="Voir la fiche exercice"
                                >
                                  <Info className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <span
                                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black"
                                style={isDuration
                                  ? { border: '1px solid rgba(34,211,238,0.5)', background: 'rgba(34,211,238,0.15)', color: 'rgba(34,211,238,1)' }
                                  : { border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', color: 'white' }
                                }
                              >
                                {se.sets} × {isDuration ? `${se.durationSeconds ?? '?'}s` : `${se.reps ?? '?'}`}
                              </span>
                            </div>

                            {/* Sets flow */}
                            <SetsFlow
                              sets={se.sets}
                              reps={se.reps}
                              durationSeconds={se.durationSeconds}
                              restBetweenSetsSeconds={se.restBetweenSetsSeconds}
                              isDuration={isDuration}
                            />
                          </div>

                          {/* Inter-exercise transition (not after last exercise) */}
                          {!isLast && (
                            <div className="flex items-center gap-2 px-4 py-1.5">
                              <div
                                className="flex-1 h-0.5"
                                style={{
                                  background: `repeating-linear-gradient(to right, rgba(234,179,8,0.7) 0px, rgba(234,179,8,0.7) 4px, transparent 4px, transparent 9px)`,
                                }}
                              />
                              <span
                                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap"
                                style={{ border: '1px solid rgba(234,179,8,0.5)', background: 'rgba(234,179,8,0.12)', color: 'rgba(234,179,8,1)' }}
                              >
                                Repos {se.restAfterExerciseSeconds}s
                              </span>
                              <div
                                className="flex-1 h-0.5"
                                style={{
                                  background: `repeating-linear-gradient(to right, rgba(234,179,8,0.7) 0px, rgba(234,179,8,0.7) 4px, transparent 4px, transparent 9px)`,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div className="p-4 pt-2">
                      <button
                        onClick={() => launchSession(session)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 py-3 font-display text-sm font-bold uppercase tracking-wide text-white transition-transform active:scale-[0.98]"
                        style={{ borderColor: '#fca5a5', background: 'linear-gradient(180deg,#ef4444,#991b1b)', boxShadow: '0 5px 0 #5b1212' }}
                      >
                        <Swords className="h-4 w-4" />
                        Lancer la séance
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Exercise info modal */}
      {infoExercise && (
        <ExerciseInfoModal exercise={infoExercise} onClose={() => setInfoExercise(null)} />
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-foreground">Supprimer ce programme ?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Cette action est irréversible. Toutes les séances associées seront supprimées.
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
