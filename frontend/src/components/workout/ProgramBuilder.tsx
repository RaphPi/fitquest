import { useState, useCallback, useMemo } from 'react';
import { ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, Search, X, Clock, Layers, Info, SlidersHorizontal } from 'lucide-react';
import { useProgramStore } from '@/stores/programStore';
import type { ProgramFormData, SessionExerciseInput } from '@/stores/programStore';
import { useExerciseStore } from '@/stores/exerciseStore';
import GlowButton from '@/components/ui/GlowButton';
import NumberStepper from '@/components/ui/NumberStepper';
import SetsFlow from '@/components/workout/SetsFlow';
import ExerciseInfoModal from '@/components/workout/ExerciseInfoModal';
import type { Program, Level, Equipment, Exercise, Category } from '@/types';
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

const categoryLabels: Record<Category, string> = {
  push: 'Push', pull: 'Pull', legs: 'Jambes', core: 'Core', cardio: 'Cardio', back: 'Dos',
};

const categoryColors: Record<Category, string> = {
  push: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300',
  pull: 'border-violet-500/40 bg-violet-500/10 text-violet-300',
  legs: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  core: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  cardio: 'border-red-500/40 bg-red-500/10 text-red-300',
  back: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
};

const equipmentBadgeLabels: Record<Equipment, string> = {
  none: 'Corps', dumbbells: 'Haltères', barbell: 'Barre',
  pull_bar: 'Traction', other: 'Autre',
};

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

function deriveEquipment(sessions: DraftSession[], exMap: Map<string, Exercise>): Equipment[] {
  const set = new Set<Equipment>();
  for (const s of sessions) {
    for (const ex of s.exercises) {
      const found = exMap.get(ex.exerciseId);
      if (found) set.add(found.equipment as Equipment);
    }
  }
  return Array.from(set);
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
  const [pickerCategoryFilter, setPickerCategoryFilter] = useState<Category | null>(null);
  const [pickerEquipmentFilter, setPickerEquipmentFilter] = useState<Equipment | null>(null);
  const [pickerShowFilters, setPickerShowFilters] = useState(false);
  const [infoExercise, setInfoExercise] = useState<Exercise | null>(null);

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
    setPickerCategoryFilter(null);
    setPickerEquipmentFilter(null);
    setPickerShowFilters(false);
  }, [exercises.length, fetchExercises]);

  const filteredExercises = useMemo(() => {
    let list = exercises;
    const q = pickerSearch.trim().toLowerCase();
    if (q) list = list.filter((e) => e.nameFr.toLowerCase().includes(q) || e.nameEn.toLowerCase().includes(q));
    if (pickerCategoryFilter) list = list.filter((e) => e.category === pickerCategoryFilter);
    if (pickerEquipmentFilter) list = list.filter((e) => e.equipment === pickerEquipmentFilter);
    return list;
  }, [exercises, pickerSearch, pickerCategoryFilter, pickerEquipmentFilter]);

  const addExerciseToSession = (sessionKey: string, ex: Exercise) => {
    setSessions((prev) => {
      const next = prev.map((s) => {
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
      });
      // auto-update equipment
      setEquipment(deriveEquipment(next, exMap));
      return next;
    });
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

  const updateExField = (sessionKey: string, exKey: string, field: string, value: number | null) =>
    setSessions((prev) =>
      prev.map((s) => {
        if (s._key !== sessionKey) return s;
        return { ...s, exercises: s.exercises.map((e) => e._key === exKey ? { ...e, [field]: value } : e) };
      }),
    );

  const removeExercise = (sessionKey: string, exKey: string) =>
    setSessions((prev) =>
      prev.map((s) => {
        if (s._key !== sessionKey) return s;
        const next = { ...s, exercises: s.exercises.filter((e) => e._key !== exKey).map((e, i) => ({ ...e, order: i })) };
        setEquipment(deriveEquipment([next, ...prev.filter(x => x._key !== sessionKey)], exMap));
        return next;
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
        const toDelete = initial.sessions.map((s) => s.id).filter((id) => !sessions.some((s) => s.id === id));
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

  const pickerHasFilters = pickerCategoryFilter !== null || pickerEquipmentFilter !== null;

  return (
    <div className="relative flex flex-col gap-4 pb-24">
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

      {/* ── Live stats ─────────────────────────────────── */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-primary/70">Estimation temps réel</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { val: sessions.length, lbl: 'Séances' },
            { val: liveStats.totalEx, lbl: 'Exercices' },
            { val: liveStats.totalSets, lbl: 'Séries' },
            { val: liveStats.avgMin > 0 ? `~${liveStats.avgMin}` : '—', lbl: 'min/séance', gold: true },
          ].map(({ val, lbl, gold }) => (
            <div key={lbl} className="flex flex-col items-center rounded-lg border border-border bg-card py-2 px-1">
              <span className={`font-display text-lg font-black ${gold ? 'text-xp' : 'text-primary'}`}>{val}</span>
              <span className="text-center text-[9px] text-muted-foreground leading-tight mt-0.5">{lbl}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Program info ───────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Informations</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-muted-foreground font-semibold">Nom FR *</label>
            <input value={nameFr} onChange={(e) => setNameFr(e.target.value)}
              placeholder="ex : Full Body Débutant"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-muted-foreground font-semibold">Nom EN *</label>
            <input value={nameEn} onChange={(e) => setNameEn(e.target.value)}
              placeholder="ex : Full Body Beginner"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-muted-foreground font-semibold">Description FR</label>
            <input value={descFr} onChange={(e) => setDescFr(e.target.value)}
              placeholder="Description courte"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-muted-foreground font-semibold">Description EN</label>
            <input value={descEn} onChange={(e) => setDescEn(e.target.value)}
              placeholder="Short description"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-muted-foreground font-semibold">Niveau *</label>
            <select value={level} onChange={(e) => setLevel(e.target.value as Level)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none"
            >
              {levelOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-muted-foreground font-semibold">Jours / semaine *</label>
            <NumberStepper value={daysPerWeek} min={1} max={7} onChange={setDaysPerWeek} variant="primary" className="w-full" />
          </div>
          <div className="flex flex-col gap-1 col-span-2">
            <label className="text-[11px] text-muted-foreground font-semibold">Durée (semaines) <span className="font-normal italic text-muted-foreground">— optionnel</span></label>
            <div className="flex items-center gap-3">
              <NumberStepper value={durationWeeks ? Number(durationWeeks) : 0} min={0} max={52} suffix="sem."
                onChange={(v) => setDurationWeeks(v === 0 ? '' : String(v))} variant="default" className="w-auto" />
              {durationWeeks && (
                <button type="button" onClick={() => setDurationWeeks('')} className="text-xs text-muted-foreground underline hover:text-foreground">Effacer</button>
              )}
            </div>
          </div>
        </div>

        {/* Equipment — auto-updated but still editable */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-muted-foreground font-semibold">Équipement</label>
            <span className="text-[9px] text-muted-foreground italic">(mis à jour automatiquement)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {equipmentOptions.map((o) => (
              <button key={o.value} type="button" onClick={() => toggleEquipment(o.value)}
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

      {/* ── Sessions ───────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Séances ({sessions.length})
        </p>
        <button type="button" onClick={addSession}
          className="flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20"
        >
          <Plus className="h-3.5 w-3.5" />
          Ajouter
        </button>
      </div>

      {sessions.map((session, sIdx) => {
        const sessionMin = sessionEstimateMinutes(session);
        // collect equipment badges for this session
        const sessionEquipment = Array.from(new Set(
          session.exercises.map((ex) => exMap.get(ex.exerciseId)?.equipment as Equipment).filter(Boolean)
        ));
        return (
          <div key={session._key} className="overflow-hidden rounded-xl border border-border bg-card">
            {/* Session header */}
            <div className="flex items-center gap-2 border-b border-border bg-white/[0.02] px-3 py-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 font-display text-[11px] font-black text-primary">
                {sIdx + 1}
              </span>
              <div className="grid flex-1 grid-cols-2 gap-2">
                <input value={session.nameFr}
                  onChange={(e) => updateSessionField(session._key, 'nameFr', e.target.value)}
                  placeholder="Nom FR *"
                  className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
                />
                <input value={session.nameEn}
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
                <button type="button" onClick={() => moveSession(session._key, -1)} disabled={sIdx === 0}
                  className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => moveSession(session._key, 1)} disabled={sIdx === sessions.length - 1}
                  className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => removeSession(session._key)}
                  className="rounded p-1 text-muted-foreground hover:text-red-400">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Session equipment badges */}
            {sessionEquipment.length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-b border-border px-3 py-1.5">
                {sessionEquipment.map((eq) => (
                  <span key={eq} className="rounded-full border border-border bg-white/5 px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">
                    {equipmentBadgeLabels[eq]}
                  </span>
                ))}
              </div>
            )}

            {/* Exercises */}
            <div className="divide-y divide-border">
              {session.exercises.map((ex, eIdx) => {
                const exInfo = exMap.get(ex.exerciseId);
                const exEquipment = exInfo?.equipment as Equipment | undefined;
                const exCategory = exInfo?.category as Category | undefined;
                return (
                  <div key={ex._key} className="px-3 py-3 flex flex-col gap-2">
                    {/* Exercise header row */}
                    <div className="flex items-center gap-2">
                      <span className="w-4 shrink-0 text-center text-[10px] font-bold text-muted-foreground">{eIdx + 1}</span>
                      <div className="flex-1 min-w-0 flex items-center gap-1.5">
                        <p className="font-display text-xs font-bold text-foreground truncate">{ex._name || ex.exerciseId}</p>
                        {/* Info icon */}
                        {exInfo && (
                          <button
                            type="button"
                            onClick={() => setInfoExercise(exInfo)}
                            className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-primary transition-colors"
                            title="Voir la fiche exercice"
                          >
                            <Info className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      {/* Badges */}
                      <div className="flex gap-1 shrink-0">
                        {exCategory && (
                          <span className={`rounded-full border px-1.5 py-0.5 text-[8px] font-bold uppercase ${categoryColors[exCategory]}`}>
                            {categoryLabels[exCategory]}
                          </span>
                        )}
                        {exEquipment && exEquipment !== 'none' && (
                          <span className="rounded-full border border-border bg-white/5 px-1.5 py-0.5 text-[8px] font-semibold text-muted-foreground">
                            {equipmentBadgeLabels[exEquipment]}
                          </span>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-0.5">
                        <button type="button" onClick={() => moveExercise(session._key, ex._key, -1)} disabled={eIdx === 0}
                          className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button type="button" onClick={() => moveExercise(session._key, ex._key, 1)} disabled={eIdx === session.exercises.length - 1}
                          className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
                          <ChevronDown className="h-3 w-3" />
                        </button>
                        <button type="button" onClick={() => removeExercise(session._key, ex._key)}
                          className="rounded p-1 text-muted-foreground hover:text-red-400">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Fields: 2×2 grid — [Séries | Transition] / [Reps/Durée | Repos] */}
                    <div className="ml-6 grid grid-cols-2 gap-x-3 gap-y-2.5">
                      {/* Row 1: Séries | Transition */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Séries</span>
                        <NumberStepper
                          value={ex.sets} min={1} max={20}
                          onChange={(v) => updateExField(session._key, ex._key, 'sets', v)}
                          variant="default" className="w-full"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-primary/70">Transition</span>
                        <NumberStepper
                          value={ex.restBetweenSetsSeconds} min={0} max={300} step={5} suffix="s"
                          onChange={(v) => updateExField(session._key, ex._key, 'restBetweenSetsSeconds', v)}
                          variant="primary" className="w-full"
                        />
                      </div>

                      {/* Row 2: Reps/Durée | Repos */}
                      {ex._type === 'reps' ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Reps</span>
                          <NumberStepper
                            value={ex.reps ?? 1} min={1} max={100}
                            onChange={(v) => updateExField(session._key, ex._key, 'reps', v)}
                            variant="default" className="w-full"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-cyan-400/80">Durée</span>
                          <NumberStepper
                            value={ex.durationSeconds ?? 30} min={5} max={600} step={5} suffix="s"
                            onChange={(v) => updateExField(session._key, ex._key, 'durationSeconds', v)}
                            variant="cyan" className="w-full"
                          />
                        </div>
                      )}
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-xp/70">Repos</span>
                        <NumberStepper
                          value={ex.restAfterExerciseSeconds} min={0} max={300} step={5} suffix="s"
                          onChange={(v) => updateExField(session._key, ex._key, 'restAfterExerciseSeconds', v)}
                          variant="gold" className="w-full"
                        />
                      </div>
                    </div>

                    {/* Sets flow preview */}
                    <div className="ml-6 mt-0.5">
                      <SetsFlow
                        sets={ex.sets}
                        reps={ex.reps}
                        durationSeconds={ex.durationSeconds}
                        restBetweenSetsSeconds={ex.restBetweenSetsSeconds}
                        isDuration={ex._type === 'duration'}
                        compact
                      />
                    </div>

                    {/* Repos separator (inter-exercise, shown if not last) */}
                    {eIdx < session.exercises.length - 1 && (
                      <div className="ml-6 flex items-center gap-2 pt-1">
                        <div className="h-0.5 flex-1"
                          style={{
                            background: 'repeating-linear-gradient(to right,rgba(234,179,8,.7) 0,rgba(234,179,8,.7) 4px,transparent 4px,transparent 10px)',
                          }}
                        />
                        <span className="text-[9px] font-semibold whitespace-nowrap" style={{ color: 'rgba(234,179,8,1)' }}>
                          Repos {ex.restAfterExerciseSeconds}s
                        </span>
                        <div className="h-0.5 flex-1"
                          style={{
                            background: 'repeating-linear-gradient(to right,rgba(234,179,8,.7) 0,rgba(234,179,8,.7) 4px,transparent 4px,transparent 10px)',
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add exercise */}
            <button type="button" onClick={() => openPicker(session._key)}
              className="flex w-full items-center justify-center gap-2 border-t-2 border-primary/40 bg-primary/20 py-3.5 text-sm font-bold font-display uppercase tracking-wider text-primary hover:bg-primary/30 active:bg-primary/40 transition-colors"
            >
              <Plus className="h-4 w-4" />
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

      {/* ── Sticky save bar ────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm px-4 py-3 flex gap-3 md:left-16 lg:left-56">
        <button type="button" onClick={onBack}
          className="flex-1 rounded-lg border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-white/5 transition-colors"
        >
          Annuler
        </button>
        <GlowButton variant="primary" className="flex-1" onClick={handleSave} disabled={saving}>
          {saving ? 'Enregistrement…' : initial ? 'Enregistrer' : 'Créer le programme'}
        </GlowButton>
      </div>

      {/* ── Exercise picker modal ──────────────────────── */}
      {pickerSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 sm:p-6">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl flex flex-col" style={{ maxHeight: 'min(85vh, 600px)' }}>
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <p className="font-display text-sm font-bold text-foreground">Choisir un exercice</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPickerShowFilters((v) => !v)}
                  className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs transition-colors ${
                    pickerShowFilters || pickerHasFilters
                      ? 'border-primary/60 bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filtres
                  {pickerHasFilters && (
                    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-black text-white">
                      {(pickerCategoryFilter ? 1 : 0) + (pickerEquipmentFilter ? 1 : 0)}
                    </span>
                  )}
                </button>
                <button onClick={() => setPickerSession(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Search */}
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

            {/* Filters */}
            {pickerShowFilters && (
              <div className="border-b border-border p-3 space-y-3">
                <div className="space-y-1.5">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Catégorie</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(categoryLabels) as Category[]).map((cat) => (
                      <button key={cat} type="button"
                        onClick={() => setPickerCategoryFilter(pickerCategoryFilter === cat ? null : cat)}
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                          pickerCategoryFilter === cat
                            ? categoryColors[cat]
                            : 'border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {categoryLabels[cat]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Équipement</p>
                  <div className="flex flex-wrap gap-1.5">
                    {equipmentOptions.map((o) => (
                      <button key={o.value} type="button"
                        onClick={() => setPickerEquipmentFilter(pickerEquipmentFilter === o.value ? null : o.value)}
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                          pickerEquipmentFilter === o.value
                            ? 'border-primary/60 bg-primary/15 text-primary'
                            : 'border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
                {pickerHasFilters && (
                  <button
                    type="button"
                    onClick={() => { setPickerCategoryFilter(null); setPickerEquipmentFilter(null); }}
                    className="text-[10px] font-semibold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  >
                    Effacer les filtres
                  </button>
                )}
              </div>
            )}

            {/* Results */}
            <div className="overflow-y-auto divide-y divide-border">
              {filteredExercises.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">Aucun exercice trouvé</p>
              ) : (
                filteredExercises.map((ex) => (
                  <button key={ex.id} onClick={() => addExerciseToSession(pickerSession, ex)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-sm font-bold text-foreground">{ex.nameFr}</p>
                      <div className="mt-0.5 flex gap-1.5">
                        <span className={`rounded-full border px-1.5 py-px text-[9px] font-bold uppercase ${categoryColors[ex.category as Category]}`}>
                          {categoryLabels[ex.category as Category]}
                        </span>
                        <span className="text-xs text-muted-foreground">{ex.type === 'duration' ? 'Durée' : 'Reps'}</span>
                        {ex.equipment !== 'none' && (
                          <span className="text-xs text-muted-foreground">{equipmentBadgeLabels[ex.equipment as Equipment]}</span>
                        )}
                      </div>
                    </div>
                    <Plus className="h-4 w-4 shrink-0 text-primary" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Exercise info modal */}
      {infoExercise && (
        <ExerciseInfoModal exercise={infoExercise} onClose={() => setInfoExercise(null)} />
      )}
    </div>
  );
}
