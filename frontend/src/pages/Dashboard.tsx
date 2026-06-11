import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const { t } = useTranslation();
  return (
    <section>
      <h1 className="text-2xl font-display font-bold">{t('dashboard.title')}</h1>
      <p className="mt-2 text-muted-foreground">{t('dashboard.welcome')}</p>
      <div className="mt-6 rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Sprint 1 — infrastructure en place. Streak, XP et prochaine séance arrivent au Sprint 8.
        </p>
      </div>
    </section>
  );
}
