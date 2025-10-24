-- Grundlæggende Shopify-schema med krypterede tokens
create extension if not exists pgcrypto;

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_user_id text not null,
  shop_domain text not null unique,
  access_token_encrypted bytea not null,
  created_at timestamptz not null default now()
);

comment on table public.shops is 'Gemmer Shopify Admin API adgangstoken for hver Clerk-bruger.';

-- RLS sikrer at brugere kun kan se deres egne rækker
alter table public.shops enable row level security;

create policy "owner can select own shops"
  on public.shops
  for select
  using (owner_user_id = auth.jwt()->>'sub');

create policy "owner can insert own shops"
  on public.shops
  for insert
  with check (owner_user_id = auth.jwt()->>'sub');

create policy "owner can update own shops"
  on public.shops
  for update
  using (owner_user_id = auth.jwt()->>'sub')
  with check (owner_user_id = auth.jwt()->>'sub');

create policy "owner can delete own shops"
  on public.shops
  for delete
  using (owner_user_id = auth.jwt()->>'sub');

-- Upsert-funktion bruges af edge function til at gemme token krypteret
create or replace function public.upsert_shop(
  p_owner_user_id text,
  p_domain text,
  p_access_token text,
  p_secret text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner text := coalesce(p_owner_user_id, auth.jwt()->>'sub');
  v_existing_owner text;
begin
  if v_owner is null then
    raise exception 'missing owner_user_id';
  end if;
  if p_secret is null or length(p_secret) = 0 then
    raise exception 'missing encryption secret';
  end if;

  select s.owner_user_id
  into v_existing_owner
  from public.shops as s
  where s.shop_domain = lower(trim(p_domain));

  if found and v_existing_owner is not null and v_existing_owner <> v_owner then
    raise exception 'shop domain already claimed by another user';
  end if;

  insert into public.shops (owner_user_id, shop_domain, access_token_encrypted)
  values (
    v_owner,
    lower(trim(p_domain)),
    extensions.pgp_sym_encrypt(p_access_token, p_secret)
  )
  on conflict (shop_domain)
  do update
    set owner_user_id = excluded.owner_user_id,
        access_token_encrypted = excluded.access_token_encrypted;
end;
$$;

revoke all on function public.upsert_shop(text, text, text, text) from public;
grant execute on function public.upsert_shop(text, text, text, text) to service_role;

-- Funktion til at hente og dekryptere token (kaldes kun fra server)
create or replace function public.get_shop_credentials_for_user(
  p_owner_user_id text,
  p_secret text
)
returns table (
  shop_domain text,
  access_token text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner text := coalesce(p_owner_user_id, auth.jwt()->>'sub');
begin
  if v_owner is null then
    raise exception 'missing owner_user_id';
  end if;
  if p_secret is null or length(p_secret) = 0 then
    raise exception 'missing encryption secret';
  end if;

  return query
    select
      s.shop_domain,
      extensions.pgp_sym_decrypt(s.access_token_encrypted, p_secret)::text as access_token
    from public.shops as s
    where s.owner_user_id = v_owner
    order by s.created_at desc
    limit 1;
end;
$$;

revoke all on function public.get_shop_credentials_for_user(text, text) from public;
grant execute on function public.get_shop_credentials_for_user(text, text) to service_role;
