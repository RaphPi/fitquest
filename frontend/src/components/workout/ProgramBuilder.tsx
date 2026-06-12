import { useState, useCallback } from 'react';
import { ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, Search, X } from 'lucide-react';
import { useProgramStore } from '@/stores/programStore';
import type { ProgramFormData, SessionExerciseInput } from '@/stores/programStore';
import { useExerciseStore } from '@/stores/exerciseStore';
import GlowButton from '@/components/ui/GlowButton';
import type { Program, Level, Equipment, Exercise } from '@/types';

interface ProgramBuilderProps {
  initial?: Program;
  onBack: () => void;
  onSaved: (program: Program) => void;
}

type DraftExercise = SessionExerciseInput & { _name: string; _type: 'reps' | 'duration' };

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

function initFromProgram(program: Program): DraftSession[] {
  return program.sessions.map((s) => ({
    _key: nextKey(),
    id: s.id,
    nameFr: s.nameFr,
    nameEn: s.nameEn,
    order: s.order,
    exercises: s.exercises.map((se) => ({
      _key: nextKey(),
      exerciseId: se.exerciseId,
      _name: '',
      _type: 'reps' as const,
      order: se.order,
      sets: se.sets,
      reps: se.reps ?? null,
      durationSeconds: se.durationSeconds ?? null,
      restSeconds: se.restSeconds,
    })),
  }));
}

export default function ProgramBuilder({ initial, onBack, onSaved }: ProgramBuilderProps) {
  const { createProgram, updateProgram, createSession, updateSession, deleteSession } = useProgramStore();
  const { exercises, fetchExercises } = useExerciseStore();

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

  const [sessions, setSessions] = useState<DraftSession[]>(
    initial ? initFromProgram(initial) : [makeDefaultSession(0)],
  );

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Exercise picker state
  const [pickerSession, setPickerSession] = useState<string | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');

  const openPicker = useCallback(
    (sessionKey: string) => {
      if (exercises.length === 0) fetchExercises();
      setPickerSession(sessionKey);
      setPickerSearch('');
    },
    [exercises.length, fetchExercises],
  );

  const closePicker = () => setPickerSession(null);

  const filteredExercises: Exercise[] = pickerSearch.trim()
    ? exercises.filter(
        (e) =>
          e.nameFr.toLowerCase().includes(pickerSearch.toLowerCase()) ||
          e.nameEn.toLowerCase().includes(pickerSearch.toLowerCase()),
      )
    : exercises;

  const addExerciseToSession = (sessionKey: string, ex: Exercise) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s._key !== sessionKey) return s;
        const order = s.exercises.length;
        return {
          ...s,
          exercises: [
            ...s.exercises,
            {
              _key: nextKey(),
              exerciseId: ex.id,
              _name: ex.nameFr,
              _type: ex.type as 'reps' | 'duration',
              order,
              sets: 3,
              reps: ex.type === 'reps' ? 10 : null,
              durationSeconds: ex.type === 'duration' ? 30 : null,
              restSeconds: 60,
            },
          ],
        };
      }),
    );
    closePicker();
  };

  const toggleEquipment = (eq: Equipment) => {
    setEquipment((prev) =>
      prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq],
    );
  };

  const addSession = () => {
    setSessions((prev) => [...prev, makeDefaultSession(prev.length)]);
  };

  const removeSession = (key: string) => {
    setSessions((prev) => prev.filter((s) => s._key !== key).map((s, i) => ({ ...s, order: i })));
  };

  const moveSession = (key: string, dir: -1 | 1) => {
    setSessions((prev) => {
      const idx = prev.findIndex((s) => s._key === key);
      if (idx < 0) return prev;
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next.map((s, i) => ({ ...s, order: i }));
    });
  };

  const updateSessionField = (key: string, field: 'nameFr' | 'nameEn', value: string) => {
    setSessions((prev) => prev.map((s) => (s._key === key ? { ...s, [field]: value } : s)));
  };

  const updateExerciseField = (
    sessionKey: string,
    exKey: string,
    field: string,
    value: number | null,
  ) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s._key !== sessionKey) return s;
        return {
          ...s,
          exercises: s.exercises.map((e) =>
            (e as DraftExercise & { _key: string })._key === exKey ? { ...e, [field]: value } : e,
          ),
        };
      }),
    );
  };

  const removeExercise = (sessionKey: string, exKey: string) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s._key !== sessionKey) return s;
        return {
          ...s,
          exercises: s.exercises
            .filter((e) => (e as DraftExercise & { _key: string })._key !== exKey)
            .map((e, i) => ({ ...e, order: i })),
        };
      }),
    );
  };

  const moveExercise = (sessionKey: string, exKey: string, dir: -1 | 1) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s._key !== sessionKey) return s;
        const exArr = [...s.exercises];
        const idx = exArr.findIndex((e) => (e as DraftExercise & { _key: string })._key === exKey);
        if (idx < 0) return s;
        const swap = idx + dir;
        if (swap < 0 || swap >= exArr.length) return s;
        [exArr[idx], exArr[swap]] = [exArr[swap], exArr[idx]];
        return { ...s, exercises: exArr.map((e, i) => ({ ...e, order: i })) };
      }),
    );
  };

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
        nameFr: nameFr.trim(),
        nameEn: nameEn.trim(),
        descFr: descFr.trim() || undefined,
        descEn: descEn.trim() || undefined,
        level,
        daysPerWeek,
        durationWeeks: durationWeeks ? Number(durationWeeks) : null,
        equipment,
      };

      if (!initial) {
        // Create new program + sessions
        const program = await createProgram(meta);
        for (const s of sessions) {
          await createSession(program.id, {
            nameFr: s.nameFr,
            nameEn: s.nameEn,
            order: s.order,
            exercises: s.exercises.map((e) => ({
              exerciseId: e.exerciseId,
              order: e.order,
              sets: e.sets,
              reps: e.reps,
              durationSeconds: e.durationSeconds,
              restSeconds: e.restSeconds,
            })),
          });
        }
        // Refetch to get full data
        const { fetchProgram } = useProgramStore.getState();
        await fetchProgram(program.id);
        const updated = useProgramStore.getState().selectedProgram!;
        onSaved(updated);
      } else {
        // Edit existing
        const program = await updateProgram(initial.id, meta);

        const existingSessionIds = initial.sessions.map((s) => s.id);
        const draftIds = sessions.filter((s) => s.id).map((s) => s.id!);
        const toDelete = existingSessionIds.filter((id) => !draftIds.includes(id));

        for (const id of toDelete) {
          await deleteSession(program.id, id);
        }

        for (const s of sessions) {
          const sessionData = {
            nameFr: s.nameFr,
            nameEn: s.nameEn,
            order: s.order,
            exercises: s.exercises.map((e) => ({
              exerciseId: e.exerciseId,
              order: e.order,
              sets: e.sets,
              reps: e.reps,
              durationSeconds: e.durationSeconds,
              restSeconds: e.restSeconds,
            })),
          };
          if (s.id) {
            await updateSession(program.id, s.id, sessionData);
          } else {
            await createSession(program.id, sessionData);
          }
        }

        const { fetchProgram } = useProgramStore.getState();
        await fetchProgram(program.id);
        const updated = useProgramStore.getState().selectedProgram!;
        onSaved(updated);
      }
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
      </div>

      <h2 className="font-display text-xl font-black text-foreground">
        {initial ? 'Modifier le programme' : 'Créer un programme'}
      </h2>

      {/* Program meta */}
      <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Informations</p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Nom (Français) *</label>
            <input
              value={nameFr}
              onChange={(e) => setNameFr(e.target.value)}
              placeholder="ex : Full Body Débutant"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Nom (English) *</label>
            <input
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="ex : Full Body Beginner"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Description (FR)</label>
            <input
              value={descFr}
              onChange={(e) => setDescFr(e.target.value)}
              placeholder="Description courte"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Description (EN)</label>
            <input
              value={descEn}
              onChange={(e) => setDescEn(e.target.value)}
              placeholder="Short description"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Niveau *</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as Level)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none"
            >
              {levelOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Jours / semaine *</label>
            <input
              type="number"
              min={1}
              max={7}
              value={daysPerWeek}
              onChange={(e) => setDaysPerWeek(Number(e.target.value))}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Durée (semaines)</label>
            <input
              type="number"
              min={1}
              value={durationWeeks}
              onChange={(e) => setDurationWeeks(e.target.value)}
              placeholder="Optionnel"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-muted-foreground">Équipement</label>
          <div className="flex flex-wrap gap-2">
            {equipmentOptions.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => toggleEquipment(o.value)}
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

      {/* Sessions */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Séances ({sessions.length})
          </p>
          <button
            type="button"
            onClick={addSession}
            className="flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20"
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter une séance
          </button>
        </div>

        {sessions.map((session, sIdx) => (
          <div key={session._key} className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Session header */}
            <div className="flex items-center gap-2 border-b border-border bg-white/3 p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
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
              <div className="flex gap-0.5">
                <button
                  type="button"
                  onClick={() => moveSession(session._key, -1)}
                  disabled={sIdx === 0}
                  className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveSession(session._key, 1)}
                  disabled={sIdx === sessions.length - 1}
                  className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeSession(session._key)}
                  className="rounded p-1 text-muted-foreground hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Exercises */}
            <div className="divide-y divide-border">
              {session.exercises.map((ex, eIdx) => {
                const exWithKey = ex as DraftExercise & { _key: string };
                return (
                  <div key={exWithKey._key} className="flex items-center gap-2 px-3 py-2.5">
                    <span className="w-5 shrink-0 text-xs text-muted-foreground text-center">{eIdx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{ex._name || ex.exerciseId}</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <label className="flex items-center gap-1 text-xs text-muted-foreground">
                          Séries
                          <input
                            type="number"
                            min={1}
                            value={ex.sets}
                            onChange={(e) => updateExerciseField(session._key, exWithKey._key, 'sets', Number(e.target.value))}
                            className="w-12 rounded border border-border bg-background px-1.5 py-0.5 text-xs text-foreground focus:outline-none"
                          />
                        </label>
                        {ex._type === 'reps' ? (
                          <label className="flex items-center gap-1 text-xs text-muted-foreground">
                            Reps
                            <input
                              type="number"
                              min={1}
                              value={ex.reps ?? ''}
                              onChange={(e) => updateExerciseField(session._key, exWithKey._key, 'reps', e.target.value ? Number(e.target.value) : null)}
                              className="w-12 rounded border border-border bg-background px-1.5 py-0.5 text-xs text-foreground focus:outline-none"
                            />
                          </label>
                        ) : (
                          <label className="flex items-center gap-1 text-xs text-muted-foreground">
                            Durée (s)
                            <input
                              type="number"
                              min={1}
                              value={ex.durationSeconds ?? ''}
                              onChange={(e) => updateExerciseField(session._key, exWithKey._key, 'durationSeconds', e.target.value ? Number(e.target.value) : null)}
                              className="w-14 rounded border border-border bg-background px-1.5 py-0.5 text-xs text-foreground focus:outline-none"
                            />
                          </label>
                        )}
                        <label className="flex items-center gap-1 text-xs text-muted-foreground">
                          Repos (s)
                          <input
                            type="number"
                            min={0}
                            value={ex.restSeconds}
                            onChange={(e) => updateExerciseField(session._key, exWithKey._key, 'restSeconds', Number(e.target.value))}
                            className="w-14 rounded border border-border bg-background px-1.5 py-0.5 text-xs text-foreground focus:outline-none"
                          />
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      <button type="button" onClick={() => moveExercise(session._key, exWithKey._key, -1)} disabled={eIdx === 0} className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => moveExercise(session._key, exWithKey._key, 1)} disabled={eIdx === session.exercises.length - 1} className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => removeExercise(session._key, exWithKey._key)} className="rounded p-1 text-muted-foreground hover:text-red-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add exercise button */}
            <div className="p-3 border-t border-border">
              <button
                type="button"
                onClick={() => openPicker(session._key)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Ajouter un exercice
              </button>
            </div>
          </div>
        ))}
      </div>

      {saveError && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-red-400">
          {saveError}
        </div>
      )}

      <div className="flex gap-3 pb-4">
        <button
          type="button"
          onClick={onBack}
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
              <p className="font-display text-sm font-bold text-foreground">Choisir un exercice</p>
              <button onClick={closePicker} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoFocus
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
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
                    key={ex.id}
                    onClick={() => addExerciseToSession(pickerSession, ex)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{ex.nameFr}</p>
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
