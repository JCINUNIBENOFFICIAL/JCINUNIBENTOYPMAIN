-- Public aggregate voting standings endpoint.
-- Deployed to Supabase project xbrndlhzaluksjhdbnur through migration
-- create_public_voting_standings_rpc.
--
-- This endpoint returns nominee names, categories, aggregate vote counts,
-- total votes for eligible nominees, and the voting_open flag only.
-- It never returns voter IDs, emails, IP addresses, user agents, or ballots.
--
-- SECURITY DEFINER is required because the source tables have RLS enabled
-- and public visitors must not receive direct table access. The function:
--   * has no caller-controlled parameters or dynamic SQL;
--   * uses an empty, fixed search_path and fully-qualified table names;
--   * returns only aggregates for nominees explicitly marked ready_for_voting;
--   * has EXECUTE revoked from PUBLIC and granted only to anon/authenticated.

CREATE OR REPLACE FUNCTION public.get_public_voting_standings()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
    WITH eligible_nominees AS (
        SELECT n.id, n.nominee_name, n.category
        FROM public.nominations AS n
        WHERE n.ready_for_voting IS TRUE
    ),
    nominee_totals AS (
        SELECT
            e.id AS nominee_id,
            e.nominee_name,
            e.category,
            COUNT(v.id)::bigint AS vote_count
        FROM eligible_nominees AS e
        LEFT JOIN public.votes AS v
          ON v.nomination_id = e.id
         AND v.category = e.category
        GROUP BY e.id, e.nominee_name, e.category
    )
    SELECT pg_catalog.jsonb_build_object(
        'voting_open',
        COALESCE((
            SELECT s.value = 'true'
            FROM public.settings AS s
            WHERE s.key = 'voting_open'
            LIMIT 1
        ), false),
        'total_votes',
        COALESCE((SELECT pg_catalog.sum(nt.vote_count) FROM nominee_totals AS nt), 0),
        'nominees',
        COALESCE((
            SELECT pg_catalog.jsonb_agg(
                pg_catalog.jsonb_build_object(
                    'nominee_name', nt.nominee_name,
                    'category', nt.category,
                    'vote_count', nt.vote_count
                )
                ORDER BY nt.category, nt.vote_count DESC, nt.nominee_name
            )
            FROM nominee_totals AS nt
        ), '[]'::jsonb)
    );
$function$;

REVOKE ALL ON FUNCTION public.get_public_voting_standings() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_voting_standings() FROM anon;
REVOKE ALL ON FUNCTION public.get_public_voting_standings() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_voting_standings() TO anon, authenticated;
