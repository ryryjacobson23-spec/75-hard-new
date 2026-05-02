-- program_settings
create table if not exists public.program_settings (
  user_id uuid references auth.users(id) on delete cascade primary key,
  start_date date,
  bodyweight_lbs integer,
  created_at timestamptz default now()
);
alter table public.program_settings enable row level security;
create policy "Users manage own settings" on public.program_settings
  for all using (auth.uid() = user_id);

-- daily_checklist
create table if not exists public.daily_checklist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  lifted boolean default false,
  active_done boolean default false,
  ate_clean boolean default false,
  drank_water boolean default false,
  code_session boolean default false,
  created_at timestamptz default now(),
  unique(user_id, date)
);
alter table public.daily_checklist enable row level security;
create policy "Users manage own checklist" on public.daily_checklist
  for all using (auth.uid() = user_id);

-- workout_sessions
create type workout_type_enum as enum ('upper', 'lower', 'push', 'pull', 'legs', 'active');

create table if not exists public.workout_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  workout_type workout_type_enum not null,
  notes text,
  duration_minutes integer,
  created_at timestamptz default now()
);
alter table public.workout_sessions enable row level security;
create policy "Users manage own sessions" on public.workout_sessions
  for all using (auth.uid() = user_id);

-- workout_exercises
create table if not exists public.workout_exercises (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.workout_sessions(id) on delete cascade not null,
  exercise_name text not null,
  sets integer,
  reps integer,
  weight_lbs decimal,
  order_index integer default 0
);
alter table public.workout_exercises enable row level security;
create policy "Users manage own exercises" on public.workout_exercises
  for all using (
    exists (
      select 1 from public.workout_sessions ws
      where ws.id = session_id and ws.user_id = auth.uid()
    )
  );

-- body_stats
create table if not exists public.body_stats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  weight_lbs decimal not null,
  unique(user_id, date)
);
alter table public.body_stats enable row level security;
create policy "Users manage own body stats" on public.body_stats
  for all using (auth.uid() = user_id);
