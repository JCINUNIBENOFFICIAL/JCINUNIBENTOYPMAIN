-- Proposal only. Do not apply until reviewed and explicitly approved.
-- Browser-cookie voting is stored separately from authenticated votes. This preserves
-- the existing votes table, its auth.users foreign key, RLS policies, grants and data.

create table if not exists public.browser_voter_sessions (
    id uuid primary key default gen_random_uuid(),
    token_hash text not null unique
        check (token_hash ~ '^[0-9a-f]{64}$'),
    created_at timestamptz not null default now(),
    expires_at timestamptz not null,
    revoked_at timestamptz,
    constraint browser_voter_sessions_expiry_check check (expires_at > created_at)
);

create index if not exists idx_browser_voter_sessions_active_expiry
    on public.browser_voter_sessions (expires_at)
    where revoked_at is null;

alter table public.browser_voter_sessions enable row level security;
revoke all on public.browser_voter_sessions from public, anon, authenticated;
grant select, insert, update on public.browser_voter_sessions to service_role;

-- Keep cookie/browser votes separate so votes.voter_id remains an auth.users UUID
-- and the existing votes constraints and authenticated workflows are untouched.
create table if not exists public.browser_votes (
    id bigint generated always as identity primary key,
    voter_session_id uuid not null
        references public.browser_voter_sessions(id) on delete restrict,
    nomination_id integer not null
        references public.nominations(id) on delete restrict,
    category text not null,
    created_at timestamptz not null default now(),
    ip_address text,
    user_agent text,
    constraint browser_votes_session_category_key unique (voter_session_id, category)
);

create index if not exists idx_browser_votes_nomination_category
    on public.browser_votes (nomination_id, category);

alter table public.browser_votes enable row level security;
revoke all on public.browser_votes from public, anon, authenticated;
grant select, insert on public.browser_votes to service_role;

-- Atomic server-side validation + insert. The service_role key must never reach
-- browser code. SECURITY INVOKER keeps execution limited to service_role grants.
create or replace function public.submit_browser_vote(
    p_voter_id uuid,
    p_nomination_id integer,
    p_ip_address text default null,
    p_user_agent text default null
)
returns void
language plpgsql
set search_path = ''
as $function$
declare
    v_role text;
    v_category text;
    v_voting_open boolean;
    v_start_time timestamptz;
    v_close_time timestamptz;
begin
    v_role := auth.jwt() ->> 'role';
    if v_role is distinct from 'service_role' then
        raise exception 'Not authorised to submit browser votes' using errcode = '42501';
    end if;

    perform 1
      from public.browser_voter_sessions s
     where s.id = p_voter_id
       and s.revoked_at is null
       and s.expires_at > pg_catalog.now()
     for update;
    if not found then
        raise exception 'Voting session is invalid or expired' using errcode = '28000';
    end if;

    select coalesce(max(s.value) filter (where s.key = 'voting_open') = 'true', false),
           max(nullif(s.value, '')::timestamptz) filter (where s.key = 'voting_start_time'),
           max(nullif(s.value, '')::timestamptz) filter (where s.key = 'voting_close_time')
      into v_voting_open, v_start_time, v_close_time
      from public.settings s
     where s.key in ('voting_open', 'voting_start_time', 'voting_close_time');

    -- Fail closed: a live flag alone is not a valid voting schedule.
    -- Both boundaries must exist, be ordered, and contain the current time.
    if not v_voting_open
       or v_start_time is null
       or v_close_time is null
       or v_start_time >= v_close_time
       or pg_catalog.now() < v_start_time
       or pg_catalog.now() >= v_close_time then
        raise exception 'Voting is currently closed' using errcode = '55000';
    end if;

    select n.category
      into v_category
      from public.nominations n
     where n.id = p_nomination_id
       and n.merged_into_id is null
     for share;
    if not found or v_category is null then
        raise exception 'Nominee is not eligible for voting' using errcode = '22023';
    end if;

    if not exists (
        select 1
          from public.nominations eligible
         where (eligible.id = p_nomination_id or eligible.merged_into_id = p_nomination_id)
           and eligible.ready_for_voting is true
           and eligible.stage = 'finalist'
    ) then
        raise exception 'Nominee is not eligible for voting' using errcode = '22023';
    end if;

    insert into public.browser_votes
        (nomination_id, voter_session_id, category, ip_address, user_agent)
    values
        (p_nomination_id, p_voter_id, v_category,
         nullif(pg_catalog.left(p_ip_address, 128), ''),
         nullif(pg_catalog.left(p_user_agent, 500), ''));
end;
$function$;

revoke all on function public.submit_browser_vote(uuid, integer, text, text)
    from public, anon, authenticated;
grant execute on function public.submit_browser_vote(uuid, integer, text, text)
    to service_role;
