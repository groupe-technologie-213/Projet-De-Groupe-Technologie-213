Create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  avatar_url text,
  created_at timestamp not null default now()
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'user_name', new.email),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

grant select, update on public.profiles to authenticated;

create policy "lire son propre profil"
    on public.profiles for select
    to authenticated
    using((select auth.uid() = id));

create policy "modifier son propre profil"
    on public.profiles for update
    to authenticated
    using((select auth.uid() = id))
    with check((select auth.uid() = id));

create table public.log_imports (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
    name text not null,
    file_name text,
    file_format text not null check (file_format in ('csv', 'json')),
    status text not null default 'pending' check (status in ('pending', 'analyzed', 'failed')),
    total_lines integer not null default 0,
    invalid_lines integer not null default 0,
    created_at timestamp not null default now(),
    analyzed_at timestamptz
);

create index log_imports_user_id_idx on public.log_imports (user_id);
alter table public.log_imports enable row level security;
grant select, insert, update on public.log_imports to authenticated;

create policy "lire ses imports"
    on public.log_imports for select
    to authenticated
    using((select auth.uid() = user_id));

create policy "creer ses imports"
    on public.log_imports for insert
    to authenticated
    with check((select auth.uid() = user_id));

create policy "modifier ses imports"
    on public.log_imports for update to authenticated
    using((select auth.uid() = user_id))
    with check((select auth.uid() = user_id));

create policy "supprimer ses imports"
    on public.log_imports for delete to authenticated
    using((select auth.uid() = user_id));

create table public.log_events (
    id uuid primary key default gen_random_uuid(),
    import_id uuid not null references public.log_imports (id) on delete cascade,
    user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
    occurred_at timestamptz not null,
    username text not null,
    source_ip inet not null,
    event_type text not null check (event_type in ('login_success', 'login_failure', 'password_change', 'logout')),
    user_agent text );

create index log_events_user_time_idx on public.log_events (import_id, username, occurred_at);
create index log_events_import_ip_time_idx  on public.log_events (import_id, source_ip, occurred_at);
