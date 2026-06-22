import { useState, useEffect, useMemo, useRef } from 'react';
import { Scale, Camera, Plus, Trash2, Pencil, X, Check, Upload, ArrowLeftRight, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useBodyStore } from '@/stores/bodyStore';
import NumberStepper from '@/components/ui/NumberStepper';
import type { BodyMetric, BodyPhoto, CustomMetric, MetricPayload } from '@/types';

// ─── Color system ─────────────────────────────────────────────────────────────

const PALETTE = [
  '#f59e0b', // amber / poids défaut
  '#6366f1', // indigo / taille défaut
  '#8b5cf6', // violet / poitrine défaut
  '#10b981', // emerald / biceps défaut
  '#0ea5e9', // sky / cuisses défaut
  '#f43f5e', // rose
  '#f97316', // orange
  '#14b8a6', // teal
];

const DEFAULT_COLORS: Record<string, string> = {
  weight: '#f59e0b',
  waistCm: '#6366f1',
  chestCm: '#8b5cf6',
  bicepCm: '#10b981',
  thighCm: '#0ea5e9',
};

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function useColorMap() {
  const [colorMap, setColorMapState] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('fq_metric_colors');
      return stored ? { ...DEFAULT_COLORS, ...JSON.parse(stored) } : { ...DEFAULT_COLORS };
    } catch {
      return { ...DEFAULT_COLORS };
    }
  });

  const setColor = (key: string, color: string) => {
    setColorMapState((prev) => {
      const next = { ...prev, [key]: color };
      try { localStorage.setItem('fq_metric_colors', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const getColor = (key: string): string => {
    if (colorMap[key]) return colorMap[key];
    // hash-based fallback for custom keys without a stored color
    let h = 0;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) & 0xffff;
    return PALETTE[h % PALETTE.length];
  };

  return { colorMap, setColor, getColor };
}

// ─── Constants ───────────────────────────────────────────────────────────────

type StdKey = 'waistCm' | 'chestCm' | 'bicepCm' | 'thighCm';

const STD = [
  { key: 'waistCm' as StdKey, label: 'Tour de taille', unit: 'cm', step: 0.5, min: 40, max: 200, def: 80 },
  { key: 'chestCm' as StdKey, label: 'Poitrine',        unit: 'cm', step: 0.5, min: 40, max: 200, def: 95 },
  { key: 'bicepCm' as StdKey, label: 'Biceps',          unit: 'cm', step: 0.5, min: 10, max: 100, def: 35 },
  { key: 'thighCm' as StdKey, label: 'Cuisses',         unit: 'cm', step: 0.5, min: 20, max: 120, def: 55 },
] as const;

// ─── Form helpers ─────────────────────────────────────────────────────────────

interface MeasureState { enabled: boolean; value: number; }

interface FormState {
  weightEnabled: boolean;
  weightKg: number;
  bodyFatEnabled: boolean;
  bodyFatPct: number;
  measures: Record<StdKey, MeasureState>;
  customFields: CustomMetric[];
}

const EMPTY_FORM: FormState = {
  weightEnabled: true,
  weightKg: 75,
  bodyFatEnabled: false,
  bodyFatPct: 15,
  measures: {
    waistCm: { enabled: false, value: 80 },
    chestCm: { enabled: false, value: 95 },
    bicepCm: { enabled: false, value: 35 },
    thighCm: { enabled: false, value: 55 },
  },
  customFields: [],
};

function formToPayload(form: FormState): MetricPayload {
  const out: MetricPayload = {};
  if (form.weightEnabled) out.weightKg = form.weightKg;
  if (form.bodyFatEnabled) out.bodyFatPct = form.bodyFatPct;
  STD.forEach(({ key }) => {
    if (form.measures[key].enabled) Object.assign(out, { [key]: form.measures[key].value });
  });
  if (form.customFields.length > 0) out.customMetrics = form.customFields;
  return out;
}

function metricToForm(m: BodyMetric): FormState {
  return {
    weightEnabled: m.weightKg != null,
    weightKg: m.weightKg ?? 75,
    bodyFatEnabled: m.bodyFatPct != null,
    bodyFatPct: m.bodyFatPct ?? 15,
    measures: {
      waistCm: { enabled: m.waistCm != null, value: m.waistCm ?? 80 },
      chestCm: { enabled: m.chestCm != null, value: m.chestCm ?? 95 },
      bicepCm: { enabled: m.bicepCm != null, value: m.bicepCm ?? 35 },
      thighCm: { enabled: m.thighCm != null, value: m.thighCm ?? 55 },
    },
    customFields: (m.customMetrics ?? []).map((c) => ({ ...c })),
  };
}

function fmtShort(s: string) {
  return new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

function fmtLong(s: string) {
  return new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getMeasureValue(m: BodyMetric, key: string): number | null {
  if (key === 'bodyFatPct') return m.bodyFatPct ?? null;
  const stdDef = STD.find((s) => s.key === key);
  if (stdDef) return (m as unknown as Record<string, number | null>)[key] ?? null;
  return m.customMetrics?.find((c) => c.name === key)?.value ?? null;
}

function getMeasureUnit(key: string, metrics: BodyMetric[]): string {
  if (key === 'bodyFatPct') return '%';
  const stdItem = STD.find((s) => s.key === key);
  if (stdItem) return stdItem.unit;
  for (const m of metrics) {
    const found = m.customMetrics?.find((c) => c.name === key);
    if (found) return found.unit;
  }
  return '';
}

function getMeasureLabel(key: string): string {
  return STD.find((s) => s.key === key)?.label ?? key;
}

// ─── Photo constants & helpers ────────────────────────────────────────────────

const PHOTO_TYPES = [
  { value: 'front', label: 'Avant' },
  { value: 'back',  label: 'Arrière' },
  { value: 'side',  label: 'Profil' },
  { value: 'arm',   label: 'Bras' },
  { value: 'leg',   label: 'Jambe' },
  { value: 'full',  label: 'Corps entier' },
  { value: 'other', label: 'Autre' },
] as const;

function fmtMonth(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function groupPhotosByMonth(photos: BodyPhoto[]): { key: string; label: string; items: BodyPhoto[] }[] {
  const map = new Map<string, { key: string; label: string; items: BodyPhoto[] }>();
  for (const p of photos) {
    const key = p.date.slice(0, 7);
    if (!map.has(key)) map.set(key, { key, label: fmtMonth(p.date), items: [] });
    map.get(key)!.items.push(p);
  }
  return Array.from(map.values());
}

// ─── ColorRow ─────────────────────────────────────────────────────────────────

interface ColorRowProps {
  colorKey: string;
  label: string;
  getColor: (key: string) => string;
  setColor: (key: string, color: string) => void;
}

function ColorRow({ colorKey, label, getColor, setColor }: ColorRowProps) {
  const current = getColor(colorKey);
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 truncate text-xs text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(colorKey, c)}
            className="h-4 w-4 rounded-full transition-transform hover:scale-125 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none"
            style={{
              backgroundColor: c,
              outline: current === c ? '2px solid rgba(255,255,255,0.85)' : 'none',
              outlineOffset: '2px',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── MetricForm ───────────────────────────────────────────────────────────────

interface MetricFormProps {
  initial?: FormState;
  onSubmit: (payload: MetricPayload) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string | null;
  getColor: (key: string) => string;
  setColor: (key: string, color: string) => void;
}

function MetricForm({
  initial = EMPTY_FORM,
  onSubmit,
  onCancel,
  submitLabel,
  getColor,
  setColor,
}: MetricFormProps) {
  const { t } = useTranslation();
  const resolvedSubmitLabel = submitLabel ?? t('body.metrics.submitLabel');
  const [form, setForm] = useState<FormState>({
    ...initial,
    measures: { ...initial.measures },
    customFields: initial.customFields.map((c) => ({ ...c })),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasAny =
    form.weightEnabled ||
    form.bodyFatEnabled ||
    STD.some(({ key }) => form.measures[key].enabled) ||
    form.customFields.length > 0;

  const hasColorRows =
    form.weightEnabled ||
    form.bodyFatEnabled ||
    STD.some(({ key }) => form.measures[key].enabled) ||
    form.customFields.some((cf) => cf.name !== '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAny) { setError(t('body.metrics.atLeastOne')); return; }
    setSaving(true);
    setError(null);
    try {
      await onSubmit(formToPayload(form));
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  };

  const toggleWeight = () => setForm((f) => ({ ...f, weightEnabled: !f.weightEnabled }));
  const toggleBodyFat = () => setForm((f) => ({ ...f, bodyFatEnabled: !f.bodyFatEnabled }));
  const toggleMeasure = (key: StdKey) =>
    setForm((f) => ({
      ...f,
      measures: { ...f.measures, [key]: { ...f.measures[key], enabled: !f.measures[key].enabled } },
    }));
  const setMeasure = (key: StdKey, v: number) =>
    setForm((f) => ({
      ...f,
      measures: { ...f.measures, [key]: { ...f.measures[key], value: v } },
    }));

  const addCustom = () => {
    if (form.customFields.length >= 10) return;
    setForm((f) => ({ ...f, customFields: [...f.customFields, { name: '', value: 0, unit: '' }] }));
  };
  const removeCustom = (i: number) =>
    setForm((f) => ({ ...f, customFields: f.customFields.filter((_, idx) => idx !== i) }));
  const setCustomField = (i: number, key: keyof CustomMetric, value: string | number) =>
    setForm((f) => {
      const cf = [...f.customFields];
      cf[i] = { ...cf[i], [key]: value };
      return { ...f, customFields: cf };
    });

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Poids */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleWeight}
          className={`h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center transition focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none ${
            form.weightEnabled ? 'border-xp bg-xp/20' : 'border-border'
          }`}
        >
          {form.weightEnabled && <Check className="h-3 w-3 text-xp" />}
        </button>
        <span className={`w-28 shrink-0 text-sm font-medium ${form.weightEnabled ? 'text-foreground' : 'text-muted-foreground'}`}>
          {t('body.metrics.weight')}
        </span>
        <NumberStepper
          value={form.weightKg}
          onChange={(v) => setForm((f) => ({ ...f, weightKg: v }))}
          step={0.5}
          min={30}
          max={300}
          suffix="kg"
          variant={form.weightEnabled ? 'gold' : 'default'}
          directEdit={form.weightEnabled}
          className={form.weightEnabled ? '' : 'pointer-events-none opacity-40'}
        />
      </div>

      {/* % Masse grasse */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleBodyFat}
          className={`h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center transition focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none ${
            form.bodyFatEnabled ? 'border-primary bg-primary/20' : 'border-border'
          }`}
        >
          {form.bodyFatEnabled && <Check className="h-3 w-3 text-primary" />}
        </button>
        <span className={`w-28 shrink-0 text-sm font-medium ${form.bodyFatEnabled ? 'text-foreground' : 'text-muted-foreground'}`}>
          {t('body.metrics.bodyFatPct')}
        </span>
        <NumberStepper
          value={form.bodyFatPct}
          onChange={(v) => setForm((f) => ({ ...f, bodyFatPct: v }))}
          step={0.5}
          min={3}
          max={60}
          suffix="%"
          variant={form.bodyFatEnabled ? 'primary' : 'default'}
          directEdit={form.bodyFatEnabled}
          className={form.bodyFatEnabled ? '' : 'pointer-events-none opacity-40'}
        />
      </div>

      {/* Mensurations standard */}
      {STD.map(({ key, unit, step, min, max }) => {
        const on = form.measures[key].enabled;
        return (
          <div key={key} className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => toggleMeasure(key)}
              className={`h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center transition focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none ${
                on ? 'border-primary bg-primary/20' : 'border-border'
              }`}
            >
              {on && <Check className="h-3 w-3 text-primary" />}
            </button>
            <span className={`w-28 shrink-0 text-sm font-medium ${on ? 'text-foreground' : 'text-muted-foreground'}`}>
              {t(`body.metrics.${key}`)}
            </span>
            <NumberStepper
              value={form.measures[key].value}
              onChange={(v) => setMeasure(key, v)}
              step={step}
              min={min}
              max={max}
              suffix={unit}
              variant={on ? 'primary' : 'default'}
              directEdit={on}
              className={on ? '' : 'pointer-events-none opacity-40'}
            />
          </div>
        );
      })}

      {/* Champs custom */}
      {form.customFields.length > 0 && (
        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground">{t('body.metrics.customMeasures')}</p>
          {form.customFields.map((cf, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                placeholder={t('body.metrics.customNamePlaceholder')}
                value={cf.name}
                onChange={(e) => setCustomField(i, 'name', e.target.value)}
                className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <input
                type="number"
                step="any"
                value={cf.value}
                onChange={(e) => setCustomField(i, 'value', parseFloat(e.target.value) || 0)}
                className="h-10 w-20 shrink-0 rounded-lg border border-border bg-card px-2 text-center text-sm text-foreground focus:border-primary focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <input
                type="text"
                placeholder={t('body.metrics.customUnitPlaceholder')}
                value={cf.unit}
                onChange={(e) => setCustomField(i, 'unit', e.target.value)}
                className="h-10 w-16 shrink-0 rounded-lg border border-border bg-card px-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => removeCustom(i)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:border-red-400/50 hover:text-red-400 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {form.customFields.length < 10 && (
        <button
          type="button"
          onClick={addCustom}
          className="flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none"
        >
          <Plus className="h-4 w-4" />
          {t('body.metrics.addCustom')}
        </button>
      )}

      {/* Couleurs des graphiques */}
      {hasColorRows && (
        <div className="space-y-2 rounded-lg border border-border/50 bg-card/30 p-3">
          <p className="text-xs font-medium text-muted-foreground">{t('body.metrics.graphColors')}</p>
          {form.weightEnabled && (
            <ColorRow colorKey="weight" label={t('body.metrics.weight')} getColor={getColor} setColor={setColor} />
          )}
          {form.bodyFatEnabled && (
            <ColorRow colorKey="bodyFatPct" label={t('body.metrics.bodyFatPct')} getColor={getColor} setColor={setColor} />
          )}
          {STD.map(({ key }) =>
            form.measures[key].enabled ? (
              <ColorRow key={key} colorKey={key} label={t(`body.metrics.${key}`)} getColor={getColor} setColor={setColor} />
            ) : null
          )}
          {form.customFields.map((cf, i) =>
            cf.name ? (
              <ColorRow key={i} colorKey={cf.name} label={cf.name} getColor={getColor} setColor={setColor} />
            ) : null
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving || !hasAny}
          className="h-10 flex-1 rounded-lg bg-primary text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none"
        >
          {saving ? t('body.metrics.saving') : resolvedSubmitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-lg border border-border px-4 text-sm text-muted-foreground transition hover:border-foreground/30 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none"
          >
            {t('common.cancel')}
          </button>
        )}
      </div>
    </form>
  );
}

// ─── WeightChart ──────────────────────────────────────────────────────────────

function WeightChart({ metrics, color }: { metrics: BodyMetric[]; color: string }) {
  const { t } = useTranslation();
  const data = useMemo(
    () =>
      [...metrics]
        .reverse()
        .filter((m) => m.weightKg != null)
        .map((m) => ({ date: fmtShort(m.date), value: m.weightKg })),
    [metrics],
  );

  if (data.length === 0) {
    return (
      <p className="flex h-20 items-center justify-center text-sm text-muted-foreground">
        {t('body.metrics.noWeightData')}
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
        <Tooltip
          contentStyle={{ background: 'rgba(15,15,25,0.95)', border: `1px solid ${hexToRgba(color, 0.35)}`, borderRadius: 8, padding: '6px 12px' }}
          labelStyle={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}
          formatter={(v) => [`${v} kg`, t('body.metrics.weight')]}
          itemStyle={{ color }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={{ fill: color, r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: color, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── MeasureChart ─────────────────────────────────────────────────────────────

function MeasureChart({
  metrics,
  getColor,
}: {
  metrics: BodyMetric[];
  getColor: (key: string) => string;
}) {
  const { t } = useTranslation();
  const availableKeys = useMemo(() => {
    const keys: string[] = [];
    if (metrics.some((m) => m.bodyFatPct != null)) keys.push('bodyFatPct');
    STD.forEach(({ key }) => {
      if (metrics.some((m) => m[key] != null)) keys.push(key);
    });
    const customNames = new Set<string>();
    metrics.forEach((m) => m.customMetrics?.forEach((c) => customNames.add(c.name)));
    customNames.forEach((n) => keys.push(n));
    return keys;
  }, [metrics]);

  const [selectedOverride, setSelectedOverride] = useState<string | null>(null);
  const selectedKey = selectedOverride && availableKeys.includes(selectedOverride)
    ? selectedOverride
    : (availableKeys[0] ?? '');

  const color = getColor(selectedKey);
  const isKnownKey = STD.some((s) => s.key === selectedKey) || selectedKey === 'bodyFatPct';
  const label = isKnownKey ? t(`body.metrics.${selectedKey}`) : getMeasureLabel(selectedKey);
  const unit = getMeasureUnit(selectedKey, metrics);

  const data = useMemo(
    () =>
      [...metrics]
        .reverse()
        .filter((m) => getMeasureValue(m, selectedKey) != null)
        .map((m) => ({ date: fmtShort(m.date), value: getMeasureValue(m, selectedKey) })),
    [metrics, selectedKey],
  );

  if (availableKeys.length === 0) {
    return (
      <p className="flex h-20 items-center justify-center text-sm text-muted-foreground">
        {t('body.metrics.noMeasureData')}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span style={{ color, fontSize: 10 }}>●</span>
        <select
          value={selectedKey}
          onChange={(e) => setSelectedOverride(e.target.value)}
          className="h-8 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          {availableKeys.map((k) => (
            <option key={k} value={k}>
              {STD.some((s) => s.key === k) || k === 'bodyFatPct' ? t(`body.metrics.${k}`) : getMeasureLabel(k)}
            </option>
          ))}
        </select>
      </div>

      {data.length === 0 ? (
        <p className="flex h-20 items-center justify-center text-sm text-muted-foreground">
          {t('body.metrics.noMeasureDataSingle')}
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{ background: 'rgba(15,15,25,0.95)', border: `1px solid ${hexToRgba(color, 0.35)}`, borderRadius: 8, padding: '6px 12px' }}
              labelStyle={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}
              formatter={(v) => [`${v} ${unit}`, label]}
              itemStyle={{ color }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: color, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

interface MetricCardProps {
  metric: BodyMetric;
  onEdit: (m: BodyMetric) => void;
  onDelete: (id: string) => void;
  getColor: (key: string) => string;
}

function MetricCard({ metric, onEdit, onDelete, getColor }: MetricCardProps) {
  const { t } = useTranslation();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fields: { key: string; label: string; value: string }[] = [];
  if (metric.weightKg != null) fields.push({ key: 'weight', label: t('body.metrics.weight'), value: `${metric.weightKg} kg` });
  if (metric.bodyFatPct != null) fields.push({ key: 'bodyFatPct', label: t('body.metrics.bodyFatPct'), value: `${metric.bodyFatPct} %` });
  STD.forEach(({ key, unit }) => {
    const v = (metric as unknown as Record<string, number | null>)[key];
    if (v != null) fields.push({ key, label: t(`body.metrics.${key}`), value: `${v} ${unit}` });
  });
  metric.customMetrics?.forEach((c) => {
    fields.push({ key: c.name, label: c.name, value: `${c.value} ${c.unit}` });
  });

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{fmtLong(metric.date)}</p>
        <div className="flex shrink-0 gap-1.5">
          {confirmDelete ? (
            <>
              <button
                onClick={() => onDelete(metric.id)}
                className="rounded border border-red-400/40 px-2 py-1 text-xs text-red-400 transition hover:border-red-300/60 hover:text-red-300 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none"
              >
                {t('common.confirm')}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded border border-border px-2 py-1 text-xs text-muted-foreground transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none"
              >
                {t('common.cancel')}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onEdit(metric)}
                aria-label="Modifier"
                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                aria-label="Supprimer"
                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-red-400/10 hover:text-red-400 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {fields.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {fields.map((f) => {
            const c = getColor(f.key);
            return (
              <div
                key={f.key}
                className="rounded-lg border px-2.5 py-1.5"
                style={{ borderColor: hexToRgba(c, 0.35), background: hexToRgba(c, 0.08) }}
              >
                <p className="text-sm font-bold leading-tight" style={{ color: c }}>{f.value}</p>
                <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{f.label}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── MetricsTab ───────────────────────────────────────────────────────────────

function MetricsTab() {
  const { t } = useTranslation();
  const { metrics, isLoading, error, fetchMetrics, addMetric, updateMetric, deleteMetric } = useBodyStore();
  const [editingMetric, setEditingMetric] = useState<BodyMetric | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const editRef = useRef<HTMLDivElement>(null);
  const { getColor, setColor } = useColorMap();

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  const handleEdit = (m: BodyMetric) => {
    setEditingMetric(m);
    setShowAddForm(false);
    setTimeout(() => editRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
  };

  const handleAdd = async (payload: MetricPayload) => {
    await addMetric(payload);
    setShowAddForm(false);
  };

  const handleUpdate = async (payload: MetricPayload) => {
    if (!editingMetric) return;
    await updateMetric(editingMetric.id, payload);
    setEditingMetric(null);
  };

  const isEmpty = !isLoading && metrics.length === 0;

  return (
    <div className="space-y-5">
      {/* Graphiques */}
      {metrics.length > 1 && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <span style={{ color: getColor('weight') }}>●</span> {t('body.metrics.weightEvolution')}
            </h3>
            <WeightChart metrics={metrics} color={getColor('weight')} />
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">{t('body.metrics.measurements')}</h3>
            <MeasureChart metrics={metrics} getColor={getColor} />
          </div>
        </div>
      )}

      {/* Formulaire édition */}
      {editingMetric && (
        <div ref={editRef} className="rounded-xl border border-primary/40 bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            {t('body.metrics.editTitle', { date: fmtLong(editingMetric.date) })}
          </h3>
          <MetricForm
            initial={metricToForm(editingMetric)}
            onSubmit={handleUpdate}
            onCancel={() => setEditingMetric(null)}
            submitLabel={t('body.metrics.submitLabelEdit')}
            getColor={getColor}
            setColor={setColor}
          />
        </div>
      )}

      {/* Formulaire ajout */}
      {!editingMetric && (
        <div className="rounded-xl border border-border bg-card p-4">
          {isEmpty || showAddForm ? (
            <>
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t('body.metrics.newRecord')}</h3>
              <MetricForm
                onSubmit={handleAdd}
                onCancel={metrics.length > 0 ? () => setShowAddForm(false) : undefined}
                submitLabel={t('body.metrics.submitLabelNew')}
                getColor={getColor}
                setColor={setColor}
              />
            </>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none"
            >
              <Plus className="h-4 w-4" />
              {t('body.metrics.addRecord')}
            </button>
          )}
        </div>
      )}

      {/* États */}
      {isLoading && (
        <p className="py-4 text-center text-sm text-muted-foreground">{t('common.loading')}</p>
      )}
      {error && (
        <p className="py-4 text-center text-sm text-red-400">{error}</p>
      )}

      {/* Liste */}
      {metrics.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">{t('body.metrics.history')}</h3>
          {metrics.map((m) => (
            <MetricCard key={m.id} metric={m} onEdit={handleEdit} onDelete={deleteMetric} getColor={getColor} />
          ))}
        </div>
      )}

      {/* État vide */}
      {isEmpty && !showAddForm && (
        <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
          <Scale className="mb-3 h-12 w-12 opacity-20" />
          <p className="text-sm">{t('body.metrics.empty')}</p>
        </div>
      )}
    </div>
  );
}

// ─── PhotoCard ────────────────────────────────────────────────────────────────

interface PhotoCardProps {
  photo: BodyPhoto;
  isBlurred: boolean;
  onClick: () => void;
  onDelete: (id: string) => Promise<void>;
}

function PhotoCard({ photo, isBlurred, onClick, onDelete }: PhotoCardProps) {
  const { t } = useTranslation();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try { await onDelete(photo.id); } catch { /* ignore */ } finally { setDeleting(false); }
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card">
      <button type="button" onClick={onClick} className="block w-full focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none">
        <div className="aspect-square overflow-hidden">
          <img
            src={photo.url}
            alt={t(`body.photos.types.${photo.type}`)}
            className={`h-full w-full object-cover transition-transform duration-300 hover:scale-105 ${isBlurred ? 'blur-md' : ''}`}
          />
        </div>
      </button>

      {/* Gradient overlay type + date */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-6">
        <p className="text-[11px] font-semibold leading-tight text-white/90">
          {t(`body.photos.types.${photo.type}`)}
        </p>
        <p className="text-xs leading-tight text-white/60">{fmtShort(photo.date)}</p>
      </div>

      {/* Bouton supprimer en haut à droite */}
      <div className="absolute right-1.5 top-1.5">
        {confirmDelete ? (
          <div
            className="flex gap-1 rounded-lg bg-black/80 px-1.5 py-1 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleDeleteClick}
              disabled={deleting}
              className="text-xs font-medium text-red-400 hover:text-red-300 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none"
            >
              {deleting ? '…' : t('body.photos.confirmDelete')}
            </button>
            <span className="text-xs text-white/30">|</span>
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
              className="text-xs text-white/60 hover:text-white focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none"
            >
              {t('body.photos.cancelDelete')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleDeleteClick}
            aria-label={t('body.photos.deletePhoto')}
            className="rounded-lg bg-black/40 p-1.5 text-white/60 backdrop-blur-sm transition hover:bg-red-500/30 hover:text-red-400 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── PhotoModal ───────────────────────────────────────────────────────────────

interface PhotoModalProps {
  photo: BodyPhoto;
  isBlurred: boolean;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}

function PhotoModal({ photo, isBlurred, onClose, onDelete }: PhotoModalProps) {
  const { t } = useTranslation();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handler);
    };
  }, [onClose]);

  const handleDelete = async () => {
    setDeleting(true);
    try { await onDelete(photo.id); onClose(); } catch { setDeleting(false); }
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="photo-modal-title" className="fixed inset-0 z-50 flex flex-col bg-black/95">
      {/* Header */}
      <div
        className="flex shrink-0 items-center justify-between px-4 py-4"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-2">
          <span id="photo-modal-title" className="rounded-md bg-primary/20 px-2 py-1 text-xs font-medium text-primary">
            {t(`body.photos.types.${photo.type}`)}
          </span>
          <span className="text-sm text-white/60">{fmtLong(photo.date)}</span>
        </div>
        <button
          onClick={onClose}
          className="rounded-xl p-2 text-white/60 transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Image */}
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4">
        <img
          src={photo.url}
          alt={t(`body.photos.types.${photo.type}`)}
          className={`max-h-full max-w-full rounded-xl object-contain transition-all ${isBlurred ? 'blur-xl' : ''}`}
        />
      </div>

      {/* Footer */}
      <div
        className="shrink-0 space-y-3 px-4 py-4"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        {photo.note && (
          <p className="text-center text-sm italic text-white/70">{photo.note}</p>
        )}
        <div className="flex justify-center">
          {confirmDelete ? (
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/30 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
              >
                {deleting ? t('common.deleting') : t('body.photos.deleteConfirmLabel')}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/60 transition hover:text-white focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
              >
                {t('common.cancel')}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-white/50 transition hover:border-red-400/40 hover:text-red-400 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
            >
              <Trash2 className="h-4 w-4" />
              {t('common.delete')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CompareModal ─────────────────────────────────────────────────────────────

interface CompareModalProps {
  photos: BodyPhoto[];
  isBlurred: boolean;
  onClose: () => void;
}

function CompareModal({ photos, isBlurred, onClose }: CompareModalProps) {
  const { t } = useTranslation();
  const [photoAId, setPhotoAId] = useState<string>(photos[photos.length - 1]?.id ?? '');
  const [photoBId, setPhotoBId] = useState<string>(photos[0]?.id ?? '');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handler);
    };
  }, [onClose]);

  const photoA = photos.find((p) => p.id === photoAId);
  const photoB = photos.find((p) => p.id === photoBId);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="compare-modal-title" className="fixed inset-0 z-50 flex flex-col bg-black/95">
      {/* Header */}
      <div
        className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-4"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <span id="compare-modal-title" className="text-sm font-semibold text-white">{t('body.photos.compareModal.title')}</span>
        <button
          onClick={onClose}
          className="rounded-xl p-2 text-white/60 transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Sélecteurs */}
      <div className="grid shrink-0 grid-cols-2 gap-3 px-4 py-3">
        {([
          { id: photoAId, setId: setPhotoAId, labelKey: 'before' as const },
          { id: photoBId, setId: setPhotoBId, labelKey: 'after' as const },
        ]).map(({ id, setId, labelKey }) => (
          <div key={labelKey}>
            <p className="mb-1 text-[11px] text-white/40">{t(`body.photos.compareModal.${labelKey}`)}</p>
            <select
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white focus:border-primary/60 focus:outline-none"
            >
              {photos.map((p) => (
                <option key={p.id} value={p.id} className="bg-gray-900">
                  {fmtShort(p.date)} — {t(`body.photos.types.${p.type}`)}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Images côte à côte */}
      <div
        className="flex min-h-0 flex-1 gap-3 overflow-hidden px-4"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        {[photoA, photoB].map((photo, i) =>
          photo ? (
            <div key={photo.id} className="flex flex-1 flex-col gap-2 overflow-hidden">
              <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl bg-white/5">
                <img
                  src={photo.url}
                  alt={t(`body.photos.types.${photo.type}`)}
                  className={`h-full w-full object-contain transition-all ${isBlurred ? 'blur-xl' : ''}`}
                />
              </div>
              <p className="shrink-0 text-center text-xs text-white/50">
                {fmtShort(photo.date)} · {t(`body.photos.types.${photo.type}`)}
              </p>
            </div>
          ) : (
            <div
              key={i}
              className="flex flex-1 items-center justify-center rounded-xl border border-white/10 text-white/30"
            >
              <p className="text-xs">{t('body.photos.noPhoto')}</p>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

// ─── PhotosTab ────────────────────────────────────────────────────────────────

function PhotosTab() {
  const { t } = useTranslation();
  const { photos, photosLoading, fetchPhotos, addPhoto, deletePhoto } = useBodyStore();

  // Upload form
  const [showUpload, setShowUpload] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('front');
  const [note, setNote] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Galerie
  const [activePhoto, setActivePhoto] = useState<BodyPhoto | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Confidentialité — persistée dans localStorage
  const [isBlurred, setIsBlurred] = useState<boolean>(() => {
    try { return localStorage.getItem('fq_photo_privacy') === '1'; } catch { return false; }
  });

  const toggleBlur = () => {
    setIsBlurred((b) => {
      const next = !b;
      try { localStorage.setItem('fq_photo_privacy', next ? '1' : '0'); } catch { /* ignore */ }
      return next;
    });
  };

  // Révoque l'URL blob quand previewUrl change ou au démontage
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  // Types disponibles (seulement ceux qui ont au moins une photo)
  const availableTypes = useMemo(
    () => PHOTO_TYPES.filter(({ value }) => photos.some((p) => p.type === value)),
    [photos],
  );

  // Photos filtrées + triées
  const filteredPhotos = useMemo(() => {
    const base = filterType ? photos.filter((p) => p.type === filterType) : photos;
    return sortOrder === 'asc' ? [...base].reverse() : base;
  }, [photos, filterType, sortOrder]);

  const groups = useMemo(() => groupPhotosByMonth(filteredPhotos), [filteredPhotos]);

  const handleFileChange = (file: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setUploadError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) handleFileChange(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploading(true);
    setUploadError(null);
    try {
      await addPhoto(selectedFile, selectedType, note);
      setSelectedFile(null);
      setPreviewUrl(null);
      setNote('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setShowUpload(false);
    } catch (err) {
      setUploadError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deletePhoto(id);
    if (activePhoto?.id === id) setActivePhoto(null);
  };

  const clearPreview = (e: React.MouseEvent) => {
    e.preventDefault();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-5">

      {/* ── Section d'upload dépliable ── */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <button
          type="button"
          onClick={() => setShowUpload((s) => !s)}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none"
        >
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">{t('body.photos.newPhoto')}</span>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${showUpload ? 'rotate-180' : ''}`}
          />
        </button>

        {showUpload && (
          <form onSubmit={handleSubmit} className="space-y-4 border-t border-border px-4 pb-4 pt-4">
            {/* Sélecteur de type */}
            <div>
              <p className="mb-2 text-xs text-muted-foreground">{t('body.photos.photoType')}</p>
              <div className="flex flex-wrap gap-2">
                {PHOTO_TYPES.map(({ value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSelectedType(value)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none ${
                      selectedType === value
                        ? 'bg-primary/15 text-primary ring-1 ring-primary/40'
                        : 'border border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t(`body.photos.types.${value}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Drop zone */}
            <label
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 transition ${
                dragOver
                  ? 'border-primary bg-primary/10'
                  : selectedFile
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileChange(f); }}
              />
              {previewUrl ? (
                <div className="relative">
                  <img src={previewUrl} alt="Aperçu" className="max-h-52 max-w-full rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={clearPreview}
                    className="absolute -right-2 -top-2 rounded-full bg-card p-1 text-muted-foreground shadow ring-1 ring-border transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground/50" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('body.photos.dropHint')}{' '}
                      <span className="text-primary">{t('body.photos.clickHint')}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground/60">{t('body.photos.fileTypes')}</p>
                  </div>
                </>
              )}
            </label>

            {/* Note */}
            <input
              type="text"
              placeholder={t('body.photos.notePlaceholder')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />

            {uploadError && <p className="text-sm text-red-400">{uploadError}</p>}

            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className="h-10 w-full rounded-lg bg-primary text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none"
            >
              {uploading ? t('body.photos.uploading') : t('body.photos.upload')}
            </button>
          </form>
        )}
      </div>

      {/* ── Bouton Comparer (≥ 2 photos) ── */}
      {photos.length >= 2 && (
        <button
          type="button"
          onClick={() => setShowCompare(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary/15 py-3 text-sm font-semibold text-primary ring-1 ring-primary/30 transition hover:bg-primary/25 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none"
        >
          <ArrowLeftRight className="h-4 w-4" />
          {t('body.photos.compare')}
        </button>
      )}

      {/* Chargement */}
      {photosLoading && (
        <p className="py-4 text-center text-sm text-muted-foreground">{t('body.photos.loading')}</p>
      )}

      {/* État vide */}
      {!photosLoading && photos.length === 0 && (
        <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
          <Camera className="mb-3 h-12 w-12 opacity-20" />
          <p className="text-sm">{t('body.photos.empty')}</p>
        </div>
      )}

      {/* ── Filtres + tri + confidentialité ── */}
      {photos.length > 0 && (
        <div className="flex items-center gap-2">
          {/* Pills de filtre type (scroll horizontal sur mobile) */}
          <div
            className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-0.5"
            style={{ scrollbarWidth: 'none' }}
          >
            <button
              onClick={() => setFilterType(null)}
              className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none ${
                filterType === null
                  ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                  : 'border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('body.photos.all', { count: photos.length })}
            </button>
            {availableTypes.map(({ value }) => {
              const count = photos.filter((p) => p.type === value).length;
              return (
                <button
                  key={value}
                  onClick={() => setFilterType(filterType === value ? null : value)}
                  className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none ${
                    filterType === value
                      ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                      : 'border border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t(`body.photos.types.${value}`)} ({count})
                </button>
              );
            })}
          </div>

          {/* Tri + Confidentialité */}
          <div className="flex shrink-0 gap-1.5">
            <button
              onClick={() => setSortOrder((s) => (s === 'desc' ? 'asc' : 'desc'))}
              aria-label={sortOrder === 'desc' ? 'Plus récentes en premier' : 'Plus anciennes en premier'}
              title={sortOrder === 'desc' ? 'Plus récentes en premier' : 'Plus anciennes en premier'}
              className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none"
            >
              {sortOrder === 'desc' ? '↓' : '↑'} Date
            </button>
            <button
              onClick={toggleBlur}
              aria-label={isBlurred ? t('body.photos.showPhotos') : t('body.photos.hidePhotos')}
              title={isBlurred ? t('body.photos.showPhotos') : t('body.photos.hidePhotos')}
              className={`rounded-lg border p-1.5 transition focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none ${
                isBlurred
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {isBlurred ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Aucun résultat après filtrage */}
      {photos.length > 0 && filteredPhotos.length === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          {t('body.photos.noFilterResult')}
        </p>
      )}

      {/* Galerie groupée par mois */}
      {groups.map(({ key, label, items }) => (
        <div key={key}>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                isBlurred={isBlurred}
                onClick={() => setActivePhoto(photo)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Modale plein écran */}
      {activePhoto && (
        <PhotoModal
          photo={activePhoto}
          isBlurred={isBlurred}
          onClose={() => setActivePhoto(null)}
          onDelete={handleDelete}
        />
      )}

      {/* Modale comparaison */}
      {showCompare && (
        <CompareModal
          photos={photos}
          isBlurred={isBlurred}
          onClose={() => setShowCompare(false)}
        />
      )}
    </div>
  );
}

// ─── Body page ────────────────────────────────────────────────────────────────

type Tab = 'metrics' | 'photos';

export default function Body() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('metrics');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">{t('body.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('body.subtitle')}</p>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
        <button
          onClick={() => setTab('metrics')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none ${
            tab === 'metrics'
              ? 'bg-primary/15 text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Scale className="h-4 w-4" />
          {t('body.tabs.metrics')}
        </button>
        <button
          onClick={() => setTab('photos')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-none ${
            tab === 'photos'
              ? 'bg-primary/15 text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Camera className="h-4 w-4" />
          {t('body.tabs.photos')}
        </button>
      </div>

      {tab === 'metrics' ? <MetricsTab /> : <PhotosTab />}
    </div>
  );
}
