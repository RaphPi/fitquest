import { useTranslation } from 'react-i18next';

export default function Workout() {
  const { t } = useTranslation();
  return (
    <section>
      <h1 className="text-2xl font-display font-bold">{t('nav.workout')}</h1>
      <p className="mt-2 text-muted-foreground">Mode guidé & libre — Sprint 6.</p>
    </section>
  );
}
