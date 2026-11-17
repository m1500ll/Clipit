import type { FFFSType, FFmpeg } from '@ffmpeg/ffmpeg';
import type { Caption, CaptionStyleId, LayoutId } from '@/types/domain';
import { buildAss, FRAME } from './ass';

let instance: Promise<FFmpeg> | null = null;

/** Lazy-loads ffmpeg.wasm (self-hosted, ~30 MB, fetched the first time it's needed, then cached). */
function loadFFmpeg(): Promise<FFmpeg> {
  instance ??= (async () => {
    const [{ FFmpeg }, core, wasm] = await Promise.all([
      import('@ffmpeg/ffmpeg'),
      import('@ffmpeg/core?url'),
      import('@ffmpeg/core/wasm?url'),
    ]);
    const ff = new FFmpeg();
    await ff.load({ coreURL: core.default, wasmURL: wasm.default });
    await ff.createDir('/fonts');
    const font = await fetch('/fonts/caption.otf');
    if (!font.ok) throw new Error('Could not load the caption font.');
    await ff.writeFile('/fonts/caption.otf', new Uint8Array(await font.arrayBuffer()));
    return ff;
  })().catch((e) => { instance = null; throw e; });
  return instance;
}

/** Warm the engine in the background (e.g. when the user picks a file). */
export const preloadFFmpeg = () => { loadFFmpeg().catch(() => {}); };

let queue: Promise<unknown> = Promise.resolve();
/** ffmpeg.wasm runs one command at a time: serialise jobs. */
function exclusive<T>(job: () => Promise<T>): Promise<T> {
  const next = queue.then(job, job);
  queue = next.catch(() => {});
  return next;
}

/**
 * Mounts the source read-only (WORKERFS: no copy into memory, so multi-GB files work),
 * runs one ffmpeg command, and reports progress as 0..1 of `duration` seconds.
 */
async function run(source: Blob, duration: number, args: (input: string) => string[], output: string, onProgress?: (p: number) => void) {
  return exclusive(async () => {
    const ff = await loadFFmpeg();
    const dir = `/in${Date.now()}`;
    await ff.createDir(dir);
    await ff.mount('WORKERFS' as FFFSType, { blobs: [{ name: 'source', data: source }] }, dir);
    const onTick = ({ time }: { time: number }) => onProgress?.(Math.min(1, Math.max(0, time / 1_000_000 / duration)));
    ff.on('progress', onTick);
    try {
      const code = await ff.exec(args(`${dir}/source`));
      if (code !== 0) throw new Error('The video could not be processed. Try another file (MP4 or MOV work best).');
      const data = await ff.readFile(output);
      await ff.deleteFile(output).catch(() => {});
      return data as Uint8Array<ArrayBuffer>;
    } finally {
      ff.off('progress', onTick);
      await ff.unmount(dir).catch(() => {});
      await ff.deleteDir(dir).catch(() => {});
    }
  });
}

/** Mono 16 kHz MP3 at 24 kbps (~11 MB per hour): small enough to send to the AI. */
export const AUDIO_BITRATE = 24_000;

export async function extractAudio(source: Blob, duration: number, onProgress?: (p: number) => void): Promise<Blob> {
  const data = await run(source, duration,
    (input) => ['-i', input, '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'libmp3lame', '-b:a', '24k', 'audio.mp3'],
    'audio.mp3', onProgress);
  return new Blob([data], { type: 'audio/mpeg' });
}

export interface RenderClipOptions {
  source: Blob;
  start: number;
  end: number;
  captions: Caption[];
  title: string | null;
  style: CaptionStyleId;
  layout: LayoutId;
  onProgress?: (p: number) => void;
}

/** Cuts [start, end], reframes to vertical 9:16, burns in captions and title. Returns an MP4. */
export async function renderClip(o: RenderClipOptions): Promise<Blob> {
  const duration = Math.max(1, o.end - o.start);
  const ff = await loadFFmpeg();
  await ff.writeFile('subs.ass', buildAss(o));
  const subs = `subtitles=subs.ass:fontsdir=/fonts`;
  const { w, h } = FRAME;
  const graph = o.layout === 'fill'
    ? `[0:v]crop='min(iw,ih*9/16)':'min(ih,iw*16/9)',scale=${w}:${h},setsar=1,${subs}[v]`
    : `[0:v]split=2[a][b];[a]scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},boxblur=24:2[bg];`
      + `[b]scale=${w}:${h}:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1,${subs}[v]`;
  const data = await run(o.source, duration, (input) => [
    '-ss', o.start.toFixed(2), '-i', input, '-t', duration.toFixed(2),
    '-filter_complex', graph, '-map', '[v]', '-map', '0:a?',
    '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23', '-pix_fmt', 'yuv420p', '-r', '30',
    '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', 'clip.mp4',
  ], 'clip.mp4', o.onProgress);
  return new Blob([data], { type: 'video/mp4' });
}
