import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, FileJson, Download, Loader2, CheckCircle2, Circle } from 'lucide-react';
import { getLevelTier } from '@/lib/levelTier';
import type { Program, Level } from '@/types';
import { cn } from '@/lib/utils';

const LEVEL_REP: Record<Level, number> = { beginner: 1, intermediate: 20, advanced: 50 };

function levelColor(level: Level) {
  const tier = getLevelTier(LEVEL_REP[level] ?? 1);
  return tier.color;
}

export default function ExportPrograms() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/programs', { credentials: 'include' })
      .then((r) => r.json())
      .then((data: { programs: Program[] }) => {
        setPrograms(data.programs ?? []);
      })
      .catch(() => setError(t('exportPrograms.errorFetch')))
      .finally(() => setLoading(false));
  }, [t]);

  const allSelected = programs.length > 0 && selectedIds.size === programs.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(programs.map((p) => p.id)));
    }
  };

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
    <section className="max-w-lg space-y-4">
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
          {/* Header row: select all */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <FileJson className="h-4 w-4 text-primary-soft" />
              <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                {programs.length} prog.
              </span>
            </div>
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
            >
              {allSelected ? t('exportPrograms.deselectAll') : t('exportPrograms.selectAll')}
            </button>
          </div>

          {/* Program list */}
          <ul className="divide-y divide-border">
            {programs.map((p) => {
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
        </div>
      )}

      {/* Actions */}
      {!loading && programs.length > 0 && (
        <div className="flex gap-3">
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
