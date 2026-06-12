import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useProgramStore } from '@/stores/programStore';
import type { Program } from '@/types';
import ProgramCard from '@/components/workout/ProgramCard';
import ProgramDetail from '@/components/workout/ProgramDetail';
import ProgramBuilder from '@/components/workout/ProgramBuilder';
import GlowButton from '@/components/ui/GlowButton';

type View = 'list' | 'detail' | 'builder';

export default function Workout() {
  const { programs, isLoading, isSaving, error, fetchPrograms, deleteProgram } = useProgramStore();
  const [view, setView] = useState<View>('list');
  const [activeProgram, setActiveProgram] = useState<Program | null>(null);
  const [editingProgram, setEditingProgram] = useState<Program | undefined>(undefined);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

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

  // List view
  const seedPrograms = programs.filter((p) => !p.isCustom);
  const customPrograms = programs.filter((p) => p.isCustom);

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black text-foreground">Séances</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading ? 'Chargement…' : `${programs.length} programme${programs.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <GlowButton variant="primary" size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          Créer
        </GlowButton>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-red-400">{error}</div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      ) : programs.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-base font-semibold text-foreground">Aucun programme disponible</p>
          <GlowButton variant="primary" size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            Créer le premier programme
          </GlowButton>
        </div>
      ) : (
        <>
          {seedPrograms.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Programmes officiels
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {seedPrograms.map((p) => (
                  <ProgramCard
                    key={p.id}
                    program={p}
                    onClick={() => openDetail(p)}
                  />
                ))}
              </div>
            </div>
          )}

          {customPrograms.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Mes programmes
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {customPrograms.map((p) => (
                  <ProgramCard
                    key={p.id}
                    program={p}
                    onClick={() => openDetail(p)}
                    onEdit={() => openEdit(p)}
                    onDelete={() => handleDelete(p)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {isSaving && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground shadow-lg sm:bottom-4">
          Enregistrement…
        </div>
      )}
    </section>
  );
}
