import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserStore } from '@/stores/userStore';

export default function Login() {
  const { login, isLoading, error, clearError } = useUserStore();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    clearError();
    try {
      await login({ username, password });
      navigate('/', { replace: true });
    } catch {
      // error set in store
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Logo */}
      <div className="mb-10 text-center">
        <h1 className="font-display text-4xl font-thin tracking-[0.3em] text-white">
          FIT<span className="font-black text-primary-soft">QUEST</span>
        </h1>
        <p className="mt-1 text-xs tracking-[0.5em] text-primary">LEVEL UP !</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-2xl"
      >
        <h2 className="mb-6 font-display text-xl font-bold text-foreground">Connexion</h2>

        {error && (
          <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Nom de héros
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="w-full rounded-lg border border-border bg-card-shield px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="ton_pseudo"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-border bg-card-shield px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-6 w-full rounded-lg bg-primary px-4 py-3 font-display text-sm font-bold uppercase tracking-widest text-white transition hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? 'Connexion…' : "Entrer dans l'arène"}
        </button>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-primary-soft hover:underline">
            Créer ton personnage
          </Link>
        </p>
      </form>
    </div>
  );
}
