import { useTranslation } from 'react-i18next';

export default function Library() {
  const { t } = useTranslation();
  return (
    <section>
      <h1 className="text-2xl font-display font-bold">{t('nav.library')}</h1>
      <p className="mt-2 text-muted-foreground">Bibliothèque d'exercices & filtres — Sprint 4.</p>
    </section>
  );
}
