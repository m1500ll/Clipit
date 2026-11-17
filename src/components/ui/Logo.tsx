import { Scissors } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50" aria-label="Clipit home">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-coral-400 text-white"><Scissors className="h-3.5 w-3.5" /></span>
      <span className="text-[15px] font-semibold tracking-tight text-zinc-100">clipit</span>
    </Link>
  );
}
