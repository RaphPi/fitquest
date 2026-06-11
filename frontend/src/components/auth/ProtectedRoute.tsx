import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserStore } from '@/stores/userStore';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hydrate } = useUserStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    hydrate().finally(() => setChecked(true));
  }, [hydrate]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}
