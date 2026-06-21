import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserStore } from '@/stores/userStore';

// Garde de route admin : comme ProtectedRoute, mais exige aussi role === 'ADMIN'.
// Tente une hydratation si l'état n'est pas encore connu (refresh direct sur /admin).
export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, hydrate } = useUserStore();
  const [checked, setChecked] = useState(isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) return;
    hydrate().finally(() => setChecked(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />;
  return <>{children}</>;
}
