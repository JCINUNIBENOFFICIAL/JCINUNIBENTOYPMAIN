-- Public aggregate voting standings endpoint.
-- Requires the manual soft-merge migration to be applied first.
-- Returns aggregate counts and canonical nomination IDs only; never voter metadata.

create or replace function public.get_public_voting_standings()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
    with settings_state as (
        select
            coalesce(max(s.value) filter (where s.key = 'voting_open') = 'true', false) as flag_open,
            max(nullif(s.value, '')::timestamptz) filter (where s.key = 'voting_start_time') as starts_at,
            max(nullif(s.value, '')::timestamptz) filter (where s.key = 'voting_close_time') as closes_at
        from public.settings s
        where s.key in ('voting_open', 'voting_start_time', 'voting_close_time')
    ),
    eligible_roots as (
        select root.id as nominee_id, root.nominee_name, root.category
        from public.nominations root
        where root.merged_into_id is null
          and exists (
              select 1
              from public.nominations eligible
              where (eligible.id = root.id or eligible.merged_into_id = root.id)
                and eligible.ready_for_voting is true
                and eligible.stage = 'finalist'
          )
    ),
    nominee_totals as (
        select root.nominee_id, root.nominee_name, root.category,
               count(v.id)::bigint as vote_count
        from eligible_roots root
        left join public.nominations member
          on member.id = root.nominee_id or member.merged_into_id = root.nominee_id
        left join public.votes v
          on v.nomination_id = member.id
         and v.category = root.category
        group by root.nominee_id, root.nominee_name, root.category
    )
    select pg_catalog.jsonb_build_object(
        'voting_open',
        (state.flag_open
         and (state.starts_at is null or pg_catalog.now() >= state.starts_at)
         and (state.closes_at is null or pg_catalog.now() < state.closes_at)),
        'total_votes',
        coalesce((select pg_catalog.sum(nt.vote_count) from nominee_totals nt), 0),
        'nominees',
        coalesce((
            select pg_catalog.jsonb_agg(
                pg_catalog.jsonb_build_object(
                    'nomination_id', nt.nominee_id,
                    'nominee_name', nt.nominee_name,
                    'category', nt.category,
                    'vote_count', nt.vote_count
                )
                order by nt.category, nt.vote_count desc, nt.nominee_name
            )
            from nominee_totals nt
        ), '[]'::jsonb)
    )
    from settings_state state;
$function$;

revoke all on function public.get_public_voting_standings() from public, anon, authenticated;
grant execute on function public.get_public_voting_standings() to anon, authenticated;
