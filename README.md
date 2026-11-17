# Clipit

Importe une longue vidéo → l’IA trouve les meilleurs moments → tu obtiens des clips verticaux (9:16) avec titre et sous-titres, prêts pour TikTok, YouTube Shorts et Reels.

- **La vidéo reste sur l’appareil** de l’utilisateur : la découpe et les sous-titres se font dans le navigateur (ffmpeg.wasm).
- **Seul l’audio** est envoyé à l’IA (Google Gemini), puis supprimé.
- **1 crédit = 1 minute de vidéo analysée.** L’export est gratuit et illimité.

## Essayer en local (mode démo, sans compte)

```bash
npm install
npm run dev
```

Ouvre http://localhost:5173. Sans fichier `.env`, l’app tourne en **mode démo** : l’IA renvoie des moments d’exemple, mais la découpe et l’export MP4 sont réels.

## Mise en ligne — étapes (une action à la fois)

1. **Créer un projet Supabase** sur https://supabase.com (nouveau projet, différent de Storyit).
2. **Créer la base** : Supabase → *SQL Editor* → colle tout `supabase/migrations/0001_init.sql` → *Run*.
3. **Clé Gemini** : https://aistudio.google.com/apikey → crée une clé.
4. **Secret** : Supabase → *Edge Functions* → *Secrets* → ajoute `GEMINI_API_KEY` = ta clé.
5. **Fonction IA** : Supabase → *Edge Functions* → *Deploy a new function* → nom `analyze` → colle `supabase/functions/analyze/index.ts` → *Deploy*.
6. **Brancher le site** : copie `.env.example` en `.env`, puis colle l’URL et la clé *anon/publishable* (Supabase → *Project Settings* → *API*).
7. *(Plus tard)* **Paiements Stripe** : fonctions `billing` et `stripe-webhook` (webhook avec « Verify JWT » désactivé) et secrets `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_CREATOR`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_PACK_120`, `STRIPE_PRICE_PACK_600`, `APP_URL`.

## Limites actuelles

- Vidéos jusqu’à 30 minutes (pour rester sous la limite de temps des fonctions Supabase).
- Pas encore de lien YouTube : il faudra un petit serveur vidéo en plus.
- L’export prend environ 1 à 2 fois la durée du clip (rendu dans le navigateur).
