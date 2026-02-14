-- ============================================
-- AI Customer Service (MVP) - Supabase Schema
-- Tables:
--   conversations, messages, tickets, knowledge_base
-- Includes:
--   enums, foreign keys, indexes, updated_at triggers
-- ============================================

-- 1) Extensions (uuid generation)
create extension if not exists "pgcrypto";

-- 2) Enums
do $$ begin
  create type conversation_status as enum (
    'open',
    'ai_handling',
    'escalated',
    'human_handling',
    'closed'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type message_sender as enum (
    'customer',
    'ai',
    'agent'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type ticket_status as enum (
    'open',
    'assigned',
    'resolved',
    'closed'
  );
exception
  when duplicate_object then null;
end $$;

-- 3) Tables

-- conversations
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  status conversation_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_type message_sender not null,
  content text not null,
  created_at timestamptz not null default now()
);

-- tickets
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  status ticket_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- knowledge_base (read-only in MVP, but table exists)
create table if not exists public.knowledge_base (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category text,
  created_at timestamptz not null default now()
);

-- 4) Indexes (performance basics)
create index if not exists idx_messages_conversation_id_created_at
  on public.messages (conversation_id, created_at desc);

create index if not exists idx_tickets_conversation_id
  on public.tickets (conversation_id);

create index if not exists idx_conversations_status_updated_at
  on public.conversations (status, updated_at desc);

create index if not exists idx_tickets_status_updated_at
  on public.tickets (status, updated_at desc);

create index if not exists idx_kb_category
  on public.knowledge_base (category);

-- 5) updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- conversations updated_at trigger
drop trigger if exists trg_conversations_updated_at on public.conversations;
create trigger trg_conversations_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

-- tickets updated_at trigger
drop trigger if exists trg_tickets_updated_at on public.tickets;
create trigger trg_tickets_updated_at
before update on public.tickets
for each row execute function public.set_updated_at();


create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'agent',
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup (optional but useful)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'agent')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();


-- Helper: check if current user is an agent/admin
create or replace function public.is_agent()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('agent','admin')
  );
$$;

-- PROFILES
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

-- CONVERSATIONS
alter table public.conversations enable row level security;

drop policy if exists "conversations_select_agents" on public.conversations;
create policy "conversations_select_agents"
on public.conversations for select
using (public.is_agent());

drop policy if exists "conversations_update_agents" on public.conversations;
create policy "conversations_update_agents"
on public.conversations for update
using (public.is_agent())
with check (public.is_agent());

-- MESSAGES
alter table public.messages enable row level security;

drop policy if exists "messages_select_agents" on public.messages;
create policy "messages_select_agents"
on public.messages for select
using (public.is_agent());

drop policy if exists "messages_insert_agents" on public.messages;
create policy "messages_insert_agents"
on public.messages for insert
with check (public.is_agent());

-- TICKETS
alter table public.tickets enable row level security;

drop policy if exists "tickets_select_agents" on public.tickets;
create policy "tickets_select_agents"
on public.tickets for select
using (public.is_agent());

drop policy if exists "tickets_update_agents" on public.tickets;
create policy "tickets_update_agents"
on public.tickets for update
using (public.is_agent())
with check (public.is_agent());

drop policy if exists "tickets_insert_agents" on public.tickets;
create policy "tickets_insert_agents"
on public.tickets for insert
with check (public.is_agent());

-- KNOWLEDGE BASE (read-only for agents)
alter table public.knowledge_base enable row level security;

drop policy if exists "kb_select_agents" on public.knowledge_base;
create policy "kb_select_agents"
on public.knowledge_base for select
using (public.is_agent());
