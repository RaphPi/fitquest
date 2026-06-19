import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import BadgeShowcase from '@/components/badge/BadgeShowcase';

export default function Trophees() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/profile')}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
          aria-label={t('trophees.backToProfile')}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold">{t('trophees.title')}</h1>
          <p className="text-xs text-muted-foreground">{t('trophees.subtitle')}</p>
        </div>
      </div>

      <BadgeShowcase />
    </section>
  );
}
