import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { LayoutDashboard, Dumbbell, BookOpen, User, Settings as SettingsIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import Dashboard from '@/pages/Dashboard';
import Workout from '@/pages/Workout';
import Library from '@/pages/Library';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const NAV = [
  { to: '/', key: 'dashboard', icon: LayoutDashboard },
  { to: '/workout', key: 'workout', icon: Dumbbell },
  { to: '/library', key: 'library', icon: BookOpen },
  { to: '/profile', key: 'profile', icon: User },
  { to: '/settings', key: 'settings', icon: SettingsIcon },
] as const;

const AUTH_ROUTES = ['/login', '/register'];

function Nav() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  if (AUTH_ROUTES.includes(pathname)) return null;
  return (
    <nav
      className={cn(
        'flex gap-1 border-border bg-card',
        'fixed inset-x-0 bottom-0 justify-around border-t p-2',
        'md:static md:h-screen md:w-56 md:flex-col md:justify-start md:border-r md:border-t-0 md:p-4',
      )}
    >
      <div className="hidden md:mb-6 md:block">
        <span className="font-display text-xl font-extrabold">
          FIT<span className="text-primary-soft">QUEST</span>
        </span>
        <p className="text-[10px] tracking-[0.4em] text-primary">LEVEL UP !</p>
      </div>
      {NAV.map(({ to, key, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 rounded-md px-3 py-2 text-xs transition md:flex-row md:gap-3 md:text-sm',
              isActive ? 'text-primary md:bg-card-shield' : 'text-muted-foreground hover:text-foreground',
            )
          }
        >
          <Icon className="h-5 w-5" />
          <span>{t(`nav.${key}`)}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default function App() {
  const { pathname } = useLocation();
  const isAuthPage = AUTH_ROUTES.includes(pathname);

  return (
    <div className={cn('min-h-screen', !isAuthPage && 'md:flex')}>
      <Nav />
      <main className={cn('flex-1', !isAuthPage && 'p-6 pb-24 md:pb-6')}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/workout" element={<ProtectedRoute><Workout /></ProtectedRoute>} />
          <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
