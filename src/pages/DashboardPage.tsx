import { ArrowRight, Film, Plus, Scissors, Sparkles, UploadCloud } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LowCreditsBanner } from '@/components/billing/LowCreditsBanner';
import { Button, Card, LoadState, PageHeader, StatusBadge } from '@/components/ui';
import { useProjects } from '@/hooks/useStore';
import { formatDuration } from '@/lib/format';
import { isSupabaseConfigured } from '@/lib/supabase';

const STEPS = [
  { icon: UploadCloud, title: 'Upload a long video', text: 'A podcast, interview, stream or vlog, up to 30 minutes. It stays on your device.' },
  { icon: Sparkles, title: 'The AI finds the best moments', text: 'It ranks them, writes a title for each one and times the captions word by word.' },
  { icon: Scissors, title: 'Tweak and export', text: 'Adjust the trim, pick a caption style, and download vertical MP4s.' },
];

function FirstRun() {
  return (
    <Card className="relative overflow-hidden p-8 md:p-10">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl" />
      <p className="label">Get started</p>
      <h2 className="mt-2 max-w-lg text-balance font-display text-3xl text-zinc-50">Your first clips are about 2 minutes away</h2>
      <ol className="mt-8 grid gap-6 md:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, text }, i) => (
          <li key={title}>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/15 text-violet-300"><Icon className="h-5 w-5" /></span>
            <p className="mt-3 text-sm font-medium text-zinc-100"><span className="tabular-nums text-zinc-500">{i + 1}.</span> {title}</p>
            <p className="mt-1 text-xs text-zinc-500">{text}</p>
          </li>
        ))}
      </ol>
      <Link to="/app/new" className="mt-8 inline-block"><Button size="lg"><Plus className="h-4 w-4" /> Upload my first video</Button></Link>
      <p className="mt-3 text-xs text-zinc-500">You have free minutes to try it. You’re only charged when clips are found.</p>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: projects, loading, error } = useProjects();

  return (
    <>
      <PageHeader eyebrow="Projects" title="Your clips"
        actions={projects && projects.length > 0 ? <Link to="/app/new"><Button><Plus className="h-4 w-4" /> New project</Button></Link> : undefined} />
      {!isSupabaseConfigured && (
        <p className="mb-6 rounded-xl border border-sky-500/20 bg-sky-500/[0.06] px-4 py-3 text-sm text-sky-300">
          Demo mode: nothing is saved and the AI returns sample moments. Cutting and exporting are real.
        </p>
      )}
      <LowCreditsBanner />
      {!projects ? <LoadState loading={loading} error={error} /> : projects.length === 0 ? <FirstRun /> : (
        <ul className="grid gap-3">
          {projects.map((p) => {
            const best = [...p.clips].sort((a, b) => b.score - a.score)[0];
            return (
              <li key={p.id}>
                <Link to={`/app/projects/${p.id}`}
                  className="surface flex items-center gap-4 p-4 transition-colors hover:border-line/[0.14] hover:bg-line/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-ink-800 text-zinc-400"><Film className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><p className="truncate text-sm font-medium text-zinc-100">{p.title}</p><StatusBadge status={p.status} /></div>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      <span className="tabular-nums">{formatDuration(p.duration_seconds)}</span> · {p.status === 'ready' ? `${p.clips.length} clip${p.clips.length === 1 ? '' : 's'}` : 'no clips yet'}
                      {best && <> · Best: “{best.title}”</>}
                    </p>
                  </div>
                  <span className="hidden text-xs text-zinc-500 sm:block">{new Date(p.created_at).toLocaleDateString()}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-zinc-600" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
