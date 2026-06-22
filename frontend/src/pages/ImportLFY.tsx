import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Upload, FileJson, CheckCircle2, XCircle, Loader2, AlertCircle,
  ArrowLeft, Trash2, TriangleAlert, History,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImportLog {
  id: string;
  label: string | null;
  importedAt: string;
  programIds: string[];
  exerciseIds: string[];
}

interface ImportPayloadPreview {
  exercises: number;
  programs: number;
}

interface ImportResult {
  imported: { exercises: number; programs: number };
  skipped: number;
  errors: string[];
}

type PageStatus = 'idle' | 'preview' | 'loading' | 'success' | 'error';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...init });
  const data = await res.json() as unknown;
  if (!res.ok) throw new Error((data as Record<string, string>).error ?? 'Erreur serveur');
  return data as T;
}

export default function ImportLFY() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // ── Import state ──────────────────────────────────────────────────────────
  const [status, setStatus] = useState<PageStatus>('idle');
  const [preview, setPreview] = useState<ImportPayloadPreview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [jsonContent, setJsonContent] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Logs state ────────────────────────────────────────────────────────────
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [confirmLogId, setConfirmLogId] = useState<string | null>(null);
  const [purgingLogId, setPurgingLogId] = useState<string | null>(null);
  const [purgeError, setPurgeError] = useState<string | null>(null);

  // ── Fetch logs ────────────────────────────────────────────────────────────

  async function fetchLogs() {
    setLogsLoading(true);
    try {
      const data = await apiFetch<ImportLog[]>('/api/v1/programs/import/logs');
      setLogs(data);
    } catch {
      // silent — la section reste vide
    } finally {
      setLogsLoading(false);
    }
  }

  useEffect(() => { void fetchLogs(); }, []);

  // ── Import handlers ───────────────────────────────────────────────────────

  function readFile(file: File) {
    if (!file.name.endsWith('.json')) {
      setErrorMsg(t('import.error.notJson'));
      setStatus('error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const raw = e.target?.result as string;
      try {
        const parsed = JSON.parse(raw) as { exercises?: unknown[]; programs?: unknown[] };
        setJsonContent(raw);
        setPreview({
          exercises: Array.isArray(parsed.exercises) ? parsed.exercises.length : 0,
          programs: Array.isArray(parsed.programs) ? parsed.programs.length : 0,
        });
        setStatus('preview');
      } catch {
        setErrorMsg(t('import.error.invalidJson'));
        setStatus('error');
      }
    };
    reader.readAsText(file, 'utf-8');
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) readFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  }

  async function handleImport() {
    if (!jsonContent) return;
    setStatus('loading');
    try {
      const res = await apiFetch<ImportResult>('/api/v1/programs/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonContent,
      });
      setResult(res);
      setStatus('success');
      void fetchLogs();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : t('common.unknownError'));
      setStatus('error');
    }
  }

  function reset() {
    setStatus('idle');
    setPreview(null);
    setResult(null);
    setErrorMsg('');
    setJsonContent(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  // ── Purge handlers ────────────────────────────────────────────────────────

  async function handlePurge(logId: string) {
    setConfirmLogId(null);
    setPurgingLogId(logId);
    setPurgeError(null);
    try {
      await apiFetch<{ deleted: { programs: number; exercises: number } }>(
        `/api/v1/programs/import/${encodeURIComponent(logId)}`,
        { method: 'DELETE' },
      );
      await fetchLogs();
    } catch (e) {
      setPurgeError(e instanceof Error ? e.message : t('common.unknownError'));
    } finally {
      setPurgingLogId(null);
    }
  }

  const showDropZone = status === 'idle' || status === 'error';

  return (
    <section className="max-w-lg space-y-4">
      <div className="mb-5">
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t('import.backLink')}
        </button>
        <h1 className="font-display text-2xl font-bold">{t('import.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('import.subtitle')}{' '}
          <span className="font-mono text-foreground">lfy_import.json</span>.
        </p>
      </div>

      {/* ── Zone drag & drop ──────────────────────────────────────────────── */}
      {showDropZone && (
        <div
          role="button"
          tabIndex={0}
          aria-label={t('import.dropZoneAriaLabel')}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-12 transition-colors',
            isDragging
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/40 hover:bg-card-shield/20',
          )}
        >
          <Upload className="h-10 w-10 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">{t('import.dropHint')}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{t('import.dropSubhint')}</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* ── Erreur import ──────────────────────────────────────────────────── */}
      {status === 'error' && (
        <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          <div>
            <p className="text-sm font-semibold text-red-400">{t('import.error.title')}</p>
            <p className="mt-0.5 text-xs text-red-400/80">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* ── Aperçu avant import ─────────────────────────────────────────── */}
      {status === 'preview' && preview && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <FileJson className="h-5 w-5 text-primary-soft" />
            <h2 className="font-display text-sm font-bold uppercase tracking-widest">
              {t('import.preview.title')}
            </h2>
          </div>
          <div className="flex gap-8 p-5">
            <div>
              <p className="text-3xl font-black text-foreground">{preview.exercises}</p>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t('import.preview.exercises')}
              </p>
            </div>
            <div className="border-l border-border" />
            <div>
              <p className="text-3xl font-black text-foreground">{preview.programs}</p>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t('import.preview.programs')}
              </p>
            </div>
          </div>
          <div className="flex gap-3 border-t border-border px-5 py-4">
            <button
              type="button"
              onClick={() => void handleImport()}
              className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold uppercase tracking-widest text-background shadow-glow transition-all hover:opacity-90"
            >
              {t('import.preview.import')}
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              {t('import.preview.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* ── Chargement import ──────────────────────────────────────────────── */}
      {status === 'loading' && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="text-center">
            <p className="text-sm font-semibold text-muted-foreground">{t('import.loading.title')}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t('import.loading.hint')}
            </p>
          </div>
        </div>
      )}

      {/* ── Succès import ──────────────────────────────────────────────────── */}
      {status === 'success' && result && (
        <>
          <div className="overflow-hidden rounded-xl border border-primary/30 bg-card">
            <div className="flex items-center gap-3 border-b border-border px-5 py-4">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-primary">
                {t('import.success.title')}
              </h2>
            </div>
            <div className="flex flex-wrap gap-8 p-5">
              <div>
                <p className="text-3xl font-black text-foreground">{result.imported.exercises}</p>
                <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('import.success.exercises')}
                </p>
              </div>
              <div className="border-l border-border" />
              <div>
                <p className="text-3xl font-black text-foreground">{result.imported.programs}</p>
                <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('import.success.programs')}
                </p>
              </div>
              {result.skipped > 0 && (
                <>
                  <div className="border-l border-border" />
                  <div>
                    <p className="text-3xl font-black text-muted-foreground">{result.skipped}</p>
                    <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t('import.success.skipped')}
                    </p>
                  </div>
                </>
              )}
            </div>
            {result.errors.length > 0 && (
              <div className="border-t border-border px-5 pb-5 pt-4">
                <div className="mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-400" />
                  <p className="text-xs font-semibold text-yellow-400">{t('import.success.warnings')}</p>
                </div>
                <ul className="space-y-1">
                  {result.errors.map((err, i) => (
                    <li key={i} className="text-xs text-muted-foreground">{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={reset}
            className="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('import.success.importAnother')}
          </button>
        </>
      )}

      {/* ── Historique des imports ─────────────────────────────────────────── */}
      <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <History className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-display text-sm font-bold uppercase tracking-widest">
            {t('import.logs.title')}
          </h2>
        </div>

        {purgeError && (
          <div className="flex items-start gap-3 border-b border-red-500/20 bg-red-500/10 px-5 py-3">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <p className="flex-1 text-xs text-red-400">{purgeError}</p>
            <button
              type="button"
              onClick={() => setPurgeError(null)}
              className="text-xs text-muted-foreground underline underline-offset-2"
            >
              {t('import.logs.purgeRetry')}
            </button>
          </div>
        )}

        {logsLoading ? (
          <div className="flex items-center gap-3 p-5">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">{t('import.logs.empty')}</p>
        ) : (
          <div className="divide-y divide-border">
            {logs.map((log) => (
              <div key={log.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      {log.label && (
                        <span className="rounded bg-primary/15 px-1.5 py-0.5 font-mono text-xs font-semibold text-primary">
                          {log.label}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.importedAt).toLocaleString(i18n.language)}
                      </span>
                    </div>
                    <div className="mt-1 flex gap-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <span>{log.programIds.length} {t('import.preview.programs').toLowerCase()}</span>
                      {log.exerciseIds.length > 0 && (
                        <span>{log.exerciseIds.length} {t('import.preview.exercises').toLowerCase()}</span>
                      )}
                    </div>
                  </div>
                  {purgingLogId === log.id ? (
                    <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                  ) : confirmLogId !== log.id && (
                    <button
                      type="button"
                      onClick={() => setConfirmLogId(log.id)}
                      className="mt-0.5 shrink-0 rounded-lg border border-red-500/30 p-1.5 text-red-400 transition-colors hover:bg-red-500/10"
                      title={t('import.logs.purgeBtn')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {confirmLogId === log.id && (
                  <div className="mt-3 flex flex-col gap-2">
                    <div className="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-2.5">
                      <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-400" />
                      <p className="text-xs text-yellow-400">
                        {t('import.logs.purgeConfirm', {
                          programs: log.programIds.length,
                          exercises: log.exerciseIds.length,
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handlePurge(log.id)}
                        className="flex-1 rounded-lg bg-red-500/80 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-red-500"
                      >
                        {t('import.logs.purgeConfirmBtn')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmLogId(null)}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {t('import.logs.purgeCancel')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
