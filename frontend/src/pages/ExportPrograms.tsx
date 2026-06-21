import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, FileJson, Download, Loader2, CheckCircle2, Circle, Search } from 'lucide-react';
import { getLevelTier } from '@/lib/levelTier';
import type { Program, Level } from '@/types';
import { cn } from '@/lib/utils';

const LEVEL_REP: Record<Level, number> = { beginner: 1, intermediate: 20, advanced: 50 };

function levelColor(level: Level) {
  const tier = getLevelTier(LEVEL_REP[level] ?? 1);
  return tier.color;
}

const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced'];

export default function ExportPrograms() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<Level[]>([]);

  useEffect(() => {
    fetch('/api/v1/programs', { credentials: 'include' })
      .then((r) => r.json())
      .then((data: { programs: Program[] }) => setPrograms(data.programs ?? []))
      .catch(() => setError(t('exportPrograms.errorFetch')))
      .finally(() => setLoading(false));
  }, [t]);

  const filtered = useMemo(() => {
    let list = programs;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => p.nameFr.toLowerCase().includes(q) || p.nameEn.toLowerCase().includes(q));
    }
    if (levelFilter.length > 0) {
      list = list.filter((p) => levelFilter.includes(p.level as Level));
    }
    return list;
  }, [programs, search, levelFilter]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selectedIds.has(p.id));

  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((p) => next.add(p.id));
        return next;
      });
    }
  };

  const toggleLevel = (l: Level) =>
    setLevelFilter((prev) => prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]);

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleExport = async () => {
    if (selectedIds.size === 0) return;
    setExporting(true);
    setError(null);
    try {
      const idsParam = [...selectedIds].join(',');
      const res = await fetch(`/api/v1/programs/export?ids=${encodeURIComponent(idsParam)}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const date = new Date().toISOString().slice(0, 10);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitquest_programs_${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError(t('exportPrograms.errorFetch'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="max-w-lg pb-40 md:pb-4">
      <div className="mb-5">
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t('exportPrograms.backLink')}
        </button>
        <h1 className="font-display text-2xl font-bold">{t('exportPrograms.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('exportPrograms.subtitle')}</p>
      </div>

      {/* Filters */}
      {!loading && programs.length > 0 && (
        <div className="mb-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('workout.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => toggleLevel(l)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                  levelFilter.includes(l)
                    ? 'border-primary/60 bg-primary/15 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground',
                )}
              >
                {t(`workout.level.${l}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && programs.length === 0 && !error && (
        <p className="text-sm text-muted-foreground">{t('exportPrograms.noPrograms')}</p>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {!loading && programs.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {/* Header row: select all filtered */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <FileJson className="h-4 w-4 text-primary-soft" />
              <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                {filtered.length} / {programs.length}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
            >
              {allFilteredSelected ? t('exportPrograms.deselectAll') : t('exportPrograms.selectAll')}
            </button>
          </div>

          {/* Program list */}
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">{t('workout.noResults')}</p>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((p) => {
                const selected = selectedIds.has(p.id);
                const color = levelColor(p.level as Level);
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => toggleOne(p.id)}
                      className={cn(
                        'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-card-shield/30',
                        selected && 'bg-primary/5',
                      )}
                    >
                      {selected
                        ? <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                        : <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{p.nameFr}</p>
                        <p className="text-[11px] text-muted-foreground">
                          <span style={{ color }}>{t(`workout.level.${p.level}`)}</span>
                          {' · '}
                          {t('exportPrograms.sessions', { count: p.sessions.length })}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Sticky action bar */}
      {!loading && programs.length > 0 && (
        <div className="fixed inset-x-0 bottom-16 z-30 flex gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm md:bottom-0">
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={selectedIds.size === 0 || exporting}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold uppercase tracking-widest transition-all',
              selectedIds.size > 0 && !exporting
                ? 'bg-primary text-background shadow-glow hover:opacity-90'
                : 'cursor-not-allowed bg-primary/30 text-background/50',
            )}
          >
            {exporting
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Download className="h-4 w-4" />}
            {t('exportPrograms.exportBtn', { count: selectedIds.size })}
          </button>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('exportPrograms.cancel')}
          </button>
        </div>
      )}
    </section>
  );
}
