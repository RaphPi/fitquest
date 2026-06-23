import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, BookOpen } from 'lucide-react';
import { slugify } from '@/lib/utils';
import MarkdownDocs from '@/components/docs/MarkdownDocs';
import helpFr from '@/docs/help.fr.md?raw';
import helpEn from '@/docs/help.en.md?raw';

const SECTIONS = {
  fr: ['Tableau de bord', 'Programmes', 'Séances', 'Corps', 'Profil', 'Réglages', 'Gamification'],
  en: ['Dashboard', 'Programs', 'Workouts', 'Body', 'Profile', 'Settings', 'Gamification'],
} as const;

export default function Help() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const lang = i18n.language.startsWith('fr') ? 'fr' : 'en';
  const content = lang === 'fr' ? helpFr : helpEn;
  const sections = SECTIONS[lang];

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

      <nav className="rounded-xl border border-border bg-card p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t('help.toc')}
        </p>
        <ul className="flex flex-wrap gap-2">
          {sections.map((section) => (
            <li key={section}>
              <a
                href={`#${slugify(section)}`}
                className="rounded-md bg-card-shield px-2.5 py-1 text-sm text-primary transition-colors hover:text-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                {section}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <MarkdownDocs content={content} />
    </section>
  );
}
