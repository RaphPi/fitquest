import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileJson, CheckCircle2, XCircle, Loader2, AlertCircle,
  ArrowLeft, Trash2, TriangleAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImportPayloadPreview {
  exercises: number;
  programs: number;
}

interface ImportResult {
  imported: { exercises: number; programs: number };
  skipped: number;
  errors: string[];
}

interface PurgeResult {
  deleted: { programs: number; exercises: number };
}

type PageStatus = 'idle' | 'preview' | 'loading' | 'success' | 'error';
type PurgeStatus = 'idle' | 'confirm' | 'purging' | 'done' | 'error';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...init });
  const data = await res.json() as unknown;
  if (!res.ok) throw new Error((data as Record<string, string>).error ?? 'Erreur serveur');
  return data as T;
}

export default function ImportLFY() {
  const navigate = useNavigate();

  // ── Import state ──────────────────────────────────────────────────────────
  const [status, setStatus] = useState<PageStatus>('idle');
  const [preview, setPreview] = useState<ImportPayloadPreview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [jsonContent, setJsonContent] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Purge state ───────────────────────────────────────────────────────────
  const [purgeStatus, setPurgeStatus] = useState<PurgeStatus>('idle');
  const [purgeResult, setPurgeResult] = useState<PurgeResult | null>(null);
  const [purgeError, setPurgeError] = useState('');

  // ── Import handlers ───────────────────────────────────────────────────────

  function readFile(file: File) {
    if (!file.name.endsWith('.json')) {
      setErrorMsg('Le fichier doit être un .json');
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
        setErrorMsg('Fichier JSON invalide ou mal formé');
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
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Erreur inconnue');
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

  async function handlePurge() {
    setPurgeStatus('purging');
    try {
      const res = await apiFetch<PurgeResult>('/api/v1/programs/import/lfy', {
        method: 'DELETE',
      });
      setPurgeResult(res);
      setPurgeStatus('done');
    } catch (e) {
      setPurgeError(e instanceof Error ? e.message : 'Erreur inconnue');
      setPurgeStatus('error');
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
          Réglages
        </button>
        <h1 className="font-display text-2xl font-bold">Import JSON</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Importe exercices et programmes depuis un fichier{' '}
          <span className="font-mono text-foreground">lfy_import.json</span>.
        </p>
      </div>

      {/* ── Zone drag & drop ──────────────────────────────────────────────── */}
      {showDropZone && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Sélectionner un fichier JSON à importer"
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
            <p className="text-sm font-semibold text-foreground">Glisse ton fichier ici</p>
            <p className="mt-0.5 text-xs text-muted-foreground">ou clique pour sélectionner un .json</p>
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
            <p className="text-sm font-semibold text-red-400">Erreur</p>
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
              Aperçu du fichier
            </h2>
          </div>
          <div className="flex gap-8 p-5">
            <div>
              <p className="text-3xl font-black text-foreground">{preview.exercises}</p>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Exercices
              </p>
            </div>
            <div className="border-l border-border" />
            <div>
              <p className="text-3xl font-black text-foreground">{preview.programs}</p>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Programmes
              </p>
            </div>
          </div>
          <div className="flex gap-3 border-t border-border px-5 py-4">
            <button
              type="button"
              onClick={() => void handleImport()}
              className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold uppercase tracking-widest text-background shadow-glow transition-all hover:opacity-90"
            >
              Importer
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* ── Chargement import ──────────────────────────────────────────────── */}
      {status === 'loading' && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="text-center">
            <p className="text-sm font-semibold text-muted-foreground">Import en cours…</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              La transaction peut prendre quelques secondes.
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
                Import réussi
              </h2>
            </div>
            <div className="flex flex-wrap gap-8 p-5">
              <div>
                <p className="text-3xl font-black text-foreground">{result.imported.exercises}</p>
                <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Exercices
                </p>
              </div>
              <div className="border-l border-border" />
              <div>
                <p className="text-3xl font-black text-foreground">{result.imported.programs}</p>
                <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Programmes
                </p>
              </div>
              {result.skipped > 0 && (
                <>
                  <div className="border-l border-border" />
                  <div>
                    <p className="text-3xl font-black text-muted-foreground">{result.skipped}</p>
                    <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Ignorés
                    </p>
                  </div>
                </>
              )}
            </div>
            {result.errors.length > 0 && (
              <div className="border-t border-border px-5 pb-5 pt-4">
                <div className="mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-400" />
                  <p className="text-xs font-semibold text-yellow-400">Avertissements</p>
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
            Importer un autre fichier
          </button>
        </>
      )}

      {/* ── Zone de danger : purge LFY ───────────────────────────────────── */}
      <div className="mt-8 overflow-hidden rounded-xl border border-red-500/20 bg-card">
        <div className="flex items-center gap-3 border-b border-red-500/20 px-5 py-4">
          <Trash2 className="h-4 w-4 text-red-400" />
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-red-400">
            Purger les données LFY
          </h2>
        </div>

        <div className="p-5">
          {purgeStatus === 'idle' && (
            <>
              <p className="mb-4 text-xs text-muted-foreground">
                Supprime tous les exercices (<span className="font-mono">lfy_*</span>) et
                programmes (<span className="font-mono">LFY…</span>) de la base.
                À utiliser avant une réimportation pour corriger les données.
              </p>
              <button
                type="button"
                onClick={() => setPurgeStatus('confirm')}
                className="flex items-center gap-2 rounded-lg border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
                Purger
              </button>
            </>
          )}

          {purgeStatus === 'confirm' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
                <p className="text-xs text-yellow-400">
                  Cette action est irréversible. Tous les exercices et programmes LFY seront supprimés.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => void handlePurge()}
                  className="flex-1 rounded-lg bg-red-500/80 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-500"
                >
                  Confirmer la suppression
                </button>
                <button
                  type="button"
                  onClick={() => setPurgeStatus('idle')}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {purgeStatus === 'purging' && (
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-red-400" />
              <p className="text-sm text-muted-foreground">Suppression en cours…</p>
            </div>
          )}

          {purgeStatus === 'done' && purgeResult && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                <p className="text-sm font-semibold text-foreground">
                  {purgeResult.deleted.programs} programme{purgeResult.deleted.programs !== 1 ? 's' : ''} et{' '}
                  {purgeResult.deleted.exercises} exercice{purgeResult.deleted.exercises !== 1 ? 's' : ''} supprimés.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setPurgeStatus('idle'); setPurgeResult(null); }}
                className="w-fit text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
              >
                Réinitialiser
              </button>
            </div>
          )}

          {purgeStatus === 'error' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <p className="text-xs text-red-400">{purgeError}</p>
              </div>
              <button
                type="button"
                onClick={() => setPurgeStatus('idle')}
                className="w-fit text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
              >
                Réessayer
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
