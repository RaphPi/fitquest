import { useEffect, useState } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { useExerciseStore } from '@/stores/exerciseStore';
import ExerciseCard from '@/components/exercise/ExerciseCard';
import ExerciseDetail from '@/components/exercise/ExerciseDetail';
import FilterChips from '@/components/exercise/FilterChips';
import type { Category, Equipment, Level } from '@/types';

const categoryOptions: { value: Category; label: string }[] = [
  { value: 'push', label: 'Push' },
  { value: 'pull', label: 'Pull' },
  { value: 'legs', label: 'Jambes' },
  { value: 'core', label: 'Core' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'back', label: 'Dos' },
];

const equipmentOptions: { value: Equipment; label: string }[] = [
  { value: 'none', label: 'Poids du corps' },
  { value: 'dumbbells', label: 'Haltères' },
  { value: 'barbell', label: 'Barre' },
  { value: 'pull_bar', label: 'Barre de traction' },
];

const levelOptions: { value: Level; label: string }[] = [
  { value: 'beginner', label: 'Débutant' },
  { value: 'intermediate', label: 'Intermédiaire' },
  { value: 'advanced', label: 'Avancé' },
];

export default function Library() {
  const {
    isLoading,
    error,
    filters,
    selectedExercise,
    fetchExercises,
    fetchExercise,
    setFilter,
    toggleFilterItem,
    clearFilters,
    clearSelected,
    filteredExercises,
  } = useExerciseStore();

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const results = filteredExercises();
  const hasFilters =
    filters.categories.length > 0 ||
    filters.equipments.length > 0 ||
    filters.levels.length > 0 ||
    filters.search.length > 0;

  return (
    <section className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-black text-foreground">Bibliothèque</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isLoading ? 'Chargement…' : `${results.length} exercice${results.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Search + filter toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un exercice…"
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            className="w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
          {filters.search && (
            <button
              onClick={() => setFilter('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
            showFilters || filters.categories.length || filters.equipments.length || filters.levels.length
              ? 'border-primary/60 bg-primary/10 text-primary'
              : 'border-border bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filtres</span>
        </button>
      </div>

      {/* Filter panels */}
      {showFilters && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Catégorie</p>
            <FilterChips
              options={categoryOptions}
              selected={filters.categories}
              onToggle={(v) => toggleFilterItem('categories', v)}
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Équipement</p>
            <FilterChips
              options={equipmentOptions}
              selected={filters.equipments}
              onToggle={(v) => toggleFilterItem('equipments', v)}
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Niveau</p>
            <FilterChips
              options={levelOptions}
              selected={filters.levels}
              onToggle={(v) => toggleFilterItem('levels', v)}
            />
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Effacer tous les filtres
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-red-400">{error}</div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-base font-semibold text-foreground">Aucun exercice trouvé</p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-primary underline-offset-2 hover:underline"
            >
              Effacer les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((ex) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              onClick={() => fetchExercise(ex.id)}
            />
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selectedExercise && (
        <ExerciseDetail exercise={selectedExercise} onClose={clearSelected} />
      )}
    </section>
  );
}
