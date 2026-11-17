# Clipit

AI clipping SaaS: upload a long video → AI (Gemini, audio only) finds the best moments → vertical 9:16 clips with title + word-timed captions, rendered **in the browser** with ffmpeg.wasm.

React + Vite + TS + Tailwind front end, Supabase backend (`supabase/migrations`, `supabase/functions`).
- Before any UI work, follow the `clipit-ux` skill (`.claude/skills/clipit-ux/SKILL.md`).
- Data access only through `src/services/repository` (mock + Supabase implementations). Never call `supabase.from` from components (exception: trivial profile edit in Settings).
- The source video never leaves the user's device (`src/services/sourceStore.ts`, IndexedDB). Only the audio track is uploaded, and the `analyze` function deletes it.
- Export preview (`src/components/clips/ClipPlayer.tsx`) and burned-in subtitles (`src/lib/ass.ts`) must stay visually in sync.
- Secrets (Gemini, Stripe, service role) live only in Edge Function secrets — never in `VITE_` vars.
- Credits: 1 credit = 1 minute of source video, charged server-side only after success. Keep `src/services/credits.ts`, `supabase/functions/stripe-webhook` and `billing` in sync.
- The owner is a beginner and speaks French: explain steps simply, one action per step.
- Verify with `npx tsc -b && npm run build` and a Playwright run before pushing.
