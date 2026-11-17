import { FileVideo, Lock, Sparkles, UploadCloud, X } from 'lucide-react';
import { useEffect, useId, useState, type DragEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { LowCreditsBanner } from '@/components/billing/LowCreditsBanner';
import { usePaywall } from '@/components/billing/Paywall';
import { Button, Card, PageHeader } from '@/components/ui';
import { useCredits } from '@/hooks/useStore';
import { cn } from '@/lib/cn';
import { preloadFFmpeg } from '@/lib/ffmpeg';
import { formatDuration, formatSize } from '@/lib/format';
import { creditsFor } from '@/services/credits';
import { startAnalysis } from '@/services/jobs';
import { repository } from '@/services/repository';
import { sourceStore } from '@/services/sourceStore';
import { CLIP_LENGTHS, MAX_SOURCE_SECONDS, type ClipLengthId } from '@/types/domain';

interface Picked { file: File; url: string; duration: number }

/** Reads duration in the browser; also tells us whether the browser can decode the file at all. */
function readDuration(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => (Number.isFinite(v.duration) && v.duration > 0 ? resolve(v.duration) : reject(new Error('unknown duration')));
    v.onerror = () => reject(new Error('unreadable'));
    v.src = url;
  });
}

export default function NewProjectPage() {
  const navigate = useNavigate();
  const openPaywall = usePaywall();
  const { balance } = useCredits();
  const inputId = useId();
  const [picked, setPicked] = useState<Picked | null>(null);
  const [title, setTitle] = useState('');
  const [length, setLength] = useState<ClipLengthId>('medium');
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => () => { if (picked) URL.revokeObjectURL(picked.url); }, [picked]);

  const pick = async (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith('video/') && !/\.(mp4|mov|m4v|webm|mkv)$/i.test(file.name)) {
      setError('That isn’t a video file. Pick an MP4, MOV or WebM.');
      return;
    }
    const url = URL.createObjectURL(file);
    try {
      const duration = await readDuration(url);
      if (duration > MAX_SOURCE_SECONDS + 30) {
        URL.revokeObjectURL(url);
        setError(`This video is ${formatDuration(duration)} long. The limit is ${MAX_SOURCE_SECONDS / 60} minutes for now: trim it first, or split it in parts.`);
        return;
      }
      setPicked({ file, url, duration });
      setTitle(file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim().slice(0, 120));
      preloadFFmpeg();
    } catch {
      URL.revokeObjectURL(url);
      setError('Your browser can’t read this file. Convert it to MP4 (H.264) and try again.');
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    void pick(e.dataTransfer.files[0]);
  };

  const cost = picked ? creditsFor(picked.duration) : 0;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!picked) return;
    if (balance < cost) { openPaywall({ required: cost }); return; }
    setSubmitting(true);
    setError(null);
    try {
      const project = await repository.createProject({
        title: title.trim() || picked.file.name, sourceName: picked.file.name, sourceSize: picked.file.size,
        duration: picked.duration, clipLength: length,
      });
      await sourceStore.put(project.id, picked.file);
      startAnalysis(project.id, picked.file, picked.duration);
      navigate(`/app/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the project.');
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="New project" title="Turn a video into clips"
        description="Upload a long video. The AI finds the best moments and makes vertical clips with a title and captions." />
      <LowCreditsBanner />

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          {!picked ? (
            <label htmlFor={inputId}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}
              className={cn('flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-colors focus-within:ring-2 focus-within:ring-violet-500/50',
                dragging ? 'border-violet-400 bg-violet-500/10' : 'border-line/15 bg-ink-900 hover:border-violet-500/40 hover:bg-line/[0.02]')}>
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-violet-500/15 text-violet-300"><UploadCloud className="h-6 w-6" /></span>
              <span className="text-base font-medium text-zinc-100">Drop your video here, or click to choose</span>
              <span className="text-xs text-zinc-500">MP4, MOV or WebM · up to {MAX_SOURCE_SECONDS / 60} minutes · podcasts, interviews, vlogs, streams, talks</span>
              <input id={inputId} type="file" accept="video/*,.mkv" className="sr-only" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ''; }} />
            </label>
          ) : (
            <Card className="flex flex-col gap-4 sm:flex-row">
              <video src={picked.url} muted playsInline preload="metadata" className="aspect-video w-full rounded-xl bg-black object-contain sm:w-56" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="flex min-w-0 items-center gap-2 text-sm font-medium text-zinc-100"><FileVideo className="h-4 w-4 shrink-0 text-violet-300" /><span className="truncate">{picked.file.name}</span></p>
                  <button type="button" onClick={() => setPicked(null)} aria-label="Choose another video"
                    className="rounded-lg p-1 text-zinc-500 transition-colors hover:bg-line/5 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"><X className="h-4 w-4" /></button>
                </div>
                <p className="mt-1 text-xs tabular-nums text-zinc-500">{formatDuration(picked.duration)} · {formatSize(picked.file.size)}</p>
                <label htmlFor="title" className="label mt-4 block">Project name</label>
                <input id="title" name="title" className="input mt-2" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="My podcast episode 12…" autoComplete="off" />
              </div>
            </Card>
          )}

          <fieldset>
            <legend className="label mb-3">Clip length</legend>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(CLIP_LENGTHS) as ClipLengthId[]).map((k) => (
                <label key={k} className={cn('cursor-pointer rounded-xl border px-3 py-3 text-center text-sm transition-colors focus-within:ring-2 focus-within:ring-violet-500/50',
                  length === k ? 'border-violet-500/50 bg-violet-500/10 text-zinc-100' : 'border-line/10 text-zinc-400 hover:text-zinc-200')}>
                  <input type="radio" name="length" value={k} checked={length === k} onChange={() => setLength(k)} className="sr-only" />
                  <span className="block font-medium tabular-nums">{CLIP_LENGTHS[k].label}</span>
                  <span className="text-[11px] text-zinc-500">{k === 'short' ? 'Punchy' : k === 'medium' ? 'Recommended' : 'Story-driven'}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <p className="flex items-start gap-2 text-xs text-zinc-500"><Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Your video stays on your device: cutting and captions happen in your browser. Only the audio track is sent to the AI, then deleted.</p>
        </div>

        <aside>
          <Card className="lg:sticky lg:top-24">
            <p className="label">What you get</p>
            <ul className="mt-3 space-y-2 text-sm text-zinc-400">
              {['Up to 8 best moments, ranked by virality score', 'A catchy title for each clip', 'Word-timed captions in 3 styles', 'Vertical 9:16 MP4s, edits and exports free'].map((t) => (
                <li key={t} className="flex gap-2"><Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300" />{t}</li>
              ))}
            </ul>
            <div className="mt-5 border-t border-line/5 pt-4 text-sm">
              <div className="flex justify-between text-zinc-400"><span>Cost</span><span className="tabular-nums text-zinc-100">{picked ? `${cost} min` : '1 min per minute of video'}</span></div>
              <div className="mt-1 flex justify-between text-zinc-500"><span>Your balance</span><span className="tabular-nums">{balance} min</span></div>
            </div>
            <Button type="submit" size="lg" className="mt-5 w-full" disabled={!picked} loading={submitting}>
              {picked ? `Find the best moments · ${cost} min` : 'Choose a video first'}
            </Button>
            <p className="mt-2 text-center text-[11px] text-zinc-500">Charged only if clips are found.</p>
            {error && <p className="mt-3 rounded-lg bg-coral-500/10 px-3 py-2 text-xs text-coral-300" aria-live="polite">{error}</p>}
          </Card>
        </aside>
      </form>
    </>
  );
}
