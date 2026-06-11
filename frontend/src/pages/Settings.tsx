import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settingsStore';
import type { ThemeId } from '@/types';

const THEMES: { id: ThemeId; label: string }[] = [
  { id: 'void_rpg', label: 'Void RPG' },
  { id: 'forest_warrior', label: 'Forest Warrior' },
  { id: 'solar_blaze', label: 'Solar Blaze' },
];

export default function Settings() {
  const { t } = useTranslation();
  const { theme, setTheme } = useSettingsStore();

  return (
    <section>
      <h1 className="text-2xl font-display font-bold">{t('nav.settings')}</h1>
      <p className="mt-2 text-muted-foreground">Thème, langue, IA & notifications — Sprint 9.</p>

      <div className="mt-6 flex gap-3">
        {THEMES.map((th) => (
          <button
            key={th.id}
            type="button"
            onClick={() => setTheme(th.id)}
            className={`rounded-md border px-4 py-2 text-sm transition ${
              theme === th.id ? 'border-primary text-primary shadow-glow' : 'text-muted-foreground'
            }`}
          >
            {th.label}
          </button>
        ))}
      </div>
    </section>
  );
}
