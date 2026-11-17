import { Coins, LayoutGrid, Loader2, Plus, UserRound } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { useAnyJobBusy } from '@/services/jobs';

const items = [
  { to: '/app', label: 'Projects', icon: LayoutGrid, end: true },
  { to: '/app/new', label: 'New', icon: Plus },
  { to: '/app/billing', label: 'Minutes', icon: Coins },
  { to: '/app/settings', label: 'Account', icon: UserRound },
];

/** Bottom tab bar for phones (the sidebar is hidden below lg). */
export function MobileNav() {
  const busy = useAnyJobBusy();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line/[0.06] bg-ink-950/90 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Main">
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} style={{ touchAction: 'manipulation' }}
          className={({ isActive }) => cn('relative flex flex-col items-center gap-1 py-2.5 text-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500/50', isActive ? 'text-violet-300' : 'text-zinc-500')}>
          {to === '/app' && busy ? <Loader2 className="h-5 w-5 animate-spin text-violet-300" /> : <Icon className="h-5 w-5" />}{label}
        </NavLink>
      ))}
    </nav>
  );
}
