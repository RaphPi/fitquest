import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Dumbbell, BookOpen, User, Settings as SettingsIcon, Scale } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { xpRequiredForLevel } from '@/lib/xp';
import { getLevelTier } from '@/lib/levelTier';
import { avatarClassFromStage, getAvatarStageMeta } from '@/lib/avatar';
import { useUserStore } from '@/stores/userStore';
import XPBar from '@/components/ui/XPBar';
import Avatar from '@/components/avatar/Avatar';
import FitQuestIcon from '@/assets/logo/FitQuestIcon';
import GlobalBadgeUnlock from '@/components/badge/GlobalBadgeUnlock';
import OnboardingModal from '@/components/onboarding/OnboardingModal';
import SidebarWidgets from './SidebarWidgets';
import type { ReactNode } from 'react';

// Sidebar : toutes les sections (6)
const SIDEBAR_NAV = [
  { to: '/', key: 'dashboard', icon: LayoutDashboard },
  { to: '/workout', key: 'workout', icon: Dumbbell },
  { to: '/library', key: 'library', icon: BookOpen },
  { to: '/body', key: 'body', icon: Scale },
  { to: '/profile', key: 'profile', icon: User },
  { to: '/settings', key: 'settings', icon: SettingsIcon },
] as const;

// BottomNav mobile : 5 entrées (Réglages = sidebar + header uniquement)
// Ordre : Accueil / Programmes / Biblio / Corps / Profil
const BOTTOM_NAV = [
  { to: '/', key: 'dashboard', icon: LayoutDashboard },
  { to: '/workout', key: 'workout', icon: Dumbbell },
  { to: '/library', key: 'library', icon: BookOpen },
  { to: '/body', key: 'body', icon: Scale },
  { to: '/profile', key: 'profile', icon: User },
] as const;

const AUTH_ROUTES = ['/login', '/register'];


function MobileHeader() {
  const { t } = useTranslation();
  const { user } = useUserStore();
  if (!user) return null;
  const tier = getLevelTier(user.level);
  const xpRequired = xpRequiredForLevel(user.level);
  const xpPct = Math.min(100, (user.currentXP / xpRequired) * 100);

  return (
    <div className="fixed inset-x-0 top-0 z-20 md:hidden">
      <header
        className="flex items-center justify-between border-b border-border bg-card px-4"
        style={{ height: 'calc(3.5rem + env(safe-area-inset-top))', paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center gap-2">
          <FitQuestIcon className="h-7 w-7" />
          <span className="font-display text-base font-thin tracking-[0.2em] text-white">
            FIT<span className="font-black text-primary-soft">QUEST</span>
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <p
            className="max-w-[140px] truncate text-[11px] font-semibold leading-none"
            style={{ color: tier.color }}
          >
            {t('sidebar.levelFull', { level: user.level, username: user.username })}
          </p>
          <NavLink to="/settings" className="text-muted-foreground transition hover:text-foreground">
            <SettingsIcon className="h-5 w-5" />
          </NavLink>
        </div>
      </header>
      {/* XP bar fine full-width, juste sous le header */}
      <div className="relative h-1 w-full overflow-hidden bg-card-shield">
        <div
          className="relative h-full overflow-hidden transition-[width] duration-500"
          style={{
            width: `${xpPct}%`,
            background: `linear-gradient(to right, ${tier.gradient.from}, ${tier.gradient.to})`,
          }}
        >
          <div
            className="absolute inset-y-0 w-16 animate-xp-shimmer"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)' }}
          />
        </div>
      </div>
    </div>
  );
}

function Sidebar() {
  const { t } = useTranslation();
  const { user } = useUserStore();

  return (
    <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-[64px] md:flex-col md:border-r md:border-border md:bg-card lg:w-[224px]">
      {/* Logo */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border p-4 lg:p-5">
        <FitQuestIcon className="h-8 w-8 shrink-0" />
        <div className="hidden lg:block">
          <p className="font-display text-lg font-thin tracking-[0.2em] text-white leading-none">
            FIT<span className="font-black text-primary-soft">QUEST</span>
          </p>
          <p className="text-[9px] tracking-[0.45em] text-primary">LEVEL UP !</p>
        </div>
      </div>

      {/* Nav links — scrollable si viewport trop petit */}
      <nav className="flex shrink-0 flex-col gap-1 overflow-y-auto p-2 lg:p-3">
        {SIDEBAR_NAV.map(({ to, key, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            aria-label={t(`nav.${key}`)}
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

      <div className="flex-1 min-h-0 overflow-hidden">
        <SidebarWidgets />
      </div>

      {/* Bloc héros — sticky bas de sidebar, masque le contenu qui défile */}
      {user && (() => {
        const tier = getLevelTier(user.level);
        const meta = getAvatarStageMeta(user.level);
        return (
          <div className="shrink-0 border-t border-border bg-card p-2 lg:p-4">
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
                <p className="text-[11px] font-medium leading-tight" style={{ color: tier.color }}>
                  {meta.name} · {t('sidebar.level')} {user.level}
                </p>
                <p className="text-[11px] leading-tight text-muted-foreground">
                  {user.currentXP} / {xpRequiredForLevel(user.level)} XP
                </p>
              </div>
            </div>
            {/* XP bar pleine largeur sous le bloc avatar+nom+grade */}
            <div className="mt-2.5 hidden lg:block">
              <XPBar
                current={user.currentXP}
                required={xpRequiredForLevel(user.level)}
                level={user.level}
                animated={false}
                showLevel={false}
                showValue={false}
              />
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
              'flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-1 text-xs transition',
              isActive ? 'text-primary bg-primary/10 rounded-lg' : 'text-muted-foreground hover:text-foreground',
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
        {/* pt = safe-area + header 3.5rem + XPBar h-1 (4px) + buffer ≃ 74px */}
        <main className="min-w-0 flex-1 p-4 pt-[calc(env(safe-area-inset-top)_+_74px)] pb-24 md:p-6 md:pt-6 md:pb-6 lg:p-8">
          <div key={pathname} className="motion-safe:animate-page-enter min-w-0">
            {children}
          </div>
        </main>
      </div>
      <BottomNav />
      <GlobalBadgeUnlock />
      <OnboardingModal />
    </div>
  );
}
