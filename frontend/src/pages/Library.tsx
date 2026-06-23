import { useEffect, useState } from 'react';
import { Search, X, SlidersHorizontal, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useExerciseStore } from '@/stores/exerciseStore';
import type { ExerciseFormData } from '@/stores/exerciseStore';
import ExerciseCard from '@/components/exercise/ExerciseCard';
import ExerciseDetail from '@/components/exercise/ExerciseDetail';
import ExerciseForm from '@/components/exercise/ExerciseForm';
import FilterChips from '@/components/exercise/FilterChips';
import GlowButton from '@/components/ui/GlowButton';
import type { Category, Equipment, Level, Exercise } from '@/types';

type Modal = 'none' | 'detail' | 'create' | 'edit';

export default function Library() {
  const { t } = useTranslation();

  const categoryOptions: { value: Category; label: string }[] = [
    { value: 'push', label: t('library.category.push') },
    { value: 'pull', label: t('library.category.pull') },
    { value: 'legs', label: t('library.category.legs') },
    { value: 'core', label: t('library.category.core') },
    { value: 'cardio', label: t('library.category.cardio') },
    { value: 'back', label: t('library.category.back') },
  ];

  const equipmentOptions: { value: Equipment; label: string }[] = [
    { value: 'none', label: t('library.equipment.none') },
    { value: 'dumbbells', label: t('library.equipment.dumbbells') },
    { value: 'barbell', label: t('library.equipment.barbell') },
    { value: 'pull_bar', label: t('library.equipment.pull_bar') },
  ];

  const levelOptions: { value: Level; label: string }[] = [
    { value: 'beginner', label: t('library.level.beginner') },
    { value: 'intermediate', label: t('library.level.intermediate') },
    { value: 'advanced', label: t('library.level.advanced') },
  ];

  const {
    isLoading,
    isSaving,
    error,
    filters,
    selectedExercise,
    fetchExercises,
    fetchPrs,
    prs,
    fetchExercise,
    createExercise,
    updateExercise,
    deleteExercise,
    setFilter,
    toggleFilterItem,
    clearFilters,
    clearSelected,
    filteredExercises,
  } = useExerciseStore();

  const [modal, setModal] = useState<Modal>('none');
  const [showFilters, setShowFilters] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchExercises();
    fetchPrs();
  }, [fetchExercises, fetchPrs]);

  const results = filteredExercises();
  const hasFilters =
    filters.categories.length > 0 ||
    filters.equipments.length > 0 ||
    filters.levels.length > 0 ||
    filters.search.length > 0;

  const openDetail = async (ex: Exercise) => {
    await fetchExercise(ex.id);
    setModal('detail');
  };

  const closeAll = () => {
    setModal('none');
    clearSelected();
  };

  const handleCreate = async (data: ExerciseFormData) => {
    await createExercise(data);
    setModal('none');
  };

  const handleUpdate = async (data: ExerciseFormData) => {
    if (!selectedExercise) return;
    await updateExercise(selectedExercise.id, data);
    setModal('detail');
  };

  const handleDelete = async () => {
    if (!selectedExercise) return;
    setIsDeleting(true);
    try {
      await deleteExercise(selectedExercise.id);
      closeAll();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black text-foreground">{t('library.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading ? t('library.loading') : t('library.count', { count: results.length })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal('create')}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 font-display text-xs font-bold uppercase tracking-widest text-primary-soft transition-all hover:shadow-glow focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none"
        >
          <Plus className="h-4 w-4" />
          {t('library.create')}
        </button>
      </div>

      {/* Search + filter toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('library.searchPlaceholder')}
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
          <span className="hidden sm:inline">{t('common.filters')}</span>
          {(filters.categories.length > 0 || filters.equipments.length > 0 || filters.levels.length > 0) && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-black text-white">
              {(filters.categories.length > 0 ? 1 : 0) + (filters.equipments.length > 0 ? 1 : 0) + (filters.levels.length > 0 ? 1 : 0)}
            </span>
          )}
        </button>
      </div>

      {/* Filter panels */}
      {showFilters && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t('library.filters.category')}</p>
            <FilterChips options={categoryOptions} selected={filters.categories} onToggle={(v) => toggleFilterItem('categories', v)} />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t('library.filters.equipment')}</p>
            <FilterChips options={equipmentOptions} selected={filters.equipments} onToggle={(v) => toggleFilterItem('equipments', v)} />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t('library.filters.level')}</p>
            <FilterChips options={levelOptions} selected={filters.levels} onToggle={(v) => toggleFilterItem('levels', v)} />
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs font-semibold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
              {t('common.clearAllFilters')}
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
          <p className="text-base font-semibold text-foreground">
            {hasFilters ? t('library.noResults') : t('library.empty')}
          </p>
          {hasFilters ? (
            <button onClick={clearFilters} className="text-sm text-primary underline-offset-2 hover:underline">
              {t('common.clearFilters')}
            </button>
          ) : (
            <GlowButton variant="primary" size="sm" onClick={() => setModal('create')}>
              <Plus className="mr-1.5 h-4 w-4" />
              {t('library.createFirst')}
            </GlowButton>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((ex) => (
            <ExerciseCard key={ex.id} exercise={ex} pr={prs[ex.id]} onClick={() => openDetail(ex)} />
          ))}
        </div>
      )}

      {/* Detail modal */}
      {modal === 'detail' && selectedExercise && (
        <ExerciseDetail
          exercise={selectedExercise}
          pr={prs[selectedExercise.id]}
          onClose={closeAll}
          onEdit={() => setModal('edit')}
          onDelete={handleDelete}
          isDeleting={isDeleting}
        />
      )}

      {/* Create modal */}
      {modal === 'create' && (
        <ExerciseForm
          onSubmit={handleCreate}
          onClose={() => setModal('none')}
          isSaving={isSaving}
        />
      )}

      {/* Edit modal */}
      {modal === 'edit' && selectedExercise && (
        <ExerciseForm
          initial={selectedExercise}
          onSubmit={handleUpdate}
          onClose={() => setModal('detail')}
          isSaving={isSaving}
        />
      )}
    </section>
  );
}
