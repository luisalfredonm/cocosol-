-- Contact form anti-spam log + rate limiting
-- Run once in the Supabase SQL editor. Idempotent: safe to re-run.
--
-- Backs the rate limiter in src/lib/antiSpam.ts. Every attempt is recorded,
-- including blocked ones — that is precisely what lets repeat offenders be
-- capped. It doubles as a lead log: real enquiries land here too, so a Resend
-- outage no longer means a lost customer.

create table if not exists public.contact_submissions (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),

  -- Salted SHA-256, not the raw address: this is for abuse control, not tracking.
  ip_hash          text,
  -- Gmail dots and +tags stripped, so aliases of one mailbox collapse to one key.
  email_normalized text,

  first_name       text,
  last_name        text,
  email            text,
  topic            text,
  message          text,

  spam_score       int   not null default 0,
  spam_reasons     text[] not null default '{}',
  verdict          text  not null check (verdict in ('delivered', 'flagged', 'blocked')),
  user_agent       text
);

-- The rate limiter only ever asks "how many rows for this key since T".
create index if not exists contact_submissions_ip_hash_created_idx
  on public.contact_submissions (ip_hash, created_at desc);

create index if not exists contact_submissions_email_created_idx
  on public.contact_submissions (email_normalized, created_at desc);

create index if not exists contact_submissions_created_idx
  on public.contact_submissions (created_at desc);

-- RLS on with no policies at all: the service-role key (server-side only)
-- bypasses RLS, everyone else gets nothing. Never expose this via the anon key.
alter table public.contact_submissions enable row level security;

comment on table public.contact_submissions is
  'Contact form log feeding the anti-spam rate limiter. Server-side access only.';


-- ── Useful queries ────────────────────────────────────────────────

-- What is getting blocked, and why:
--   select created_at, first_name, email, spam_score, spam_reasons
--   from contact_submissions where verdict = 'blocked'
--   order by created_at desc limit 50;

-- Real enquiries only:
--   select created_at, first_name, last_name, email, topic, message
--   from contact_submissions where verdict = 'delivered'
--   order by created_at desc limit 50;

-- Spam vs. real, last 30 days:
--   select verdict, count(*) from contact_submissions
--   where created_at > now() - interval '30 days' group by verdict;

-- Retention: drop blocked rows older than 90 days (they have served their
-- purpose once well past the 24h rate-limit window). Run manually, or schedule
-- with pg_cron if the project ever enables it.
--   delete from contact_submissions
--   where verdict = 'blocked' and created_at < now() - interval '90 days';
