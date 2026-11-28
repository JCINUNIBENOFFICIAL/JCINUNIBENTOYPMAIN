-- Public aggregate voting standings endpoint.
-- Proposal update: confirmed soft-merged nomination records display as one canonical
-- nominee in the same category. Unmerged name-similar records remain separate.
-- Votes against retained source records are included in the canonical nominee total.
-- Only aggregate counts and nomination IDs are exposed; voter metadata is never returned.

CREATE OR REPLACE FUNCTION public.get_public_voting_standings()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
    WITH eligible_roots AS (
        SELECT root.id AS nominee_id, root.nominee_name, root.category
        FROM public.nominations root
        WHERE root.merged_into_id IS NULL
          AND EXISTS (
              SELECT 1
              FROM public.nominations eligible
              WHERE (eligible.id = root.id OR eligible.merged_into_id = root.id)
                AND eligible.ready_for_voting IS TRUE
                AND eligible.stage = 'finalist'
          )
    ),
    nominee_totals AS (
        SELECT root.nominee_id, root.nominee_name, root.category,
               COUNT(v.id)::bigint AS vote_count
        FROM eligible_roots root
        LEFT JOIN public.nominations member
          ON member.id = root.nominee_id OR member.merged_into_id = root.nominee_id
        LEFT JOIN public.votes v
          ON v.nomination_id = member.id
         AND v.category = root.category
        GROUP BY root.nominee_id, root.nominee_name, root.category
    )
    SELECT pg_catalog.jsonb_build_object(
        'voting_open',
        COALESCE((
            SELECT s.value = 'true'
            FROM public.settings s
            WHERE s.key = 'voting_open'
            LIMIT 1
        ), false),
        'total_votes',
        COALESCE((SELECT pg_catalog.sum(nt.vote_count) FROM nominee_totals nt), 0),
        'nominees',
        COALESCE((
            SELECT pg_catalog.jsonb_agg(
                pg_catalog.jsonb_build_object(
                    'nomination_id', nt.nominee_id,
                    'nominee_name', nt.nominee_name,
                    'category', nt.category,
                    'vote_count', nt.vote_count
                )
                ORDER BY nt.category, nt.vote_count DESC, nt.nominee_name
            )
            FROM nominee_totals nt
        ), '[]'::jsonb)
    );
$function$;

REVOKE ALL ON FUNCTION public.get_public_voting_standings() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_voting_standings() TO anon, authenticated;
