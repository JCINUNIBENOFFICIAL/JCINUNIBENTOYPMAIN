-- PROPOSAL ONLY — do not apply to production without separate approval.
-- Public endpoint for the live TOYP standings page.
-- It returns nominee names, categories, and aggregate vote counts only.
-- It never returns voter IDs, emails, IP addresses, or ballot-level records.
--
-- Eligible nominees are verified and explicitly marked ready_for_voting.
-- This function uses a fixed search_path and static SQL only.

CREATE OR REPLACE FUNCTION public.get_public_voting_standings()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
    WITH eligible_nominees AS (
        SELECT
            n.id,
            n.nominee_name,
            n.category
        FROM public.nominations AS n
        WHERE n.status = 'verified'
          AND n.ready_for_voting IS TRUE
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
    SELECT jsonb_build_object(
        'voting_open',
        COALESCE((
            SELECT s.value = 'true'
            FROM public.settings AS s
            WHERE s.key = 'voting_open'
            LIMIT 1
        ), false),
        'total_votes',
        COALESCE((SELECT SUM(nt.vote_count) FROM nominee_totals AS nt), 0),
        'nominees',
        COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'nominee_id', nt.nominee_id,
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

-- Public visitors need only EXECUTE permission on this aggregate-only function.
REVOKE ALL ON FUNCTION public.get_public_voting_standings() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_voting_standings() FROM anon;
REVOKE ALL ON FUNCTION public.get_public_voting_standings() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_voting_standings() TO anon, authenticated;

-- Verification after a separately approved deployment:
-- 1. Anonymous call returns only voting_open, total_votes, and nominees.
-- 2. Confirm no voter identifiers or ballot records are present in the payload.
-- 3. Confirm only verified, ready_for_voting nominees are returned.
-- 4. Confirm nominees with zero votes remain visible with vote_count = 0.
-- 5. Compare total_votes with the sum of nominee vote_count values.
