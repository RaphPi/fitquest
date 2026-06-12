// Composant partagé : visualisation des séries + transitions pour un exercice.
// Utilisé dans ProgramDetail (lecture) et ProgramBuilder (aperçu live).
// Nomenclature :
//   restBetweenSetsSeconds  = Transition (temps entre 2 séries du même exercice)
//   restAfterExerciseSeconds = Repos (temps avant l'exercice suivant)

// Couleurs — inline rgba() car les modificateurs d'opacité Tailwind
// ne fonctionnent pas avec les CSS custom properties (--color-primary, etc.)
const VIOLET = 'rgba(99,102,241,1)';        // primary
const VIOLET_DOT = 'rgba(99,102,241,0.85)'; // dotted line
const CYAN = 'rgba(34,211,238,1)';           // cyan-400
const CYAN_BG = 'rgba(34,211,238,0.15)';

interface SetsFlowProps {
  sets: number;
  reps?: number | null;
  durationSeconds?: number | null;
  restBetweenSetsSeconds: number; // Transition
  isDuration: boolean;
  compact?: boolean;
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
  const h = compact ? 'h-7 min-w-[32px] text-[11px]' : 'h-8 min-w-[36px] text-xs';

  const pillStyle = isDuration
    ? { border: `1px solid ${CYAN_BG.replace('0.15', '0.5')}`, background: CYAN_BG, color: CYAN }
    : { border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.08)', color: 'white' };

  const transitionLineStyle = {
    background: `repeating-linear-gradient(to right,${VIOLET_DOT} 0px,${VIOLET_DOT} 3px,transparent 3px,transparent 7px)`,
  };

  return (
    <div className="flex items-end overflow-x-auto pb-1 gap-0" style={{ scrollbarWidth: 'thin' }}>
      {Array.from({ length: sets }).map((_, i) => (
        <div key={i} className="flex items-end shrink-0">
          {/* Set pill */}
          <div className="flex flex-col items-center gap-1">
            <div
              className={`flex items-center justify-center rounded-lg px-2 font-bold ${h}`}
              style={pillStyle}
            >
              {pillValue}
            </div>
            <span className={`text-muted-foreground whitespace-nowrap ${compact ? 'text-[8px]' : 'text-[9px]'}`}>
              s{i + 1}
            </span>
          </div>

          {/* Transition (between sets, not after the last) */}
          {i < sets - 1 && (
            <div className="flex flex-col items-center px-1.5 pb-4 shrink-0">
              <div className="h-0.5 w-6" style={transitionLineStyle} />
              <span
                className="mt-0.5 text-[9px] font-semibold whitespace-nowrap"
                style={{ color: VIOLET }}
              >
                {restBetweenSetsSeconds}s
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
