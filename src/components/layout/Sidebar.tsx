import { Coins, CreditCard, LayoutGrid, LifeBuoy, Loader2, Plus, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useCredits, useProjects } from '@/hooks/useStore';
import { cn } from '@/lib/cn';
import { useAnyJobBusy } from '@/services/jobs';
import { usePaywall } from '../billing/Paywall';
import { Logo } from '../ui';

interface Item { to: string; label: string; icon: typeof LayoutGrid; end?: boolean; badge?: React.ReactNode }

function NavItem({ to, label, icon: Icon, end, badge }: Item) {
  return (
    <NavLink to={to} end={end}
      className={({ isActive }) => cn(
        'flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50',
        isActive ? 'bg-line/[0.07] text-zinc-50' : 'text-zinc-400 hover:bg-line/[0.04] hover:text-zinc-200',
      )}>
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {badge}
    </NavLink>
  );
}

export function Sidebar() {
  const { data: projects = [] } = useProjects();
  const { balance } = useCredits();
  const busy = useAnyJobBusy();
  const openPaywall = usePaywall();
  const clipCount = projects.reduce((n, p) => n + p.clips.length, 0);

  const sections: { title: string; items: Item[] }[] = [
    {
      title: 'Clip',
      items: [
        { to: '/app/new', label: 'New project', icon: Plus },
        {
          to: '/app', label: 'Projects', icon: LayoutGrid, end: true,
          badge: busy ? <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-300" aria-label="Processing" />
            : clipCount > 0 ? <span className="rounded-full bg-line/[0.08] px-1.5 text-[10px] font-semibold tabular-nums text-zinc-400">{clipCount}</span> : null,
        },
      ],
    },
    {
      title: 'Account',
      items: [
        { to: '/app/billing', label: 'Plan & minutes', icon: CreditCard },
        { to: '/app/settings', label: 'Settings', icon: Settings },
        { to: '/app/help', label: 'Help', icon: LifeBuoy },
      ],
    },
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-y-auto border-r border-line/[0.06] bg-ink-950 px-4 py-5 lg:flex">
      <Logo to="/app" />
      <nav className="mt-8 space-y-6" aria-label="Main">
        {sections.map((s) => (
          <div key={s.title}>
            <p className="label mb-1.5 px-3 text-[10px]">{s.title}</p>
            <div className="space-y-0.5">{s.items.map((i) => <NavItem key={i.to} {...i} />)}</div>
          </div>
        ))}
      </nav>
      <div className="mt-auto pt-6">
        <div className="surface p-4">
          <p className="label flex items-center gap-1.5 text-[10px]"><Coins className="h-3 w-3" /> Minutes left</p>
          <p className="mt-1 font-display text-3xl tabular-nums text-zinc-50">{balance}</p>
          <p className="text-[11px] text-zinc-500">1 credit = 1 minute of video</p>
          <button onClick={() => openPaywall()} className="mt-3 w-full rounded-lg bg-violet-500/15 py-1.5 text-xs font-medium text-violet-300 transition-colors hover:bg-violet-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50">
            Get more minutes
          </button>
        </div>
      </div>
    </aside>
  );
}
