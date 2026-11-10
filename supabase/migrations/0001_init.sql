Create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  avatar_url text,
  created_at timestamptz not null default now()
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
    using((select auth.uid()) = id);

create policy "modifier son propre profil"
    on public.profiles for update
    to authenticated
    using((select auth.uid()) = id)
    with check((select auth.uid()) = id);

create table public.log_imports (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
    name text not null,
    file_name text,
    file_format text not null check (file_format in ('csv', 'json')),
    status text not null default 'pending' check (status in ('pending', 'analyzed', 'failed')),
    total_lines integer not null default 0,
    invalid_lines integer not null default 0,
    created_at timestamptz not null default now(),
    analyzed_at timestamptz
);

create index log_imports_user_id_idx on public.log_imports (user_id);
alter table public.log_imports enable row level security;
grant select, insert, update, delete on public.log_imports to authenticated;

create policy "lire ses imports"
    on public.log_imports for select
    to authenticated
    using((select auth.uid()) = user_id);

create policy "creer ses imports"
    on public.log_imports for insert
    to authenticated
    with check((select auth.uid()) = user_id);

create policy "modifier ses imports"
    on public.log_imports for update to authenticated
    using((select auth.uid()) = user_id)
    with check((select auth.uid()) = user_id);

create policy "supprimer ses imports"
    on public.log_imports for delete to authenticated
    using((select auth.uid()) = user_id);

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

alter table public.log_events enable row level security;
grant select, insert, delete on public.log_events to authenticated;
create policy "lire ses evenements"
    on public.log_events for select
    to authenticated
    using((select auth.uid()) = user_id);

create policy "ajouter des events aux imports"
    on public.log_events for insert
    to authenticated
    with check((select auth.uid()) = user_id 
    and exists (
        select 1 from public.log_imports i where i.id = import_id and i.user_id = (select auth.uid())
        )
    );
create policy "supprimer ses events"
    on public.log_events for delete
    to authenticated
    using((select auth.uid()) = user_id);

create table public.alerts (
    id uuid primary key default gen_random_uuid(),
    import_id uuid references public.log_imports (id) on delete cascade,
    user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
    rule text not null check (rule in ('brute_force', 'password_spraying','impossible_travel','off_hours','new_ip','manual')),
    severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
    status text not null default 'open' check (status in ('open', 'investigating', 'resolved', 'false_positive')),
    title text not null,
    explanation text not null,
    usernames text[] not null default '{}',
    source_ips text[] not null default '{}',
    first_seen timestamptz,
    last_seen timestamptz,
    event_count integer not null default 0,
    ip_info jsonb,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index alerts_user_status_idx on public.alerts (user_id, status);
create index alerts_user_severity_idx on public.alerts (user_id, severity);
create index alerts_import_id_idx on public.alerts (import_id);

alter table public.alerts enable row level security;
grant select, insert, update, delete on public.alerts to authenticated;

create policy "lire ses alertes"
    on public.alerts for select
    to authenticated
    using((select auth.uid()) = user_id);

create policy "creer des alertes sur ses imports"
    on public.alerts for insert
    to authenticated
    with check((select auth.uid()) = user_id
    and (import_id is null or exists (
        select 1 from public.log_imports i where i.id = import_id and i.user_id = (select auth.uid())
        )
    ));
create policy "modifier ses alertes"
    on public.alerts for update
    to authenticated
    using((select auth.uid()) = user_id)
    with check((select auth.uid()) = user_id 
    and (import_id is null or exists (
        select 1 from public.log_imports i where i.id = import_id and i.user_id = (select auth.uid())
        )
    ));
create policy "supprimer ses alertes"
    on public.alerts for delete
    to authenticated
    using((select auth.uid()) = user_id);

