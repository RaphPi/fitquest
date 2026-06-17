import { useState, useEffect, useMemo, useRef } from 'react';
import { Scale, Camera, Plus, Trash2, Pencil, X, Check } from 'lucide-react';
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
import type { BodyMetric, CustomMetric, MetricPayload } from '@/types';

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
  measures: Record<StdKey, MeasureState>;
  customFields: CustomMetric[];
}

const EMPTY_FORM: FormState = {
  weightEnabled: true,
  weightKg: 75,
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
  const stdDef = STD.find((s) => s.key === key);
  if (stdDef) return (m as unknown as Record<string, number | null>)[key] ?? null;
  return m.customMetrics?.find((c) => c.name === key)?.value ?? null;
}

function getMeasureUnit(key: string, metrics: BodyMetric[]): string {
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
            className="h-4 w-4 rounded-full transition-transform hover:scale-125"
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
  submitLabel?: string;
  getColor: (key: string) => string;
  setColor: (key: string, color: string) => void;
}

function MetricForm({
  initial = EMPTY_FORM,
  onSubmit,
  onCancel,
  submitLabel = 'Enregistrer',
  getColor,
  setColor,
}: MetricFormProps) {
  const [form, setForm] = useState<FormState>({
    ...initial,
    measures: { ...initial.measures },
    customFields: initial.customFields.map((c) => ({ ...c })),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasAny =
    form.weightEnabled ||
    STD.some(({ key }) => form.measures[key].enabled) ||
    form.customFields.length > 0;

  const hasColorRows =
    form.weightEnabled ||
    STD.some(({ key }) => form.measures[key].enabled) ||
    form.customFields.some((cf) => cf.name !== '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAny) { setError('Au moins un champ requis.'); return; }
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
          className={`h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center transition ${
            form.weightEnabled ? 'border-xp bg-xp/20' : 'border-border'
          }`}
        >
          {form.weightEnabled && <Check className="h-3 w-3" style={{ color: '#f59e0b' }} />}
        </button>
        <span className={`w-28 shrink-0 text-sm font-medium ${form.weightEnabled ? 'text-foreground' : 'text-muted-foreground'}`}>
          Poids
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

      {/* Mensurations standard */}
      {STD.map(({ key, label, unit, step, min, max }) => {
        const on = form.measures[key].enabled;
        return (
          <div key={key} className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => toggleMeasure(key)}
              className={`h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center transition ${
                on ? 'border-primary bg-primary/20' : 'border-border'
              }`}
            >
              {on && <Check className="h-3 w-3 text-primary" />}
            </button>
            <span className={`w-28 shrink-0 text-sm font-medium ${on ? 'text-foreground' : 'text-muted-foreground'}`}>
              {label}
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
          <p className="text-xs text-muted-foreground">Mesures personnalisées</p>
          {form.customFields.map((cf, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Nom"
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
                placeholder="unité"
                value={cf.unit}
                onChange={(e) => setCustomField(i, 'unit', e.target.value)}
                className="h-10 w-16 shrink-0 rounded-lg border border-border bg-card px-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => removeCustom(i)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:border-red-400/50 hover:text-red-400"
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
          className="flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
          Ajouter une mesure personnalisée
        </button>
      )}

      {/* Couleurs des graphiques */}
      {hasColorRows && (
        <div className="space-y-2 rounded-lg border border-border/50 bg-card/30 p-3">
          <p className="text-xs font-medium text-muted-foreground">Couleurs dans les graphiques</p>
          {form.weightEnabled && (
            <ColorRow colorKey="weight" label="Poids" getColor={getColor} setColor={setColor} />
          )}
          {STD.map(({ key, label }) =>
            form.measures[key].enabled ? (
              <ColorRow key={key} colorKey={key} label={label} getColor={getColor} setColor={setColor} />
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
          className="h-10 flex-1 rounded-lg bg-primary text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-40"
        >
          {saving ? 'Sauvegarde…' : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-lg border border-border px-4 text-sm text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}

// ─── WeightChart ──────────────────────────────────────────────────────────────

function WeightChart({ metrics, color }: { metrics: BodyMetric[]; color: string }) {
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
        Aucune donnée de poids.
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
          formatter={(v) => [`${v} kg`, 'Poids']}
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
  const availableKeys = useMemo(() => {
    const keys: string[] = [];
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
  const label = getMeasureLabel(selectedKey);
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
        Aucune mensuration enregistrée.
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
            <option key={k} value={k}>{getMeasureLabel(k)}</option>
          ))}
        </select>
      </div>

      {data.length === 0 ? (
        <p className="flex h-20 items-center justify-center text-sm text-muted-foreground">
          Aucune donnée pour cette mensuration.
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
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fields: { key: string; label: string; value: string }[] = [];
  if (metric.weightKg != null) fields.push({ key: 'weight', label: 'Poids', value: `${metric.weightKg} kg` });
  STD.forEach(({ key, label, unit }) => {
    const v = (metric as unknown as Record<string, number | null>)[key];
    if (v != null) fields.push({ key, label, value: `${v} ${unit}` });
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
                className="rounded border border-red-400/40 px-2 py-1 text-xs text-red-400 transition hover:border-red-300/60 hover:text-red-300"
              >
                Confirmer
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded border border-border px-2 py-1 text-xs text-muted-foreground transition hover:text-foreground"
              >
                Annuler
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onEdit(metric)}
                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-red-400/10 hover:text-red-400"
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
              <span style={{ color: getColor('weight') }}>●</span> Évolution du poids
            </h3>
            <WeightChart metrics={metrics} color={getColor('weight')} />
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Mensurations</h3>
            <MeasureChart metrics={metrics} getColor={getColor} />
          </div>
        </div>
      )}

      {/* Formulaire édition */}
      {editingMetric && (
        <div ref={editRef} className="rounded-xl border border-primary/40 bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Modifier — {fmtLong(editingMetric.date)}
          </h3>
          <MetricForm
            initial={metricToForm(editingMetric)}
            onSubmit={handleUpdate}
            onCancel={() => setEditingMetric(null)}
            submitLabel="Mettre à jour"
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
              <h3 className="mb-4 text-sm font-semibold text-foreground">Nouveau relevé</h3>
              <MetricForm
                onSubmit={handleAdd}
                onCancel={metrics.length > 0 ? () => setShowAddForm(false) : undefined}
                submitLabel="Enregistrer le relevé"
                getColor={getColor}
                setColor={setColor}
              />
            </>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
              Ajouter un relevé
            </button>
          )}
        </div>
      )}

      {/* États */}
      {isLoading && (
        <p className="py-4 text-center text-sm text-muted-foreground">Chargement…</p>
      )}
      {error && (
        <p className="py-4 text-center text-sm text-red-400">{error}</p>
      )}

      {/* Liste */}
      {metrics.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Historique</h3>
          {metrics.map((m) => (
            <MetricCard key={m.id} metric={m} onEdit={handleEdit} onDelete={deleteMetric} getColor={getColor} />
          ))}
        </div>
      )}

      {/* État vide */}
      {isEmpty && !showAddForm && (
        <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
          <Scale className="mb-3 h-12 w-12 opacity-20" />
          <p className="text-sm">Aucun relevé — commence par enregistrer ton premier bilan !</p>
        </div>
      )}
    </div>
  );
}

// ─── PhotosTab ────────────────────────────────────────────────────────────────

function PhotosTab() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
      <Camera className="mb-4 h-16 w-16 opacity-20" />
      <p className="text-base font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Photos de progression</p>
      <p className="mt-1 text-sm">Bientôt disponible ✦</p>
    </div>
  );
}

// ─── Body page ────────────────────────────────────────────────────────────────

type Tab = 'metrics' | 'photos';

export default function Body() {
  const [tab, setTab] = useState<Tab>('metrics');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Corps</h1>
        <p className="mt-1 text-sm text-muted-foreground">Suis ta progression physique</p>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
        <button
          onClick={() => setTab('metrics')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
            tab === 'metrics'
              ? 'bg-primary/15 text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Scale className="h-4 w-4" />
          Métriques
        </button>
        <button
          onClick={() => setTab('photos')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
            tab === 'photos'
              ? 'bg-primary/15 text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Camera className="h-4 w-4" />
          Photos
        </button>
      </div>

      {tab === 'metrics' ? <MetricsTab /> : <PhotosTab />}
    </div>
  );
}
