import type { Clip, CreditTransaction, Profile, Project, ProjectWithClips } from '@/types/database';
import { CLIP_LENGTHS, type Caption } from '@/types/domain';
import { creditsFor } from '../credits';
import { InsufficientCreditsError } from '../errors';
import { delay, store } from '../store';
import type { Repository } from './types';

/**
 * Demo mode (no Supabase configured): data lives in this tab, the "AI" returns sample moments
 * spread over the video so the whole flow — preview, edit, export — can be tried for real.
 */
const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();

const profile: Profile = { id: 'demo-user', display_name: 'Demo', plan: 'free', credit_balance: 30, stripe_customer_id: null, created_at: now() };
const transactions: CreditTransaction[] = [
  { id: id(), user_id: profile.id, type: 'bonus', amount: 30, balance_after: 30, project_id: null, description: 'Welcome bonus — 30 free minutes', created_at: now() },
];
const projects: Project[] = [];
const clips: Clip[] = [];

const SAMPLE_TITLES = [
  'Nobody tells you this about starting out',
  'The moment everything changed',
  'This one habit made the difference',
  'Wait for the ending…',
  'The mistake I see everyone make',
  'Here’s the honest truth',
];
const SAMPLE_WORDS = 'this is a demo caption the real ai writes the exact words spoken in your video with perfect timing'.split(' ');

function sampleCaptions(start: number, end: number): Caption[] {
  const out: Caption[] = [];
  let t = start;
  let w = 0;
  while (t < end - 0.2) {
    const n = 2 + (w % 3);
    const text = Array.from({ length: n }, (_, k) => SAMPLE_WORDS[(w + k) % SAMPLE_WORDS.length]).join(' ');
    const len = 0.35 * n;
    out.push({ start: +t.toFixed(2), end: +Math.min(end, t + len).toFixed(2), text });
    t += len;
    w += n;
  }
  return out;
}

const withClips = (p: Project): ProjectWithClips => ({
  ...p,
  clips: clips.filter((c) => c.project_id === p.id).sort((a, b) => a.position - b.position).map((c) => ({ ...c, captions: [...c.captions] })),
});

const patchProject = (pid: string, patch: Partial<Project>) => {
  const p = projects.find((x) => x.id === pid);
  if (p) Object.assign(p, patch, { updated_at: now() });
  store.notify();
};

export const mockRepository: Repository = {
  async getProfile() { return { ...profile }; },
  async listTransactions() { return [...transactions].reverse(); },

  async listProjects() { return [...projects].reverse().map(withClips); },
  async getProject(pid) {
    const p = projects.find((x) => x.id === pid);
    return p ? withClips(p) : null;
  },
  async createProject(input) {
    const p: Project = {
      id: id(), user_id: profile.id, title: input.title, source_name: input.sourceName, source_size: input.sourceSize,
      duration_seconds: input.duration, clip_length: input.clipLength, status: 'uploading', error_message: null,
      created_at: now(), updated_at: now(),
    };
    projects.push(p);
    store.notify();
    return p;
  },
  async renameProject(pid, title) { patchProject(pid, { title }); },
  async deleteProject(pid) {
    const i = projects.findIndex((x) => x.id === pid);
    if (i >= 0) projects.splice(i, 1);
    for (let k = clips.length - 1; k >= 0; k--) if (clips[k]!.project_id === pid) clips.splice(k, 1);
    store.notify();
  },

  async analyzeProject(pid) {
    const p = projects.find((x) => x.id === pid);
    if (!p) throw new Error('Project not found.');
    const cost = creditsFor(p.duration_seconds);
    if (profile.credit_balance < cost) throw new InsufficientCreditsError(cost, profile.credit_balance);
    patchProject(pid, { status: 'analyzing', error_message: null });
    await delay(3500);

    const { min, max } = CLIP_LENGTHS[p.clip_length];
    const len = Math.min((min + max) / 2, p.duration_seconds);
    const count = Math.max(1, Math.min(5, Math.floor(p.duration_seconds / (len + 5))));
    const gap = (p.duration_seconds - count * len) / (count + 1);
    for (let i = 0; i < count; i++) {
      const start = +(gap + i * (len + gap)).toFixed(2);
      const end = +(start + len).toFixed(2);
      clips.push({
        id: id(), project_id: pid, user_id: profile.id, position: i + 1, start_s: start, end_s: end,
        title: SAMPLE_TITLES[i % SAMPLE_TITLES.length]!, hook: 'Demo mode: the real AI quotes the opening line here.',
        reason: 'Demo mode: sample moment. Connect Supabase + Gemini for real AI picks.', score: 92 - i * 7,
        captions: sampleCaptions(start, end), caption_style: 'bold', layout: 'fill', show_title: true, created_at: now(), updated_at: now(),
      });
    }
    profile.credit_balance -= cost;
    transactions.push({ id: id(), user_id: profile.id, type: 'consumption', amount: -cost, balance_after: profile.credit_balance, project_id: pid, description: `AI clipping — ${p.title}`, created_at: now() });
    patchProject(pid, { status: 'ready' });
  },

  async updateClip(cid, patch) {
    const c = clips.find((x) => x.id === cid);
    if (!c) throw new Error('Clip not found.');
    Object.assign(c, patch, { updated_at: now() });
    store.notify();
    return { ...c };
  },
  async deleteClip(cid) {
    const i = clips.findIndex((x) => x.id === cid);
    if (i >= 0) clips.splice(i, 1);
    store.notify();
  },
};
