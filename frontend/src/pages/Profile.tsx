import { useTranslation } from 'react-i18next';

export default function Profile() {
  const { t } = useTranslation();
  return (
    <section>
      <h1 className="text-2xl font-display font-bold">{t('nav.profile')}</h1>
      <p className="mt-2 text-muted-foreground">Avatar, boutique XP & badges — Sprint 7.</p>
    </section>
  );
}
