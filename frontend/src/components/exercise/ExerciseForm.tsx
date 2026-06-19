import { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { Exercise, Category, Equipment, Level, ExerciseType } from '@/types';
import type { ExerciseFormData } from '@/stores/exerciseStore';
import GlowButton from '@/components/ui/GlowButton';

interface ExerciseFormProps {
  initial?: Exercise;
  onSubmit: (data: ExerciseFormData) => Promise<void>;
  onClose: () => void;
  isSaving: boolean;
}

const categories: Category[] = ['push', 'pull', 'legs', 'core', 'cardio', 'back'];
const equipments: Equipment[] = ['none', 'dumbbells', 'barbell', 'pull_bar', 'other'];
const levels: Level[] = ['beginner', 'intermediate', 'advanced'];

function tagsToList(s: string): string[] {
  return s.split(',').map((t) => t.trim()).filter(Boolean);
}

function listToTags(arr: string[]): string {
  return arr.join(', ');
}

interface FormState {
  nameFr: string;
  nameEn: string;
  category: Category;
  equipment: Equipment;
  level: Level;
  type: ExerciseType;
  musclesPrimary: string;
  musclesSecondary: string;
  instructionsFr: string;
  instructionsEn: string;
  tipsFr: string;
  tipsEn: string;
  variations: string;
}

function initForm(ex?: Exercise): FormState {
  return {
    nameFr: ex?.nameFr ?? '',
    nameEn: ex?.nameEn ?? '',
    category: ex?.category ?? 'push',
    equipment: ex?.equipment ?? 'none',
    level: ex?.level ?? 'beginner',
    type: ex?.type ?? 'reps',
    musclesPrimary: ex ? listToTags(ex.musclesPrimary) : '',
    musclesSecondary: ex ? listToTags(ex.musclesSecondary) : '',
    instructionsFr: ex?.instructionsFr ?? '',
    instructionsEn: ex?.instructionsEn ?? '',
    tipsFr: ex?.tipsFr ?? '',
    tipsEn: ex?.tipsEn ?? '',
    variations: ex ? listToTags(ex.variations) : '',
  };
}

const inputClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40';
const labelClass = 'block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1';
const selectClass = cn(inputClass, 'cursor-pointer');

export default function ExerciseForm({ initial, onSubmit, onClose, isSaving }: ExerciseFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(initForm(initial));
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof FormState, value: string) =>
    setForm((s) => ({ ...s, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameFr.trim() || !form.instructionsFr.trim()) {
      setError(t('library.form.errorRequired'));
      return;
    }
    setError(null);
    const data: ExerciseFormData = {
      nameFr: form.nameFr.trim(),
      nameEn: form.nameEn.trim() || form.nameFr.trim(),
      category: form.category,
      equipment: form.equipment,
      level: form.level,
      type: form.type,
      musclesPrimary: tagsToList(form.musclesPrimary),
      musclesSecondary: tagsToList(form.musclesSecondary),
      instructionsFr: form.instructionsFr.trim(),
      instructionsEn: form.instructionsEn.trim() || form.instructionsFr.trim(),
      tipsFr: form.tipsFr.trim() || null,
      tipsEn: form.tipsEn.trim() || null,
      variations: tagsToList(form.variations),
    };
    await onSubmit(data);
  };

  const isEdit = !!initial;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-lg font-black text-foreground">
            {isEdit ? t('library.form.editTitle') : t('library.form.createTitle')}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-border hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
            {/* Nom */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>{t('library.form.nameFr')}</label>
                <input
                  className={inputClass}
                  value={form.nameFr}
                  onChange={(e) => set('nameFr', e.target.value)}
                  placeholder={t('library.form.nameFrPlaceholder')}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>{t('library.form.nameEn')}</label>
                <input
                  className={inputClass}
                  value={form.nameEn}
                  onChange={(e) => set('nameEn', e.target.value)}
                  placeholder={t('library.form.nameEnPlaceholder')}
                />
              </div>
            </div>

            {/* Catégorie / Équipement / Niveau / Type */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <label className={labelClass}>{t('library.form.category')}</label>
                <select className={selectClass} value={form.category} onChange={(e) => set('category', e.target.value)}>
                  {categories.map((c) => <option key={c} value={c}>{t(`library.category.${c}`)}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('library.form.equipment')}</label>
                <select className={selectClass} value={form.equipment} onChange={(e) => set('equipment', e.target.value)}>
                  {equipments.map((eq) => <option key={eq} value={eq}>{t(`library.equipment.${eq}`)}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('library.form.level')}</label>
                <select className={selectClass} value={form.level} onChange={(e) => set('level', e.target.value)}>
                  {levels.map((lv) => <option key={lv} value={lv}>{t(`library.level.${lv}`)}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('library.form.type')}</label>
                <select className={selectClass} value={form.type} onChange={(e) => set('type', e.target.value)}>
                  <option value="reps">{t('library.type.reps')}</option>
                  <option value="duration">{t('library.type.duration')}</option>
                </select>
              </div>
            </div>

            {/* Muscles */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>{t('library.form.musclesPrimary')}</label>
                <input
                  className={inputClass}
                  value={form.musclesPrimary}
                  onChange={(e) => set('musclesPrimary', e.target.value)}
                  placeholder={t('library.form.musclesPrimaryPlaceholder')}
                />
                <p className="mt-1 text-[11px] text-muted-foreground">{t('library.form.separatedByCommas')}</p>
              </div>
              <div>
                <label className={labelClass}>{t('library.form.musclesSecondary')}</label>
                <input
                  className={inputClass}
                  value={form.musclesSecondary}
                  onChange={(e) => set('musclesSecondary', e.target.value)}
                  placeholder={t('library.form.musclesSecondaryPlaceholder')}
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>{t('library.form.instructionsFr')}</label>
                <textarea
                  className={cn(inputClass, 'min-h-[100px] resize-y')}
                  value={form.instructionsFr}
                  onChange={(e) => set('instructionsFr', e.target.value)}
                  placeholder={t('library.form.instructionsFrPlaceholder')}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>{t('library.form.instructionsEn')}</label>
                <textarea
                  className={cn(inputClass, 'min-h-[100px] resize-y')}
                  value={form.instructionsEn}
                  onChange={(e) => set('instructionsEn', e.target.value)}
                  placeholder={t('library.form.instructionsEnPlaceholder')}
                />
              </div>
            </div>

            {/* Tips */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>{t('library.form.tipsFr')}</label>
                <textarea
                  className={cn(inputClass, 'min-h-[72px] resize-y')}
                  value={form.tipsFr}
                  onChange={(e) => set('tipsFr', e.target.value)}
                  placeholder={t('library.form.tipsFrPlaceholder')}
                />
              </div>
              <div>
                <label className={labelClass}>{t('library.form.tipsEn')}</label>
                <textarea
                  className={cn(inputClass, 'min-h-[72px] resize-y')}
                  value={form.tipsEn}
                  onChange={(e) => set('tipsEn', e.target.value)}
                  placeholder={t('library.form.tipsEnPlaceholder')}
                />
              </div>
            </div>

            {error && (
              <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-red-400">{error}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 border-t border-border px-5 py-4">
            <GlowButton type="button" variant="danger" size="sm" onClick={onClose} className="flex-1" disabled={isSaving}>
              {t('library.form.cancel')}
            </GlowButton>
            <GlowButton type="submit" variant="primary" size="sm" className="flex-1" disabled={isSaving}>
              {isSaving ? t('library.form.saving') : isEdit ? t('library.form.save') : t('library.form.create')}
            </GlowButton>
          </div>
        </form>
      </div>
    </div>
  );
}
