// Composant partagé : visualisation des séries + transitions pour un exercice.
// Utilisé dans ProgramDetail (lecture) et ProgramBuilder (aperçu live).
// Nomenclature :
//   restBetweenSetsSeconds  = Transition (temps entre 2 séries du même exercice)
//   restAfterExerciseSeconds = Repos (temps avant l'exercice suivant)

interface SetsFlowProps {
  sets: number;
  reps?: number | null;
  durationSeconds?: number | null;
  restBetweenSetsSeconds: number; // Transition
  isDuration: boolean;
  compact?: boolean; // moins de padding, texte plus petit
}

export default function SetsFlow({
  sets,
  reps,
  durationSeconds,
  restBetweenSetsSeconds,
  isDuration,
  compact = false,
}: SetsFlowProps) {
  const pillValue = isDuration ? `${durationSeconds ?? '?'}s` : `${reps ?? '?'}`;
  const pillClass = isDuration
    ? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-400'
    : 'border-white/25 bg-white/8 text-white';

  const h = compact ? 'h-7 min-w-[32px] text-[11px]' : 'h-8 min-w-[36px] text-xs';

  return (
    <div className="flex items-end overflow-x-auto pb-1 gap-0" style={{ scrollbarWidth: 'thin' }}>
      {Array.from({ length: sets }).map((_, i) => (
        <div key={i} className="flex items-end shrink-0">
          {/* Set pill */}
          <div className="flex flex-col items-center gap-1">
            <div className={`flex items-center justify-center rounded-lg border px-2 font-bold ${h} ${pillClass}`}>
              {pillValue}
            </div>
            <span className={`text-muted-foreground whitespace-nowrap ${compact ? 'text-[8px]' : 'text-[9px]'}`}>
              s{i + 1}
            </span>
          </div>

          {/* Transition between sets (not after the last one) */}
          {i < sets - 1 && (
            <div className="flex flex-col items-center px-1.5 pb-4 shrink-0">
              <div
                className="h-px w-5"
                style={{
                  background:
                    'repeating-linear-gradient(to right,rgba(99,102,241,.7) 0px,rgba(99,102,241,.7) 3px,transparent 3px,transparent 7px)',
                }}
              />
              <span className="mt-0.5 text-[9px] font-semibold text-primary/80 whitespace-nowrap">
                {restBetweenSetsSeconds}s
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
