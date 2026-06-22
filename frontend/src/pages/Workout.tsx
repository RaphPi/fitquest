import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, X, SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProgramStore } from '@/stores/programStore';
import { useUserStore } from '@/stores/userStore';
import type { Program, Level } from '@/types';
import ProgramCard from '@/components/workout/ProgramCard';
import ProgramDetail from '@/components/workout/ProgramDetail';
import ProgramBuilder from '@/components/workout/ProgramBuilder';
import GlowButton from '@/components/ui/GlowButton';
import { estimateProgramMinutes } from '@/lib/duration';

type View = 'list' | 'detail' | 'builder';
type DurationFilter = 'any' | 'short' | 'medium' | 'long';

export default function Workout() {
  const { t } = useTranslation();

  const levelOptions: { value: Level; label: string }[] = [
    { value: 'beginner', label: t('workout.level.beginner') },
    { value: 'intermediate', label: t('workout.level.intermediate') },
    { value: 'advanced', label: t('workout.level.advanced') },
  ];

  const durationOptions: { value: DurationFilter; label: string }[] = [
    { value: 'short', label: t('workout.duration.short') },
    { value: 'medium', label: t('workout.duration.medium') },
    { value: 'long', label: t('workout.duration.long') },
  ];

  const { programs, isLoading, isSaving, error, fetchPrograms, deleteProgram } = useProgramStore();
  const user = useUserStore((s) => s.user);
  const [view, setView] = useState<View>('list');
  const [activeProgram, setActiveProgram] = useState<Program | null>(null);
  const [editingProgram, setEditingProgram] = useState<Program | undefined>(undefined);

  // Filters
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [levelFilter, setLevelFilter] = useState<Level[]>([]);
  const [durationFilter, setDurationFilter] = useState<DurationFilter>('any');

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const filtered = useMemo(() => {
    let list = programs;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) => p.nameFr.toLowerCase().includes(q) || p.nameEn.toLowerCase().includes(q) || (p.descFr ?? '').toLowerCase().includes(q),
      );
    }
    if (levelFilter.length > 0) {
      list = list.filter((p) => levelFilter.includes(p.level as Level));
    }
    if (durationFilter !== 'any') {
      list = list.filter((p) => {
        const min = estimateProgramMinutes(p);
        if (min === 0) return true;
        if (durationFilter === 'short') return min < 30;
        if (durationFilter === 'medium') return min >= 30 && min <= 60;
        return min > 60;
      });
    }
    if (user?.primaryGoal) {
      const goal = user.primaryGoal;
      list = [...list].sort((a, b) => {
        const aRec = a.goals.includes(goal) ? 0 : 1;
        const bRec = b.goals.includes(goal) ? 0 : 1;
        return aRec - bRec;
      });
    }
    return list;
  }, [programs, search, levelFilter, durationFilter, user?.primaryGoal]);

  const hasFilters = levelFilter.length > 0 || durationFilter !== 'any';

  const clearFilters = () => {
    setLevelFilter([]);
    setDurationFilter('any');
  };

  const toggleLevel = (l: Level) =>
    setLevelFilter((prev) => prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]);

  const openDetail = (program: Program) => {
    setActiveProgram(program);
    setView('detail');
  };

  const openCreate = () => {
    setEditingProgram(undefined);
    setView('builder');
  };

  const openEdit = (program: Program) => {
    setEditingProgram(program);
    setView('builder');
  };

  const handleDelete = async (program: Program) => {
    await deleteProgram(program.id);
    setView('list');
    setActiveProgram(null);
  };

  const handleSaved = (program: Program) => {
    setActiveProgram(program);
    setView('detail');
  };

  if (view === 'detail' && activeProgram) {
    return (
      <section>
        <ProgramDetail
          program={activeProgram}
          onBack={() => setView('list')}
          onEdit={() => openEdit(activeProgram)}
          onDelete={() => handleDelete(activeProgram)}
        />
      </section>
    );
  }

  if (view === 'builder') {
    return (
      <section>
        <ProgramBuilder
          initial={editingProgram}
          onBack={() => {
            if (editingProgram) {
              setActiveProgram(editingProgram);
              setView('detail');
            } else {
              setView('list');
            }
          }}
          onSaved={handleSaved}
        />
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black text-foreground">{t('workout.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading ? t('workout.loading') : t('workout.programCount', { count: filtered.length })}
          </p>
        </div>
        <GlowButton variant="primary" size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          {t('workout.create')}
        </GlowButton>
      </div>

      {/* Search + filter toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('workout.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
            showFilters || hasFilters
              ? 'border-primary/60 bg-primary/10 text-primary'
              : 'border-border bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">{t('common.filters')}</span>
          {hasFilters && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-black text-white">
              {(levelFilter.length > 0 ? 1 : 0) + (durationFilter !== 'any' ? 1 : 0)}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('workout.filters.level')}</p>
            <div className="flex flex-wrap gap-2">
              {levelOptions.map((o) => (
                <button
                  key={o.value}
                  onClick={() => toggleLevel(o.value)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                    levelFilter.includes(o.value)
                      ? 'border-primary/60 bg-primary/15 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('workout.filters.duration')}</p>
            <div className="flex flex-wrap gap-2">
              {durationOptions.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setDurationFilter(durationFilter === o.value ? 'any' : o.value)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                    durationFilter === o.value
                      ? 'border-xp/60 bg-xp/10 text-xp'
                      : 'border-border text-muted-foreground hover:border-xp/30 hover:text-foreground'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs font-semibold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
              {t('common.clearFilters')}
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-red-400">{error}</div>
      )}

      {/* Programs grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-base font-semibold text-foreground">
            {programs.length === 0 ? t('workout.noPrograms') : t('workout.noResults')}
          </p>
          {programs.length === 0 ? (
            <GlowButton variant="primary" size="sm" onClick={openCreate}>
              <Plus className="mr-1.5 h-4 w-4" />
              {t('workout.createFirst')}
            </GlowButton>
          ) : (
            <button onClick={clearFilters} className="text-sm text-primary underline-offset-2 hover:underline">
              {t('common.clearFilters')}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProgramCard
              key={p.id}
              program={p}
              onClick={() => openDetail(p)}
              recommended={!!user?.primaryGoal && p.goals.includes(user.primaryGoal)}
            />
          ))}
        </div>
      )}

      {isSaving && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground shadow-lg sm:bottom-4">
          {t('workout.saving')}
        </div>
      )}
    </section>
  );
}
