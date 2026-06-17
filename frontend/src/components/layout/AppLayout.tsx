import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Dumbbell, BookOpen, User, Settings as SettingsIcon, Scale } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { xpRequiredForLevel } from '@/lib/xp';
import { getLevelTier } from '@/lib/levelTier';
import { avatarClassFromStage, getAvatarStageMeta } from '@/lib/avatar';
import { useUserStore } from '@/stores/userStore';
import XPBar from '@/components/ui/XPBar';
import LevelBadge from '@/components/ui/LevelBadge';
import Avatar from '@/components/avatar/Avatar';
import FitQuestIcon from '@/assets/logo/FitQuestIcon';
import GlobalBadgeUnlock from '@/components/badge/GlobalBadgeUnlock';
import type { ReactNode } from 'react';

// Sidebar : toutes les sections (6)
const SIDEBAR_NAV = [
  { to: '/', key: 'dashboard', icon: LayoutDashboard },
  { to: '/workout', key: 'workout', icon: Dumbbell },
  { to: '/body', key: 'body', icon: Scale },
  { to: '/library', key: 'library', icon: BookOpen },
  { to: '/profile', key: 'profile', icon: User },
  { to: '/settings', key: 'settings', icon: SettingsIcon },
] as const;

// BottomNav mobile : 5 entrées (Réglages = sidebar uniquement)
const BOTTOM_NAV = [
  { to: '/', key: 'dashboard', icon: LayoutDashboard },
  { to: '/workout', key: 'workout', icon: Dumbbell },
  { to: '/body', key: 'body', icon: Scale },
  { to: '/library', key: 'library', icon: BookOpen },
  { to: '/profile', key: 'profile', icon: User },
] as const;

const AUTH_ROUTES = ['/login', '/register'];


function MobileHeader() {
  const { user } = useUserStore();
  if (!user) return null;
  const tier = getLevelTier(user.level);

  return (
    <header
      className="fixed inset-x-0 top-0 z-20 flex items-center justify-between border-b border-border bg-card px-4 md:hidden"
      style={{ height: 'calc(3.5rem + env(safe-area-inset-top))', paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex items-center gap-2">
        <FitQuestIcon className="h-7 w-7" />
        <span className="font-display text-base font-thin tracking-[0.2em] text-white">
          FIT<span className="font-black text-primary-soft">QUEST</span>
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="text-right">
          <p className="font-display text-[11px] font-bold leading-none" style={{ color: tier.color }}>
            LVL {user.level}
          </p>
          <p className="mt-0.5 text-[10px] leading-none text-muted-foreground">
            {user.currentXP} / {xpRequiredForLevel(user.level)} XP
          </p>
        </div>
        <LevelBadge level={user.level} size="sm" />
      </div>
    </header>
  );
}

function Sidebar() {
  const { t } = useTranslation();
  const { user } = useUserStore();

  return (
    <aside className="hidden md:flex md:flex-col md:border-r md:border-border md:bg-card">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-border p-4 lg:p-5">
        <FitQuestIcon className="h-8 w-8 shrink-0" />
        <div className="hidden lg:block">
          <p className="font-display text-lg font-thin tracking-[0.2em] text-white leading-none">
            FIT<span className="font-black text-primary-soft">QUEST</span>
          </p>
          <p className="text-[9px] tracking-[0.45em] text-primary">LEVEL UP !</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex flex-1 flex-col gap-1 p-2 lg:p-3">
        {SIDEBAR_NAV.map(({ to, key, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition',
                isActive
                  ? 'bg-card-shield text-primary shadow-glow'
                  : 'text-muted-foreground hover:bg-card-shield/50 hover:text-foreground',
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="hidden lg:block">{t(`nav.${key}`)}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bloc héros (avatar-forward) */}
      {user && (() => {
        const tier = getLevelTier(user.level);
        const meta = getAvatarStageMeta(user.level);
        return (
          <div className="border-t border-border p-2 lg:p-4">
            <div className="flex items-center justify-center gap-3 lg:justify-start">
              <Avatar
                classKey={avatarClassFromStage(user.avatarStage)}
                level={user.level}
                size={36}
                animate={false}
                className="shrink-0"
              />
              <div className="hidden min-w-0 flex-1 lg:block">
                <p className="truncate text-sm font-semibold leading-tight text-foreground">{user.username}</p>
                <p className="mb-1.5 text-[11px] font-medium leading-tight" style={{ color: tier.color }}>
                  {meta.name} · Niv {user.level}
                </p>
                <XPBar
                  current={user.currentXP}
                  required={xpRequiredForLevel(user.level)}
                  level={user.level}
                  animated={false}
                  showLevel={false}
                />
              </div>
            </div>
          </div>
        );
      })()}
    </aside>
  );
}

function BottomNav() {
  const { t } = useTranslation();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-card pt-2 md:hidden"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)' }}
    >
      {BOTTOM_NAV.map(({ to, key, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              'flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-1 text-[10px] transition',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )
          }
        >
          <Icon className="h-5 w-5 shrink-0" />
          <span className="max-w-full truncate whitespace-nowrap leading-tight">{t(`navShort.${key}`)}</span>
        </NavLink>
      ))}
    </nav>
  );
}

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { pathname } = useLocation();
  if (AUTH_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader />
        <main className="min-w-0 flex-1 p-4 pt-[calc(env(safe-area-inset-top)_+_70px)] pb-24 md:p-6 md:pt-6 md:pb-6 lg:p-8">
          {children}
        </main>
      </div>
      <BottomNav />
      <GlobalBadgeUnlock />
    </div>
  );
}
