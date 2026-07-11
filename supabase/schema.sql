-- AIA — Supabase schema
-- Para ativar:
-- 1. Crie projeto no Supabase
-- 2. Vá em SQL Editor e rode este arquivo
-- 3. Copie URL e anon key para .env.local
-- 4. Mude NEXT_PUBLIC_PERSISTENCE=supabase

create extension if not exists "pgcrypto";

create table if not exists boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  emoji text,
  created_at timestamptz default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references boards(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  column_key text not null check (column_key in ('backlog','today','doing','done')),
  position int not null default 0,
  title text not null,
  description text,
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  due_date timestamptz,
  start_date timestamptz,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  cover_color text,
  tags text[] default '{}',
  total_time_sec int default 0,
  hourly_rate numeric(10,2),
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  title text not null,
  done bool default false,
  done_at timestamptz,
  position int default 0,
  created_at timestamptz default now()
);

create table if not exists task_assignees (
  task_id uuid references tasks(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  primary key (task_id, user_id)
);

create table if not exists time_entries (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_sec int default 0,
  note text
);

create table if not exists routine_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  emoji text,
  start_minute int not null,
  end_minute int not null,
  recurrence text not null default 'daily',
  weekdays int[] default '{}',
  color text default '#cfd6a8',
  is_flexible bool default false,
  created_at timestamptz default now()
);

create table if not exists game_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  xp int default 0,
  level int default 1,
  streak_days int default 0,
  last_active_day date,
  updated_at timestamptz default now()
);

create table if not exists achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  key text not null,
  unlocked_at timestamptz default now(),
  unique(user_id, key)
);

create table if not exists xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  amount int not null,
  reason text,
  at timestamptz default now()
);

-- RLS
alter table boards enable row level security;
alter table tasks enable row level security;
alter table subtasks enable row level security;
alter table task_assignees enable row level security;
alter table time_entries enable row level security;
alter table routine_blocks enable row level security;
alter table game_state enable row level security;
alter table achievements enable row level security;
alter table xp_events enable row level security;

create policy "own boards" on boards for all using (auth.uid() = user_id);
create policy "own tasks" on tasks for all using (auth.uid() = user_id);
create policy "own subtasks" on subtasks for all using (
  exists (select 1 from tasks t where t.id = task_id and t.user_id = auth.uid())
);
create policy "own time_entries" on time_entries for all using (auth.uid() = user_id);
create policy "own routine" on routine_blocks for all using (auth.uid() = user_id);
create policy "own game" on game_state for all using (auth.uid() = user_id);
create policy "own achievements" on achievements for all using (auth.uid() = user_id);
create policy "own xp" on xp_events for all using (auth.uid() = user_id);
create policy "own assignments" on task_assignees for all using (auth.uid() = user_id);
