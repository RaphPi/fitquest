import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settingsStore';
import { cn } from '@/lib/utils';
import type { ThemeId } from '@/types';

const THEME_LIST: { id: ThemeId; label: string }[] = [
  { id: 'void_rpg', label: 'Void RPG' },
  { id: 'forest_warrior', label: 'Forest Warrior' },
  { id: 'solar_blaze', label: 'Solar Blaze' },
];

export default function Settings() {
  const { t } = useTranslation();
  const { theme, setTheme } = useSettingsStore();

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">{t('nav.settings')}</h1>
        <p className="mt-1 text-muted-foreground">Thème, langue, IA & notifications — Sprint 9.</p>
      </div>

      <div>
        <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Thème
        </h2>
        <div className="flex flex-wrap gap-3">
          {THEME_LIST.map((th) => (
            <button
              key={th.id}
              type="button"
              onClick={() => setTheme(th.id)}
              className={cn(
                'rounded-lg border px-5 py-2.5 font-display text-sm font-bold uppercase tracking-widest transition-all',
                theme === th.id
                  ? 'border-primary text-primary shadow-glow'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              {th.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
