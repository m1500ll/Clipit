import type { SupabaseClient } from '@supabase/supabase-js';
import type { Clip, Database, ProjectWithClips } from '@/types/database';
import { InsufficientCreditsError } from '../errors';
import { store } from '../store';
import type { Repository } from './types';

function unwrap<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

function required<T>(res: { data: T; error: { message: string } | null }): NonNullable<T> {
  const data = unwrap(res);
  if (data == null) throw new Error('Unexpected empty response from the server.');
  return data;
}

/** Postgres numerics can arrive as strings: normalise once here. */
const normClip = (c: Clip): Clip => ({ ...c, start_s: Number(c.start_s), end_s: Number(c.end_s), captions: Array.isArray(c.captions) ? c.captions : [] });
const normProject = (p: ProjectWithClips): ProjectWithClips => ({
  ...p,
  duration_seconds: Number(p.duration_seconds),
  source_size: Number(p.source_size),
  clips: (p.clips ?? []).map(normClip).sort((a, b) => a.position - b.position),
});

/** Extracts the `{ error }` message our Edge Functions return on non-2xx responses. */
async function edgeError(error: unknown): Promise<string> {
  const ctx = (error as { context?: Response }).context;
  if (ctx && typeof ctx.json === 'function') {
    const body = (await ctx.json().catch(() => ({}))) as { error?: string };
    if (body.error) return body.error;
  }
  return error instanceof Error ? error.message : 'Request failed';
}

export function createSupabaseRepository(db: SupabaseClient<Database>): Repository {
  const uid = async () => {
    const { data } = await db.auth.getSession();
    const id = data.session?.user.id;
    if (!id) throw new Error('Please sign in again.');
    return id;
  };

  return {
    async getProfile() {
      return unwrap(await db.from('profiles').select('*').eq('id', await uid()).maybeSingle());
    },
    async listTransactions() {
      return unwrap(await db.from('credit_transactions').select('*').order('created_at', { ascending: false }).limit(100)) ?? [];
    },

    async listProjects() {
      const rows = unwrap(await db.from('projects').select('*, clips(*)').order('created_at', { ascending: false }));
      return (rows ?? []).map((p) => normProject(p as ProjectWithClips));
    },
    async getProject(id) {
      const row = unwrap(await db.from('projects').select('*, clips(*)').eq('id', id).maybeSingle());
      return row ? normProject(row as ProjectWithClips) : null;
    },
    async createProject(input) {
      const row = required(await db.from('projects').insert({
        user_id: await uid(), title: input.title.slice(0, 120), source_name: input.sourceName.slice(0, 200),
        source_size: input.sourceSize, duration_seconds: Math.round(input.duration * 100) / 100, clip_length: input.clipLength,
      }).select().single());
      store.notify();
      return { ...row, duration_seconds: Number(row.duration_seconds), source_size: Number(row.source_size) };
    },
    async renameProject(id, title) {
      unwrap(await db.from('projects').update({ title: title.slice(0, 120) }).eq('id', id));
      store.notify();
    },
    async deleteProject(id) {
      unwrap(await db.from('projects').delete().eq('id', id));
      store.notify();
    },

    async analyzeProject(id, audio) {
      const path = `${await uid()}/${id}.mp3`;
      const up = await db.storage.from('audio').upload(path, audio, { contentType: 'audio/mpeg', upsert: true });
      if (up.error) throw new Error(`Audio upload failed: ${up.error.message}`);
      const { error } = await db.functions.invoke('analyze', { body: { projectId: id } });
      store.notify();
      if (error) {
        const msg = await edgeError(error);
        if (/not enough credits/i.test(msg)) {
          const needed = Number(/needs (\d+)/.exec(msg)?.[1] ?? 0);
          throw new InsufficientCreditsError(needed, 0);
        }
        throw new Error(msg);
      }
    },

    async updateClip(id, patch) {
      const row = required(await db.from('clips').update(patch).eq('id', id).select().single());
      store.notify();
      return normClip(row);
    },
    async deleteClip(id) {
      unwrap(await db.from('clips').delete().eq('id', id));
      store.notify();
    },
  };
}

/** Live updates: any change to the user's rows refreshes the UI. */
export function subscribeToRealtime(db: SupabaseClient<Database>) {
  const channel = db.channel('clipit-live');
  for (const table of ['projects', 'clips', 'profiles', 'credit_transactions'] as const) {
    channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => store.notify());
  }
  channel.subscribe();
  return () => { db.removeChannel(channel); };
}
