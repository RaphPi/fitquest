import { useState, useCallback, useMemo } from 'react';
import { ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, Search, X, Clock, Layers } from 'lucide-react';
import { useProgramStore } from '@/stores/programStore';
import type { ProgramFormData, SessionExerciseInput } from '@/stores/programStore';
import { useExerciseStore } from '@/stores/exerciseStore';
import GlowButton from '@/components/ui/GlowButton';
import type { Program, Level, Equipment, Exercise } from '@/types';
import { estimateExerciseSeconds } from '@/lib/duration';

interface ProgramBuilderProps {
  initial?: Program;
  onBack: () => void;
  onSaved: (program: Program) => void;
}

type DraftExercise = SessionExerciseInput & {
  _key: string;
  _name: string;
  _type: 'reps' | 'duration';
};

interface DraftSession {
  _key: string;
  id?: string;
  nameFr: string;
  nameEn: string;
  order: number;
  exercises: DraftExercise[];
}

const levelOptions: { value: Level; label: string }[] = [
  { value: 'beginner', label: 'Débutant' },
  { value: 'intermediate', label: 'Intermédiaire' },
  { value: 'advanced', label: 'Avancé' },
];

const equipmentOptions: { value: Equipment; label: string }[] = [
  { value: 'none', label: 'Poids du corps' },
  { value: 'dumbbells', label: 'Haltères' },
  { value: 'barbell', label: 'Barre' },
  { value: 'pull_bar', label: 'Barre de traction' },
  { value: 'other', label: 'Autre' },
];

let _keySeq = 0;
const nextKey = () => `k${++_keySeq}`;

function makeDefaultSession(order: number): DraftSession {
  return { _key: nextKey(), nameFr: '', nameEn: '', order, exercises: [] };
}

function initFromProgram(program: Program, exMap: Map<string, Exercise>): DraftSession[] {
  return program.sessions.map((s) => ({
    _key: nextKey(),
    id: s.id,
    nameFr: s.nameFr,
    nameEn: s.nameEn,
    order: s.order,
    exercises: s.exercises.map((se) => {
      const ex = exMap.get(se.exerciseId);
      return {
        _key: nextKey(),
        exerciseId: se.exerciseId,
        _name: ex?.nameFr ?? se.exerciseId,
        _type: (ex?.type ?? 'reps') as 'reps' | 'duration',
        order: se.order,
        sets: se.sets,
        reps: se.reps ?? null,
        durationSeconds: se.durationSeconds ?? null,
        restBetweenSetsSeconds: se.restBetweenSetsSeconds,
        restAfterExerciseSeconds: se.restAfterExerciseSeconds,
      };
    }),
  }));
}

function sessionEstimateMinutes(session: DraftSession): number {
  const secs = session.exercises.reduce((acc, ex) => {
    return acc + estimateExerciseSeconds({
      id: '', exerciseId: ex.exerciseId, order: ex.order,
      sets: ex.sets, reps: ex.reps, durationSeconds: ex.durationSeconds,
      restBetweenSetsSeconds: ex.restBetweenSetsSeconds,
      restAfterExerciseSeconds: ex.restAfterExerciseSeconds,
    });
  }, 0);
  return Math.round(secs / 60);
}

export default function ProgramBuilder({ initial, onBack, onSaved }: ProgramBuilderProps) {
  const { createProgram, updateProgram, createSession, updateSession, deleteSession } = useProgramStore();
  const { exercises, fetchExercises } = useExerciseStore();
  const exMap = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);

  const [nameFr, setNameFr] = useState(initial?.nameFr ?? '');
  const [nameEn, setNameEn] = useState(initial?.nameEn ?? '');
  const [descFr, setDescFr] = useState(initial?.descFr ?? '');
  const [descEn, setDescEn] = useState(initial?.descEn ?? '');
  const [level, setLevel] = useState<Level>((initial?.level as Level) ?? 'beginner');
  const [daysPerWeek, setDaysPerWeek] = useState(initial?.daysPerWeek ?? 3);
  const [durationWeeks, setDurationWeeks] = useState<string>(
    initial?.durationWeeks ? String(initial.durationWeeks) : '',
  );
  const [equipment, setEquipment] = useState<Equipment[]>((initial?.equipment as Equipment[]) ?? []);
  const [sessions, setSessions] = useState<DraftSession[]>(() =>
    initial ? initFromProgram(initial, exMap) : [makeDefaultSession(0)],
  );

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pickerSession, setPickerSession] = useState<string | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');

  // Live duration estimates
  const liveStats = useMemo(() => {
    const totalSets = sessions.reduce((a, s) => a + s.exercises.reduce((b, e) => b + e.sets, 0), 0);
    const totalEx = sessions.reduce((a, s) => a + s.exercises.length, 0);
    const avgMin = sessions.length > 0
      ? Math.round(sessions.reduce((a, s) => a + sessionEstimateMinutes(s), 0) / sessions.length)
      : 0;
    return { totalSets, totalEx, avgMin };
  }, [sessions]);

  const openPicker = useCallback((sessionKey: string) => {
    if (exercises.length === 0) fetchExercises();
    setPickerSession(sessionKey);
    setPickerSearch('');
  }, [exercises.length, fetchExercises]);

  const filteredExercises = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter(
      (e) => e.nameFr.toLowerCase().includes(q) || e.nameEn.toLowerCase().includes(q),
    );
  }, [exercises, pickerSearch]);

  const addExerciseToSession = (sessionKey: string, ex: Exercise) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s._key !== sessionKey) return s;
        return {
          ...s,
          exercises: [
            ...s.exercises,
            {
              _key: nextKey(),
              exerciseId: ex.id,
              _name: ex.nameFr,
              _type: ex.type as 'reps' | 'duration',
              order: s.exercises.length,
              sets: 3,
              reps: ex.type === 'reps' ? 10 : null,
              durationSeconds: ex.type === 'duration' ? 30 : null,
              restBetweenSetsSeconds: 60,
              restAfterExerciseSeconds: 20,
            },
          ],
        };
      }),
    );
    setPickerSession(null);
  };

  const toggleEquipment = (eq: Equipment) =>
    setEquipment((prev) => prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq]);

  const addSession = () =>
    setSessions((prev) => [...prev, makeDefaultSession(prev.length)]);

  const removeSession = (key: string) =>
    setSessions((prev) => prev.filter((s) => s._key !== key).map((s, i) => ({ ...s, order: i })));

  const moveSession = (key: string, dir: -1 | 1) =>
    setSessions((prev) => {
      const idx = prev.findIndex((s) => s._key === key);
      if (idx < 0) return prev;
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next.map((s, i) => ({ ...s, order: i }));
    });

  const updateSessionField = (key: string, field: 'nameFr' | 'nameEn', value: string) =>
    setSessions((prev) => prev.map((s) => (s._key === key ? { ...s, [field]: value } : s)));

  const updateExerciseField = (sessionKey: string, exKey: string, field: string, value: number | null) =>
    setSessions((prev) =>
      prev.map((s) => {
        if (s._key !== sessionKey) return s;
        return {
          ...s,
          exercises: s.exercises.map((e) => e._key === exKey ? { ...e, [field]: value } : e),
        };
      }),
    );

  const removeExercise = (sessionKey: string, exKey: string) =>
    setSessions((prev) =>
      prev.map((s) => {
        if (s._key !== sessionKey) return s;
        return {
          ...s,
          exercises: s.exercises.filter((e) => e._key !== exKey).map((e, i) => ({ ...e, order: i })),
        };
      }),
    );

  const moveExercise = (sessionKey: string, exKey: string, dir: -1 | 1) =>
    setSessions((prev) =>
      prev.map((s) => {
        if (s._key !== sessionKey) return s;
        const arr = [...s.exercises];
        const idx = arr.findIndex((e) => e._key === exKey);
        if (idx < 0) return s;
        const swap = idx + dir;
        if (swap < 0 || swap >= arr.length) return s;
        [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
        return { ...s, exercises: arr.map((e, i) => ({ ...e, order: i })) };
      }),
    );

  const handleSave = async () => {
    if (!nameFr.trim() || !nameEn.trim()) {
      setSaveError('Le nom du programme est requis (FR et EN)');
      return;
    }
    for (const s of sessions) {
      if (!s.nameFr.trim() || !s.nameEn.trim()) {
        setSaveError('Chaque séance doit avoir un nom (FR et EN)');
        return;
      }
    }
    setSaving(true);
    setSaveError(null);
    try {
      const meta: ProgramFormData = {
        nameFr: nameFr.trim(), nameEn: nameEn.trim(),
        descFr: descFr.trim() || undefined,
        descEn: descEn.trim() || undefined,
        level, daysPerWeek,
        durationWeeks: durationWeeks ? Number(durationWeeks) : null,
        equipment,
      };

      const toSessionData = (s: DraftSession) => ({
        nameFr: s.nameFr, nameEn: s.nameEn, order: s.order,
        exercises: s.exercises.map((e) => ({
          exerciseId: e.exerciseId, order: e.order, sets: e.sets,
          reps: e.reps, durationSeconds: e.durationSeconds,
          restBetweenSetsSeconds: e.restBetweenSetsSeconds,
          restAfterExerciseSeconds: e.restAfterExerciseSeconds,
        })),
      });

      let programId: string;
      if (!initial) {
        const program = await createProgram(meta);
        programId = program.id;
        for (const s of sessions) await createSession(programId, toSessionData(s));
      } else {
        const program = await updateProgram(initial.id, meta);
        programId = program.id;
        const toDelete = initial.sessions
          .map((s) => s.id)
          .filter((id) => !sessions.some((s) => s.id === id));
        for (const id of toDelete) await deleteSession(programId, id);
        for (const s of sessions) {
          if (s.id) await updateSession(programId, s.id, toSessionData(s));
          else await createSession(programId, toSessionData(s));
        }
      }

      const { fetchProgram } = useProgramStore.getState();
      await fetchProgram(programId);
      const updated = useProgramStore.getState().selectedProgram!;
      onSaved(updated);
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </button>

      <h2 className="font-display text-xl font-black text-foreground">
        {initial ? 'Modifier le programme' : 'Créer un programme'}
      </h2>

      {/* ── Live duration ─────────────────────────────── */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-primary/70">
          Estimation temps réel
        </p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { val: sessions.length, lbl: 'Séances' },
            { val: liveStats.totalEx, lbl: 'Exercices' },
            { val: liveStats.totalSets, lbl: 'Séries' },
            { val: liveStats.avgMin > 0 ? `~${liveStats.avgMin}` : '—', lbl: 'min/séance', gold: true },
          ].map(({ val, lbl, gold }) => (
            <div key={lbl} className="flex flex-col items-center rounded-lg border border-border bg-card py-2 px-1">
              <span className={`font-display text-lg font-black ${gold ? 'text-xp' : 'text-primary'}`}>
                {val}
              </span>
              <span className="text-center text-[9px] text-muted-foreground leading-tight mt-0.5">{lbl}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Program info ──────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Informations</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-muted-foreground font-semibold">Nom FR *</label>
            <input
              value={nameFr} onChange={(e) => setNameFr(e.target.value)}
              placeholder="ex : Full Body Débutant"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-muted-foreground font-semibold">Nom EN *</label>
            <input
              value={nameEn} onChange={(e) => setNameEn(e.target.value)}
              placeholder="ex : Full Body Beginner"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-muted-foreground font-semibold">Description FR</label>
            <input
              value={descFr} onChange={(e) => setDescFr(e.target.value)}
              placeholder="Description courte"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-muted-foreground font-semibold">Description EN</label>
            <input
              value={descEn} onChange={(e) => setDescEn(e.target.value)}
              placeholder="Short description"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-muted-foreground font-semibold">Niveau *</label>
            <select
              value={level} onChange={(e) => setLevel(e.target.value as Level)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none"
            >
              {levelOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-muted-foreground font-semibold">Jours / semaine *</label>
            <input
              type="number" min={1} max={7} value={daysPerWeek}
              onChange={(e) => setDaysPerWeek(Number(e.target.value))}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1 col-span-2">
            <label className="text-[11px] text-muted-foreground font-semibold">Durée (semaines)</label>
            <input
              type="number" min={1} value={durationWeeks}
              onChange={(e) => setDurationWeeks(e.target.value)}
              placeholder="Optionnel"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[11px] text-muted-foreground font-semibold">Équipement</label>
          <div className="flex flex-wrap gap-2">
            {equipmentOptions.map((o) => (
              <button
                key={o.value} type="button" onClick={() => toggleEquipment(o.value)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  equipment.includes(o.value)
                    ? 'border-primary/60 bg-primary/15 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sessions ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Séances ({sessions.length})
        </p>
        <button
          type="button" onClick={addSession}
          className="flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20"
        >
          <Plus className="h-3.5 w-3.5" />
          Ajouter
        </button>
      </div>

      {sessions.map((session, sIdx) => {
        const sessionMin = sessionEstimateMinutes(session);
        return (
          <div key={session._key} className="overflow-hidden rounded-xl border border-border bg-card">
            {/* Session header */}
            <div className="flex items-center gap-2 border-b border-border bg-white/[0.02] px-3 py-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 font-display text-[11px] font-black text-primary">
                {sIdx + 1}
              </span>
              <div className="grid flex-1 grid-cols-2 gap-2">
                <input
                  value={session.nameFr}
                  onChange={(e) => updateSessionField(session._key, 'nameFr', e.target.value)}
                  placeholder="Nom FR *"
                  className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
                />
                <input
                  value={session.nameEn}
                  onChange={(e) => updateSessionField(session._key, 'nameEn', e.target.value)}
                  placeholder="Name EN *"
                  className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
                />
              </div>
              {sessionMin > 0 && (
                <span className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-xp">
                  <Clock className="h-3 w-3" />
                  ~{sessionMin}m
                </span>
              )}
              <div className="flex gap-0.5 shrink-0">
                <button type="button" onClick={() => moveSession(session._key, -1)} disabled={sIdx === 0} className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => moveSession(session._key, 1)} disabled={sIdx === sessions.length - 1} className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => removeSession(session._key)} className="rounded p-1 text-muted-foreground hover:text-red-400">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex gap-3 border-b border-border px-3 py-1.5">
              <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <span className="inline-block h-2 w-2 rounded-sm border border-primary/40 bg-primary/10" />
                Repos↕ entre séries
              </span>
              <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <span className="inline-block h-2 w-2 rounded-sm border border-xp/40 bg-xp/10" />
                Trans→ avant exercice suivant
              </span>
            </div>

            {/* Exercises */}
            <div className="divide-y divide-border">
              {session.exercises.map((ex, eIdx) => (
                <div key={ex._key} className="flex items-center gap-2 px-3 py-2.5">
                  <span className="w-4 shrink-0 text-center text-[10px] font-bold text-muted-foreground">{eIdx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground font-display truncate">{ex._name || ex.exerciseId}</p>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        Séries
                        <input type="number" min={1} value={ex.sets}
                          onChange={(e) => updateExerciseField(session._key, ex._key, 'sets', Number(e.target.value))}
                          className="w-11 rounded border border-border bg-background px-1.5 py-0.5 text-[11px] font-bold text-foreground text-center focus:outline-none"
                        />
                      </label>
                      {ex._type === 'reps' ? (
                        <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          Reps
                          <input type="number" min={1} value={ex.reps ?? ''}
                            onChange={(e) => updateExerciseField(session._key, ex._key, 'reps', e.target.value ? Number(e.target.value) : null)}
                            className="w-11 rounded border border-border bg-background px-1.5 py-0.5 text-[11px] font-bold text-foreground text-center focus:outline-none"
                          />
                        </label>
                      ) : (
                        <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          Durée (s)
                          <input type="number" min={1} value={ex.durationSeconds ?? ''}
                            onChange={(e) => updateExerciseField(session._key, ex._key, 'durationSeconds', e.target.value ? Number(e.target.value) : null)}
                            className="w-14 rounded border border-border bg-background px-1.5 py-0.5 text-[11px] font-bold text-xp text-center focus:outline-none"
                          />
                        </label>
                      )}
                      <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        Repos↕
                        <input type="number" min={0} value={ex.restBetweenSetsSeconds}
                          onChange={(e) => updateExerciseField(session._key, ex._key, 'restBetweenSetsSeconds', Number(e.target.value))}
                          className="w-11 rounded border border-primary/30 bg-primary/5 px-1.5 py-0.5 text-[11px] font-bold text-foreground text-center focus:outline-none"
                        />
                        <span className="text-[9px]">s</span>
                      </label>
                      <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        Trans→
                        <input type="number" min={0} value={ex.restAfterExerciseSeconds}
                          onChange={(e) => updateExerciseField(session._key, ex._key, 'restAfterExerciseSeconds', Number(e.target.value))}
                          className="w-11 rounded border border-xp/30 bg-xp/5 px-1.5 py-0.5 text-[11px] font-bold text-foreground text-center focus:outline-none"
                        />
                        <span className="text-[9px]">s</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-0.5">
                    <button type="button" onClick={() => moveExercise(session._key, ex._key, -1)} disabled={eIdx === 0} className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button type="button" onClick={() => moveExercise(session._key, ex._key, 1)} disabled={eIdx === session.exercises.length - 1} className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    <button type="button" onClick={() => removeExercise(session._key, ex._key)} className="rounded p-1 text-muted-foreground hover:text-red-400">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add exercise */}
            <button
              type="button" onClick={() => openPicker(session._key)}
              className="flex w-full items-center justify-center gap-1.5 border-t border-dashed border-border py-2.5 text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter un exercice
            </button>
          </div>
        );
      })}

      {saveError && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-red-400">
          {saveError}
        </div>
      )}

      <div className="flex gap-3 pb-4">
        <button
          type="button" onClick={onBack}
          className="flex-1 rounded-lg border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-white/5"
        >
          Annuler
        </button>
        <GlowButton variant="primary" className="flex-1" onClick={handleSave} disabled={saving}>
          {saving ? 'Enregistrement…' : initial ? 'Enregistrer' : 'Créer le programme'}
        </GlowButton>
      </div>

      {/* Exercise picker modal */}
      {pickerSession && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/70">
          <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-border bg-card shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <p className="font-display text-sm font-bold text-foreground">Choisir un exercice</p>
              </div>
              <button onClick={() => setPickerSession(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="border-b border-border p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoFocus value={pickerSearch} onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Rechercher…"
                  className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
                />
              </div>
            </div>
            <div className="overflow-y-auto divide-y divide-border">
              {filteredExercises.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">Aucun exercice trouvé</p>
              ) : (
                filteredExercises.map((ex) => (
                  <button
                    key={ex.id} onClick={() => addExerciseToSession(pickerSession, ex)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-sm font-bold text-foreground">{ex.nameFr}</p>
                      <p className="text-xs text-muted-foreground">
                        {ex.category} · {ex.level} · {ex.type === 'duration' ? 'Durée' : 'Reps'}
                      </p>
                    </div>
                    <Plus className="h-4 w-4 shrink-0 text-primary" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
