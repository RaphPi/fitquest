import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, BookOpen } from 'lucide-react';

export default function Help() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        >
          <ChevronLeft className="h-4 w-4" />
          {t('common.back')}
        </button>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 shrink-0 text-primary-soft" />
          <h1 className="font-display text-2xl font-bold">{t('help.title')}</h1>
        </div>
        <p className="mt-1 text-muted-foreground">{t('help.subtitle')}</p>
      </div>

      {/* Contenu ajouté à l'étape 2 */}
      <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">
        <BookOpen className="mx-auto mb-3 h-10 w-10 opacity-30" />
        <p className="text-sm">{t('common.loading')}</p>
      </div>
    </section>
  );
}
