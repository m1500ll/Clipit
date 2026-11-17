import { ArrowLeft, ArrowRight, AudioLines, Check, Loader2, RotateCcw, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { usePaywall } from '@/components/billing/Paywall';
import { ClipPlayer } from '@/components/clips/ClipPlayer';
import { SourceMissing } from '@/components/clips/SourceMissing';
import { useSource } from '@/components/clips/useSource';
import { Button, Card, LoadState, Modal, ProgressBar, ScoreBadge, StatusBadge, useToast } from '@/components/ui';
import { useProject } from '@/hooks/useStore';
import { cn } from '@/lib/cn';
import { formatDuration } from '@/lib/format';
import { isBusy, startAnalysis, useJob, type Job } from '@/services/jobs';
import { repository } from '@/services/repository';
import { sourceStore } from '@/services/sourceStore';
import type { ProjectWithClips } from '@/types/database';

const AI_COPY = [
  'Listening to the whole video…',
  'Spotting hooks, punchlines and strong opinions…',
  'Checking each moment makes sense on its own…',
  'Writing scroll-stopping titles…',
  'Timing the captions word by word…',
];

function Step({ state, icon: Icon, title, detail }: { state: 'todo' | 'active' | 'done'; icon: typeof Wand2; title: string; detail: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-full',
        state === 'done' ? 'bg-emerald-500/15 text-emerald-300' : state === 'active' ? 'bg-violet-500/15 text-violet-300' : 'bg-line/5 text-zinc-600')}>
        {state === 'done' ? <Check className="h-4 w-4" /> : state === 'active' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      </span>
      <div className="min-w-0 flex-1 pt-1">
        <p className={cn('text-sm', state === 'todo' ? 'text-zinc-500' : 'text-zinc-100')}>{title}</p>
        <div className="mt-1 text-xs text-zinc-500">{detail}</div>
      </div>
    </li>
  );
}

/** Waiting on the browser (audio) then on the AI: say what's happening, show the shape of the result. */
function Working({ job, project }: { job: Job | undefined; project: ProjectWithClips }) {
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick((n) => n + 1), 3500); return () => clearInterval(t); }, []);
  const audioDone = !job || job.stage !== 'audio';
  const estimate = Math.round(Math.min(120, 20 + project.duration_seconds / 30));
  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card>
        <p className="label">Working on it</p>
        <ol className="mt-4 space-y-5">
          <Step state={audioDone ? 'done' : 'active'} icon={AudioLines} title="Reading the audio in your browser"
            detail={audioDone ? 'Done' : <><ProgressBar value={Math.round((job?.progress ?? 0) * 100)} max={100} /><span className="mt-1 block">Keep this tab open · {Math.round((job?.progress ?? 0) * 100)}%</span></>} />
          <Step state={audioDone ? 'active' : 'todo'} icon={Wand2} title="Finding the best moments"
            detail={audioDone ? <span aria-live="polite">{AI_COPY[tick % AI_COPY.length]} Usually {estimate < 60 ? `${estimate} s` : `${Math.round(estimate / 60)}–2 min`}.</span> : `About ${estimate < 60 ? `${estimate} s` : '1–2 min'}`} />
          <Step state="todo" icon={Sparkles} title="Clips ready to edit and export" detail="Titles, captions and vertical framing included" />
        </ol>
        <p className="mt-6 text-[11px] text-zinc-500">You’ll only be charged if clips are found.</p>
      </Card>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className={cn('space-y-3', i === 2 && 'hidden sm:block')}>
            <div className="aspect-[9/16] animate-pulse rounded-2xl bg-line/[0.05]" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-line/[0.06]" />
            <div className="h-3 w-2/5 animate-pulse rounded bg-line/[0.04]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProjectPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const openPaywall = usePaywall();
  const { data: project, loading, error } = useProject(projectId);
  const job = useJob(projectId);
  const source = useSource(projectId);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!project) {
    if (!loading && !error) {
      return <Card className="text-center"><p className="text-sm text-zinc-400">This project doesn’t exist or was deleted.</p><Link to="/app" className="mt-3 inline-block text-sm text-violet-300 hover:underline">Back to projects</Link></Card>;
    }
    return <LoadState loading={loading} error={error} />;
  }

  const working = isBusy(job) || project.status === 'analyzing';
  const failed = !working && (job?.stage === 'error' || project.status === 'failed' || project.status === 'uploading');
  const failMessage = job?.stage === 'error' ? job.error : project.error_message ?? 'Processing stopped before the AI step (the tab was closed or reloaded).';
  const needsCredits = job?.stage === 'error' ? job.needsCredits : /not enough credits/i.test(project.error_message ?? '') ? Math.ceil(project.duration_seconds / 60) : undefined;

  const retry = () => {
    if (!source.file) return;
    startAnalysis(project.id, source.file, project.duration_seconds);
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await repository.deleteProject(project.id);
      await sourceStore.remove(project.id);
      toast('Project deleted');
      navigate('/app');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not delete', 'error');
      setDeleting(false);
    }
  };

  return (
    <>
      <Link to="/app" className="mb-4 inline-flex items-center gap-1.5 rounded text-xs text-zinc-500 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"><ArrowLeft className="h-3.5 w-3.5" /> All projects</Link>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3"><StatusBadge status={working ? 'analyzing' : failed ? 'failed' : project.status} /><span className="text-xs tabular-nums text-zinc-500">{formatDuration(project.duration_seconds)} of video</span></div>
          <h1 className="mt-2 break-words font-display text-4xl text-zinc-50 text-balance">{project.title}</h1>
          <p className="mt-1 truncate text-xs text-zinc-500">{project.source_name}</p>
        </div>
        <Button variant="ghost" size="sm" className="self-start md:self-auto" onClick={() => setConfirmDelete(true)} disabled={working}><Trash2 className="h-3.5 w-3.5" /> Delete project</Button>
      </div>

      {!source.loading && !source.file && (project.status === 'ready' || failed) && (
        <div className="mb-6"><SourceMissing sourceName={project.source_name} sourceSize={project.source_size} onPick={(f) => void source.relink(f)} /></div>
      )}

      {working && <Working job={job} project={project} />}

      {failed && (
        <Card className="border-coral-500/20">
          <p className="text-sm font-medium text-zinc-100">We couldn’t finish this video</p>
          <p className="mt-1 text-sm text-zinc-400">{failMessage}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {needsCredits
              ? <Button onClick={() => openPaywall({ required: needsCredits })}>Get more minutes</Button>
              : <Button onClick={retry} disabled={!source.file}><RotateCcw className="h-4 w-4" /> Try again</Button>}
            {needsCredits && <Button variant="secondary" onClick={retry} disabled={!source.file}>I’ve topped up, try again</Button>}
          </div>
          {!source.file && <p className="mt-2 text-xs text-zinc-500">Select the video above to try again.</p>}
        </Card>
      )}

      {!working && project.status === 'ready' && (
        project.clips.length === 0
          ? <Card className="text-center text-sm text-zinc-400">All clips from this project were deleted.</Card>
          : (
            <>
              <p className="mb-4 text-sm text-zinc-400"><strong className="text-zinc-100">{project.clips.length} clip{project.clips.length > 1 ? 's' : ''}</strong> found, best first. Open one to fine-tune and export it.</p>
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {[...project.clips].sort((a, b) => b.score - a.score).map((c) => (
                  <li key={c.id} className="min-w-0">
                    {source.url
                      ? <ClipPlayer src={source.url} clip={c} compact />
                      : <div className="grid aspect-[9/16] place-items-center rounded-2xl bg-line/[0.04] px-4 text-center text-xs text-zinc-500">Select the video to preview</div>}
                    <div className="mt-3 flex items-center gap-2"><ScoreBadge score={c.score} /><span className="text-[11px] tabular-nums text-zinc-500">{formatDuration(c.end_s - c.start_s)} · at {formatDuration(c.start_s)}</span></div>
                    <p className="mt-1.5 line-clamp-2 text-sm font-medium text-zinc-100">{c.title}</p>
                    {c.reason && <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{c.reason}</p>}
                    <Link to={`/app/projects/${project.id}/clips/${c.id}`}
                      className="mt-2 inline-flex items-center gap-1 rounded text-xs font-medium text-violet-300 hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50">
                      Edit & export <ArrowRight className="h-3 w-3" />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )
      )}

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete this project?"
        footer={<><Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button><Button variant="danger" onClick={remove} loading={deleting}>Delete project</Button></>}>
        Its {project.clips.length} clip{project.clips.length === 1 ? '' : 's'} will be removed. Clips you already downloaded stay on your device. Minutes spent are not refunded.
      </Modal>
    </>
  );
}
