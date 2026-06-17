import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import BadgeShowcase from '@/components/badge/BadgeShowcase';

export default function Trophees() {
  const navigate = useNavigate();

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/profile')}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Retour au profil"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold">Salle des trophées</h1>
          <p className="text-xs text-muted-foreground">Tous tes badges, groupés par rareté.</p>
        </div>
      </div>

      <BadgeShowcase />
    </section>
  );
}
