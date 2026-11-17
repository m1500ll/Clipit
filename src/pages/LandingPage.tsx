import { ArrowRight, Captions, Check, Crop, Lock, Sparkles, Trophy, Type, UploadCloud, Wand2, Scissors } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MarketingNavbar } from '@/components/layout/MarketingNavbar';
import { Button, Logo } from '@/components/ui';
import { FAQ_ITEMS } from '@/data/faq';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { CREDIT_PACKS, formatMinutes, PLANS } from '@/services/credits';

function StartLink({ children, className }: { children: React.ReactNode; className?: string }) {
  const { session } = useAuth();
  return <Link to={session ? '/app/new' : '/login?mode=signup'} className={className}>{children}</Link>;
}

/** Illustration of the product loop: a long timeline → highlighted moments → vertical clips. Not real output. */
function HeroVisual() {
  const bars = Array.from({ length: 64 }, (_, i) => 20 + Math.round(Math.abs(Math.sin(i * 1.7) * 50 + Math.cos(i * 0.6) * 25)));
  const moments = [{ left: 12, width: 11, score: 94 }, { left: 47, width: 9, score: 88 }, { left: 74, width: 12, score: 81 }];
  const phones = [
    { title: 'Nobody talks about this part', caption: 'AND THAT’S WHEN', tone: 'from-violet-600/70 to-ink-900' },
    { title: 'The mistake that cost me a year', caption: 'I QUIT MY JOB', tone: 'from-coral-500/60 to-ink-900' },
    { title: 'Do this before you start', caption: 'TRUST ME ON THIS', tone: 'from-sky-500/50 to-ink-900' },
  ];
  return (
    <div className="mx-auto mt-14 max-w-4xl" aria-hidden="true">
      <div className="surface p-4 md:p-5">
        <div className="mb-3 flex items-center justify-between text-[11px] text-zinc-500"><span>podcast-episode-12.mp4</span><span className="tabular-nums">24:18</span></div>
        <div className="relative flex h-14 items-center gap-[3px]">
          {bars.map((h, i) => <span key={i} className="flex-1 rounded-full bg-line/15" style={{ height: `${h}%` }} />)}
          {moments.map((m) => (
            <span key={m.left} className="absolute inset-y-0 rounded-lg border-2 border-violet-400 bg-violet-500/20" style={{ left: `${m.left}%`, width: `${m.width}%` }}>
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-500 px-1.5 text-[10px] font-semibold tabular-nums text-white">{m.score}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-6 md:px-16">
        {phones.map((p, i) => (
          <div key={p.title} className={cn('relative aspect-[9/16] overflow-hidden rounded-2xl border border-line/10 bg-gradient-to-b', p.tone, i === 1 ? 'sm:-translate-y-4' : '')} style={{ containerType: 'inline-size' }}>
            <div className="absolute inset-x-[8%] top-[10%] text-center"><span className="bg-white px-1 font-extrabold leading-tight text-zinc-900 [box-decoration-break:clone]" style={{ fontSize: '7.5cqw' }}>{p.title}</span></div>
            <p className="absolute inset-x-0 bottom-[26%] text-center font-extrabold text-white" style={{ fontSize: '9cqw', WebkitTextStroke: '1.6cqw #000', paintOrder: 'stroke fill' }}>{p.caption}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-[11px] text-zinc-600">Illustration of the workflow</p>
    </div>
  );
}

const STEPS = [
  { icon: UploadCloud, title: 'Drop in a long video', text: 'Podcast, interview, stream, talk or vlog, up to 30 minutes. MP4, MOV or WebM.' },
  { icon: Wand2, title: 'AI picks the best moments', text: 'It listens to the whole thing, finds self-contained moments with a strong hook and ranks them by virality score.' },
  { icon: Scissors, title: 'Edit, export, post', text: 'Fine-tune the trim and captions, then download vertical MP4s for TikTok, YouTube Shorts and Reels.' },
];

const FEATURES = [
  { icon: Trophy, title: 'Virality score', text: 'Every moment is ranked 0–100 with a one-line reason, so you post the strongest ones first.' },
  { icon: Captions, title: 'Word-timed captions', text: 'Transcribed in the spoken language, shown 1–4 words at a time. Three styles. Every word is editable.' },
  { icon: Type, title: 'Titles that stop the scroll', text: 'A catchy title for each clip, on the video or copied to your post caption. Edit it freely.' },
  { icon: Crop, title: 'Vertical framing', text: 'Fill the 9:16 frame with a centre crop, or fit the whole shot on a blurred background.' },
  { icon: Lock, title: 'Your video stays with you', text: 'Cutting and captions happen in your browser. Only the audio goes to the AI, and it’s deleted right after.' },
  { icon: Sparkles, title: 'Pay per minute, export free', text: '1 credit = 1 minute of video analysed. Re-edit and export clips as many times as you like.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-ink-950">
      <MarketingNavbar />
      <main id="main">
        <section className="relative overflow-hidden">
          <div aria-hidden="true" className="bg-grid mask-fade-radial pointer-events-none absolute inset-0" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
          <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-20 text-center md:px-6 md:pt-28">
            <p className="label mx-auto inline-flex items-center gap-2 rounded-full border border-line/10 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-coral-400" /> For TikTok · YouTube Shorts · Reels
            </p>
            <h1 className="mx-auto mt-6 max-w-4xl text-balance font-display text-5xl leading-[1.05] text-zinc-50 md:text-7xl">
              One long video in, <em className="bg-gradient-to-r from-violet-300 to-coral-300 bg-clip-text italic text-transparent">ready-to-post clips</em> out
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-zinc-400 md:text-lg">
              Upload a podcast, interview or stream. The AI finds the best moments, cuts them to vertical, adds a catchy title and word-timed captions. You review, tweak and download.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <StartLink><Button size="lg" className="w-full sm:w-auto">Clip my first video free <ArrowRight className="h-4 w-4" /></Button></StartLink>
              <a href="#how"><Button size="lg" variant="secondary" className="w-full sm:w-auto">See how it works</Button></a>
            </div>
            <p className="mt-4 text-xs text-zinc-500">30 free minutes · No card required</p>
            <HeroVisual />
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 md:px-6">
          <p className="label text-center">How it works</p>
          <h2 className="mt-3 text-balance text-center font-display text-4xl text-zinc-50">From 30 minutes of footage to a week of posts</h2>
          <ol className="mt-12 grid gap-4 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="surface p-6">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/15 text-violet-300"><Icon className="h-5 w-5" /></span>
                <p className="mt-4 text-sm font-semibold text-zinc-100"><span className="tabular-nums text-zinc-500">{i + 1}.</span> {title}</p>
                <p className="mt-2 text-sm text-zinc-400">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 md:px-6">
          <p className="label text-center">Features</p>
          <h2 className="mt-3 text-balance text-center font-display text-4xl text-zinc-50">Everything a short needs, done for you</h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="surface p-6">
                <Icon className="h-5 w-5 text-coral-400" />
                <p className="mt-4 text-sm font-semibold text-zinc-100">{title}</p>
                <p className="mt-2 text-sm text-zinc-400">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 md:px-6">
          <p className="label text-center">Pricing</p>
          <h2 className="mt-3 text-balance text-center font-display text-4xl text-zinc-50">Pay for minutes of video, not for clips</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-zinc-400">1 credit = 1 minute of source video analysed. A 20-minute podcast uses 20. Edits and exports are always free, and you’re never charged if the AI fails.</p>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {PLANS.map((p) => {
              const featured = 'featured' in p && p.featured;
              return (
                <div key={p.id} className={cn('rounded-2xl border p-6', featured ? 'border-violet-500/40 bg-violet-500/[0.06]' : 'border-line/[0.07] bg-ink-900')}>
                  <div className="flex items-center justify-between"><p className="text-sm font-semibold text-zinc-100">{p.name}</p>{featured && <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] text-violet-200">Most popular</span>}</div>
                  <p className="mt-3 font-display text-5xl text-zinc-50">${p.price}<span className="font-sans text-sm text-zinc-500">{p.period === 'month' ? '/mo' : ''}</span></p>
                  <p className="mt-1 text-xs text-violet-300">{formatMinutes(p.credits)} of video {p.period === 'month' ? 'per month' : 'to start'}</p>
                  <ul className="mt-5 space-y-2">{p.perks.map((k) => <li key={k} className="flex gap-2 text-sm text-zinc-400"><Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />{k}</li>)}</ul>
                  <StartLink className="mt-6 block"><Button className="w-full" variant={featured ? 'primary' : 'secondary'}>{p.price === 0 ? 'Start free' : `Choose ${p.name}`}</Button></StartLink>
                </div>
              );
            })}
          </div>
          <p className="mt-6 text-center text-xs text-zinc-500">Top-ups that never expire: {CREDIT_PACKS.map((k) => `${formatMinutes(k.credits)} for $${k.price}`).join(' · ')}</p>
        </section>

        <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 md:px-6">
          <p className="label text-center">FAQ</p>
          <h2 className="mt-3 text-center font-display text-4xl text-zinc-50">Questions</h2>
          <div className="mt-10 divide-y divide-line/[0.07] border-y border-line/[0.07]">
            {FAQ_ITEMS.map(([q, a]) => (
              <details key={q} className="py-4">
                <summary className="cursor-pointer rounded text-sm font-medium text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50">{q}</summary>
                <p className="mt-2 text-sm text-zinc-400">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden px-4 py-24 text-center">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/15 blur-[120px]" />
          <h2 className="relative mx-auto max-w-2xl text-balance font-display text-4xl text-zinc-50 md:text-5xl">Your next 10 shorts are already in your last video</h2>
          <StartLink className="relative mt-8 inline-block"><Button size="lg">Clip my first video free <ArrowRight className="h-4 w-4" /></Button></StartLink>
        </section>
      </main>
      <footer className="border-t border-line/[0.06]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-xs text-zinc-500 sm:flex-row md:px-6">
          <Logo />
          <nav className="flex gap-6"><Link to="/privacy" className="hover:text-zinc-300">Privacy</Link><Link to="/login?mode=signin" className="hover:text-zinc-300">Sign in</Link></nav>
        </div>
      </footer>
    </div>
  );
}
