import { Coins } from 'lucide-react';
import { useCredits } from '@/hooks/useStore';
import { usePaywall } from './Paywall';

/** Warn before the user hits the wall instead of blocking mid-flow. */
export function LowCreditsBanner({ threshold = 10 }: { threshold?: number }) {
  const { balance, loading } = useCredits();
  const openPaywall = usePaywall();
  if (loading || balance >= threshold) return null;
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 sm:flex-row sm:items-center">
      <Coins className="hidden h-4 w-4 shrink-0 text-amber-300 sm:block" />
      <p className="flex-1 text-sm text-amber-100/90">
        You have <strong className="tabular-nums">{balance}</strong> minute{balance === 1 ? '' : 's'} of video left. Editing and exporting existing clips stays free.
      </p>
      <button onClick={() => openPaywall()}
        className="shrink-0 rounded-lg bg-amber-400/15 px-3 py-1.5 text-xs font-medium text-amber-200 transition-colors hover:bg-amber-400/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50">
        Get more minutes
      </button>
    </div>
  );
}
