begin;

create table if not exists public.rate_limit_buckets (
  bucket_key text primary key,
  request_count integer not null,
  reset_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.rate_limit_buckets enable row level security;
revoke all privileges on table public.rate_limit_buckets from anon, authenticated;
grant select, insert, update, delete on table public.rate_limit_buckets to service_role;

create or replace function public.consume_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table(allowed boolean, remaining integer, retry_after_seconds integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  now_ts timestamptz := clock_timestamp();
  bucket public.rate_limit_buckets%rowtype;
begin
  if p_key is null or btrim(p_key) = '' or p_limit < 1 or p_window_seconds < 1 then
    raise exception 'invalid rate limit arguments';
  end if;

  insert into public.rate_limit_buckets(bucket_key, request_count, reset_at, updated_at)
  values (p_key, 1, now_ts + make_interval(secs => p_window_seconds), now_ts)
  on conflict (bucket_key) do update
  set request_count = case
        when public.rate_limit_buckets.reset_at <= now_ts then 1
        else public.rate_limit_buckets.request_count + 1
      end,
      reset_at = case
        when public.rate_limit_buckets.reset_at <= now_ts then now_ts + make_interval(secs => p_window_seconds)
        else public.rate_limit_buckets.reset_at
      end,
      updated_at = now_ts
  returning * into bucket;

  return query
  select
    bucket.request_count <= p_limit,
    greatest(p_limit - bucket.request_count, 0),
    greatest(ceil(extract(epoch from (bucket.reset_at - now_ts)))::integer, 1);
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;

commit;
