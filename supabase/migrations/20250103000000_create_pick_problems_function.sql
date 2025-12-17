create or replace function public.pick_problems(
  p_grade text,
  p_subject text,
  p_category text,
  p_qtype text,
  p_limit int,
  p_exclude_ids uuid[] default '{}'
)
returns setof public.problems
language sql
volatile
as $$
  select *
  from public.problems
  where grade = p_grade
    and subject = p_subject
    and category = p_category
    and (content->'raw'->>'qtype') = p_qtype
    and (p_exclude_ids = '{}'::uuid[] or id <> all(p_exclude_ids))
  order by random()
  limit p_limit;
$$;

