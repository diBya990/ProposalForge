-- =====================================================================
-- ProposalForge database setup
-- How to use: Supabase -> SQL Editor -> New query -> paste this whole
-- file -> Run. It is safe to run again (it skips things that exist).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. PROFILES: one row per user, holds their career info and plan
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  full_name        text not null default '' check (char_length(full_name) <= 80),
  headline         text not null default '' check (char_length(headline) <= 120),
  location         text not null default '' check (char_length(location) <= 80),
  bio              text not null default '' check (char_length(bio) <= 2000),
  skills           text[] not null default '{}' check (cardinality(skills) <= 20),
  years_experience int not null default 0 check (years_experience between 0 and 60),
  hourly_rate      numeric(8, 2) not null default 0 check (hourly_rate between 0 and 1000),
  monthly_goal     numeric(10, 2) not null default 0 check (monthly_goal between 0 and 1000000),
  portfolio_links  text[] not null default '{}' check (cardinality(portfolio_links) <= 5),
  writing_tone     text not null default 'professional'
                   check (writing_tone in ('professional', 'friendly', 'confident', 'concise')),
  plan             text not null default 'free' check (plan in ('free', 'pro')),
  -- How many proposals were generated this month (users can't edit these two)
  usage_month      date not null default date_trunc('month', now())::date,
  usage_count      int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Each user can only see and edit their OWN profile
drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Business rule: users can NOT change their own plan (only payments can).
-- So we only allow them to write the career columns, never "plan".
revoke insert, update on public.profiles from anon, authenticated;
grant insert (id, full_name, headline, location, bio, skills, years_experience,
              hourly_rate, monthly_goal, portfolio_links, writing_tone)
  on public.profiles to authenticated;
grant update (full_name, headline, location, bio, skills, years_experience,
              hourly_rate, monthly_goal, portfolio_links, writing_tone)
  on public.profiles to authenticated;

-- Create a profile automatically whenever someone signs up
-- (email sign up sends full_name, Google sends full_name or name)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), 80)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Give a profile to users who signed up before this script was run
insert into public.profiles (id, full_name)
select id, left(coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name', ''), 80)
from auth.users
on conflict (id) do nothing;


-- ---------------------------------------------------------------------
-- 2. PROJECTS: the freelancer's work history = their earning history
-- ---------------------------------------------------------------------
create table if not exists public.projects (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title        text not null check (char_length(title) between 1 and 120),
  client_name  text not null default '' check (char_length(client_name) <= 80),
  platform     text not null default 'direct'
               check (platform in ('upwork', 'fiverr', 'linkedin', 'direct', 'other')),
  status       text not null default 'completed'
               check (status in ('in_progress', 'completed', 'cancelled')),
  amount       numeric(10, 2) not null default 0 check (amount between 0 and 1000000),
  started_on   date,
  completed_on date,
  description  text not null default '' check (char_length(description) <= 1000),
  created_at   timestamptz not null default now(),
  -- Business rule: a project can't finish before it starts
  check (completed_on is null or started_on is null or completed_on >= started_on),
  -- Business rule: a completed project must have a completion (payment) date
  check (status <> 'completed' or completed_on is not null)
);

create index if not exists projects_user_completed_idx
  on public.projects (user_id, completed_on desc);

alter table public.projects enable row level security;

drop policy if exists "Users manage own projects" on public.projects;
create policy "Users manage own projects" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ---------------------------------------------------------------------
-- 3. PROPOSALS: filled by the AI generator (Step 4).
--    Created now so the dashboard can show usage and win rate.
-- ---------------------------------------------------------------------
create table if not exists public.proposals (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  job_title       text not null default '',
  job_post        text not null check (char_length(job_post) between 1 and 15000),
  proposal        text not null default '',
  price_min       numeric(10, 2),
  price_max       numeric(10, 2),
  timeline        text,
  price_reasoning text,
  follow_ups      jsonb not null default '[]',
  status          text not null default 'draft'
                  check (status in ('draft', 'sent', 'replied', 'won', 'lost')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists proposals_user_created_idx
  on public.proposals (user_id, created_at desc);

alter table public.proposals enable row level security;

drop policy if exists "Users manage own proposals" on public.proposals;
create policy "Users manage own proposals" on public.proposals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Users may edit a proposal's content and status, but not who owns it or when it was made
revoke update on public.proposals from anon, authenticated;
grant update (job_title, job_post, proposal, price_min, price_max, timeline,
              price_reasoning, follow_ups, status)
  on public.proposals to authenticated;

-- Business rule: Free plan = 5 proposals per calendar month, Pro = unlimited.
-- Enforced here in the database, so nobody can get around it from the browser.
-- We count with a counter on the profile (not by counting rows), so deleting
-- old proposals does NOT give back free proposals.
create or replace function public.enforce_proposal_limit()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  this_month date := date_trunc('month', now())::date;
  p public.profiles%rowtype;
begin
  -- Make sure the profile exists, then lock it so two requests can't sneak past the limit
  insert into public.profiles (id) values (new.user_id) on conflict (id) do nothing;
  select * into p from public.profiles where id = new.user_id for update;

  -- New month? Start counting from zero again
  if p.usage_month <> this_month then
    p.usage_count := 0;
  end if;

  if p.plan = 'free' and p.usage_count >= 5 then
    raise exception 'FREE_LIMIT_REACHED: The Free plan includes 5 proposals per month. Upgrade to Pro for unlimited proposals.';
  end if;

  update public.profiles
  set usage_month = this_month, usage_count = p.usage_count + 1
  where id = new.user_id;

  return new;
end;
$$;

drop trigger if exists check_proposal_limit on public.proposals;
create trigger check_proposal_limit
  before insert on public.proposals
  for each row execute function public.enforce_proposal_limit();


-- ---------------------------------------------------------------------
-- 4. Keep "updated_at" correct automatically
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists proposals_updated_at on public.proposals;
create trigger proposals_updated_at
  before update on public.proposals
  for each row execute function public.set_updated_at();
