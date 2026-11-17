-- Clipit — full schema. Paste this whole file into Supabase → SQL Editor → Run (once).
-- Mirrors src/types/database.ts.

create type credit_tx_type as enum ('purchase','subscription_grant','consumption','refund','bonus');
create type project_status as enum ('uploading','analyzing','ready','failed');

-- ---------- Tables ----------

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  plan text not null default 'free' check (plan in ('free','creator','pro')),
  credit_balance integer not null default 30 check (credit_balance >= 0),
  stripe_customer_id text unique,
  created_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  title text not null,
  source_name text not null,
  source_size bigint not null default 0,
  duration_seconds numeric(8,2) not null check (duration_seconds > 0),
  clip_length text not null default 'medium' check (clip_length in ('short','medium','long')),
  status project_status not null default 'uploading',
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table clips (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  position smallint not null,
  start_s numeric(8,2) not null,
  end_s numeric(8,2) not null check (end_s > start_s),
  title text not null,
  hook text not null default '',
  reason text not null default '',
  score smallint not null default 50 check (score between 0 and 100),
  captions jsonb not null default '[]',
  caption_style text not null default 'bold' check (caption_style in ('bold','pop','clean')),
  layout text not null default 'fill' check (layout in ('fill','fit')),
  show_title boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  type credit_tx_type not null,
  amount integer not null,
  balance_after integer not null,
  project_id uuid references projects on delete set null,
  description text not null,
  created_at timestamptz not null default now()
);

-- Stripe idempotency: each event is applied at most once.
create table stripe_events (
  id text primary key,
  type text not null,
  processed_at timestamptz not null default now()
);

create index on projects (user_id, created_at desc);
create index on clips (project_id, position);
create index on credit_transactions (user_id, created_at desc);

create function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger projects_touch before update on projects for each row execute function touch_updated_at();
create trigger clips_touch before update on clips for each row execute function touch_updated_at();

-- ---------- Credits (server-only functions) ----------

-- Debit, called by the `analyze` Edge Function with the service role after a successful analysis.
create function charge_credits(p_user_id uuid, p_amount integer, p_project_id uuid, p_description text) returns integer
language plpgsql security definer set search_path = public as $$
declare new_balance integer;
begin
  if p_amount <= 0 then raise exception 'amount must be positive'; end if;
  update profiles set credit_balance = credit_balance - p_amount
    where id = p_user_id and credit_balance >= p_amount
    returning credit_balance into new_balance;
  if new_balance is null then raise exception 'insufficient_credits'; end if;
  insert into credit_transactions (user_id, type, amount, balance_after, project_id, description)
    values (p_user_id, 'consumption', -p_amount, new_balance, p_project_id, p_description);
  return new_balance;
end $$;

-- Grants, called by the Stripe webhook.
create function grant_credits(
  p_user_id uuid, p_amount integer, p_type credit_tx_type, p_description text,
  p_plan text default null, p_reset boolean default false
) returns integer
language plpgsql security definer set search_path = public as $$
declare new_balance integer;
begin
  if p_amount < 0 then raise exception 'amount must be >= 0'; end if;
  update profiles set
    -- Subscription renewals reset to the plan allowance (no rollover); top-ups add.
    credit_balance = case when p_reset then greatest(credit_balance, p_amount) else credit_balance + p_amount end,
    plan = coalesce(p_plan, plan)
  where id = p_user_id
  returning credit_balance into new_balance;
  if new_balance is null then raise exception 'profile not found'; end if;
  insert into credit_transactions (user_id, type, amount, balance_after, description)
    values (p_user_id, p_type, p_amount, new_balance, p_description);
  return new_balance;
end $$;

revoke execute on function charge_credits(uuid, integer, uuid, text) from public, anon, authenticated;
revoke execute on function grant_credits(uuid, integer, credit_tx_type, text, text, boolean) from public, anon, authenticated;
grant execute on function charge_credits(uuid, integer, uuid, text) to service_role;
grant execute on function grant_credits(uuid, integer, credit_tx_type, text, text, boolean) to service_role;

-- Every new user gets a profile with 30 free credits (= 30 minutes of video).
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name, plan, credit_balance)
  values (new.id, split_part(new.email, '@', 1), 'free', 30)
  on conflict (id) do nothing;
  insert into credit_transactions (user_id, type, amount, balance_after, description)
  values (new.id, 'bonus', 30, 30, 'Welcome bonus — 30 free minutes');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- Row Level Security ----------

alter table profiles enable row level security;
alter table projects enable row level security;
alter table clips enable row level security;
alter table credit_transactions enable row level security;
alter table stripe_events enable row level security; -- no policies: service role only

create policy "own profile read" on profiles for select using (id = auth.uid());
create policy "own profile update" on profiles for update using (id = auth.uid());
revoke update on profiles from authenticated;
grant update (display_name) on profiles to authenticated;

-- Projects: users create, read, rename and delete their own. Status is set by the server.
create policy "own projects read" on projects for select using (user_id = auth.uid());
create policy "own projects insert" on projects for insert with check (user_id = auth.uid() and status = 'uploading');
create policy "own projects update" on projects for update using (user_id = auth.uid());
create policy "own projects delete" on projects for delete using (user_id = auth.uid());
revoke update on projects from authenticated;
grant update (title) on projects to authenticated;

-- Clips: created by the server (after the AI step); users read, edit and delete their own.
create policy "own clips read" on clips for select using (user_id = auth.uid());
create policy "own clips update" on clips for update using (user_id = auth.uid());
create policy "own clips delete" on clips for delete using (user_id = auth.uid());
revoke update on clips from authenticated;
grant update (start_s, end_s, title, captions, caption_style, layout, show_title) on clips to authenticated;

create policy "own transactions read" on credit_transactions for select using (user_id = auth.uid());

-- ---------- Storage: temporary audio for the AI step ----------
-- Only the audio track is uploaded (never the video), into audio/<user id>/<project id>.mp3.
-- The `analyze` function deletes it once the clips are found.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('audio', 'audio', false, 15728640, array['audio/mpeg'])
on conflict (id) do nothing;

create policy "upload own audio" on storage.objects for insert to authenticated
  with check (bucket_id = 'audio' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "replace own audio" on storage.objects for update to authenticated
  using (bucket_id = 'audio' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "read own audio" on storage.objects for select to authenticated
  using (bucket_id = 'audio' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "delete own audio" on storage.objects for delete to authenticated
  using (bucket_id = 'audio' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- Realtime (live UI updates) ----------
alter publication supabase_realtime add table projects, clips, profiles, credit_transactions;
