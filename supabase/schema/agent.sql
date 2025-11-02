-- agent.sql
-- Schema for persisting agent persona configuration, standardsvar og dokumentmetadata
begin;

-- Helper function to keep updated_at in sync
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Persona (en række pr. bruger)
create table if not exists public.agent_persona (
  user_id uuid primary key references auth.users(id) on delete cascade,
  signature text,
  scenario text,
  instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger agent_persona_set_updated_at
  before update on public.agent_persona
  for each row execute function public.handle_updated_at();

alter table public.agent_persona enable row level security;

create policy "agent_persona_select" on public.agent_persona
  for select using (auth.uid() = user_id);

create policy "agent_persona_modify" on public.agent_persona
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Standardsvar skabeloner
create table if not exists public.agent_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  source_body text,
  linked_mail_id text,
  linked_mail_provider text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agent_templates_user_idx on public.agent_templates(user_id, created_at desc);

create trigger agent_templates_set_updated_at
  before update on public.agent_templates
  for each row execute function public.handle_updated_at();

alter table public.agent_templates enable row level security;

create policy "agent_templates_select" on public.agent_templates
  for select using (auth.uid() = user_id);

create policy "agent_templates_modify" on public.agent_templates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Dokument metadata (selve filen bør ligge i Supabase storage eller andet lager)
create table if not exists public.agent_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_size bigint,
  storage_path text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agent_documents_user_idx on public.agent_documents(user_id, created_at desc);

create trigger agent_documents_set_updated_at
  before update on public.agent_documents
  for each row execute function public.handle_updated_at();

alter table public.agent_documents enable row level security;

create policy "agent_documents_select" on public.agent_documents
  for select using (auth.uid() = user_id);

create policy "agent_documents_modify" on public.agent_documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Automations / permissions
create table if not exists public.agent_automation (
  user_id uuid primary key references auth.users(id) on delete cascade,
  order_updates boolean default true,
  cancel_orders boolean default true,
  automatic_refunds boolean default false,
  historic_inbox_access boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger agent_automation_set_updated_at
  before update on public.agent_automation
  for each row execute function public.handle_updated_at();

alter table public.agent_automation enable row level security;

create policy "agent_automation_select" on public.agent_automation
  for select using (auth.uid() = user_id);

create policy "agent_automation_modify" on public.agent_automation
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

commit;
