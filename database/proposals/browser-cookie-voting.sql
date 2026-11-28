-- Proposal only. Do not run against production until reviewed and approved.
-- Browser-cookie voting uses a random opaque token. Only its SHA-256 hash is stored.
-- Existing authenticated voter UUIDs remain valid; the votes.voter_id FK is removed
-- because new browser session UUIDs are not auth.users records. Existing votes remain.

create table if not exists public.browser_voter_sessions (
    id uuid primary key default gen_random_uuid(),
    token_hash text not null unique,
    created_at timestamptz not null default now(),
    expires_at timestamptz not null,
    revoked_at timestamptz
);

alter table public.browser_voter_sessions enable row level security;
revoke all on public.browser_voter_sessions from public, anon, authenticated;

-- Server-side Vercel API only, using SUPABASE_SERVICE_ROLE_KEY.
-- service_role bypasses RLS; do not grant this table to public browser clients.
alter table public.votes
    drop constraint if exists votes_voter_id_fkey;

-- Ensure the trusted server-side API can manage sessions and insert votes.
grant all on public.browser_voter_sessions to service_role;
grant insert on public.votes to service_role;

-- Existing votes_voter_id_category_key enforces one vote per browser identity/category.
-- Keep it. A database unique violation is handled as a duplicate-vote response.
