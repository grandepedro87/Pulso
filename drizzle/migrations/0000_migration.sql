-- Roles
create type public.app_role as enum ('admin', 'moderator', 'user');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Atleta',
  avatar_url text,
  bio text,
  sports text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint display_name_len check (char_length(display_name) between 1 and 60),
  constraint bio_len check (bio is null or char_length(bio) <= 280)
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- User roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users see own roles; admins see all" on public.user_roles
  for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "Profiles readable by signed-in users" on public.profiles
  for select to authenticated using (true);
create policy "Users insert own profile" on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy "Users update own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Activities
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  sport text not null,
  title text not null,
  description text,
  duration_minutes integer not null,
  activity_date date not null default current_date,
  distance_km numeric(7,2),
  sets integer,
  reps integer,
  image_url text,
  created_at timestamptz not null default now(),
  constraint sport_valid check (sport in ('musculacao','corrida','ciclismo','futebol','basquete','natacao','calistenia','outros')),
  constraint title_len check (char_length(title) between 1 and 100),
  constraint desc_len check (description is null or char_length(description) <= 1000),
  constraint duration_range check (duration_minutes between 1 and 1440),
  constraint distance_range check (distance_km is null or (distance_km > 0 and distance_km <= 1000)),
  constraint sets_range check (sets is null or sets between 1 and 100),
  constraint reps_range check (reps is null or reps between 1 and 1000)
);
create index activities_user_date_idx on public.activities(user_id, activity_date desc);
grant select, insert, update, delete on public.activities to authenticated;
grant all on public.activities to service_role;
alter table public.activities enable row level security;

create policy "Activities readable by signed-in users" on public.activities
  for select to authenticated using (true);
create policy "Users insert own activities" on public.activities
  for insert to authenticated with check (user_id = auth.uid());
create policy "Users update own activities" on public.activities
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Owners or admins delete activities" on public.activities
  for delete to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- Posts
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_id uuid references public.activities(id) on delete set null,
  sport text not null,
  content text not null,
  image_url text,
  created_at timestamptz not null default now(),
  constraint post_sport_valid check (sport in ('musculacao','corrida','ciclismo','futebol','basquete','natacao','calistenia','outros')),
  constraint content_len check (char_length(content) between 1 and 1000)
);
create index posts_created_idx on public.posts(created_at desc);
create index posts_user_idx on public.posts(user_id, created_at desc);
grant select, insert, update, delete on public.posts to authenticated;
grant all on public.posts to service_role;
alter table public.posts enable row level security;

create policy "Posts readable by signed-in users" on public.posts
  for select to authenticated using (true);
create policy "Users insert own posts" on public.posts
  for insert to authenticated with check (
    user_id = auth.uid()
    and (activity_id is null or exists (select 1 from public.activities a where a.id = activity_id and a.user_id = auth.uid()))
  );
create policy "Users update own posts" on public.posts
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Owners or admins delete posts" on public.posts
  for delete to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- Likes
create table public.likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
grant select, insert, delete on public.likes to authenticated;
grant all on public.likes to service_role;
alter table public.likes enable row level security;

create policy "Likes readable by signed-in users" on public.likes
  for select to authenticated using (true);
create policy "Users like as themselves" on public.likes
  for insert to authenticated with check (user_id = auth.uid());
create policy "Users remove own likes" on public.likes
  for delete to authenticated using (user_id = auth.uid());

-- Comments
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  constraint comment_len check (char_length(content) between 1 and 500)
);
create index comments_post_idx on public.comments(post_id, created_at);
grant select, insert, update, delete on public.comments to authenticated;
grant all on public.comments to service_role;
alter table public.comments enable row level security;

create policy "Comments readable by signed-in users" on public.comments
  for select to authenticated using (true);
create policy "Users comment as themselves" on public.comments
  for insert to authenticated with check (user_id = auth.uid());
create policy "Users update own comments" on public.comments
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Owners, post owners or admins delete comments" on public.comments
  for delete to authenticated using (
    user_id = auth.uid()
    or public.has_role(auth.uid(), 'admin')
    or exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid())
  );

-- Follows
create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint no_self_follow check (follower_id <> following_id)
);
create index follows_following_idx on public.follows(following_id);
grant select, insert, delete on public.follows to authenticated;
grant all on public.follows to service_role;
alter table public.follows enable row level security;

create policy "Follows readable by signed-in users" on public.follows
  for select to authenticated using (true);
create policy "Users follow as themselves" on public.follows
  for insert to authenticated with check (follower_id = auth.uid());
create policy "Users unfollow as themselves" on public.follows
  for delete to authenticated using (follower_id = auth.uid());

-- updated_at trigger for profiles
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- New user: create profile; first user ever becomes admin
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _name text;
begin
  _name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    split_part(new.email, '@', 1),
    'Atleta'
  );
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, left(_name, 60), new.raw_user_meta_data->>'avatar_url');

  insert into public.user_roles (user_id, role) values (new.id, 'user');

  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Admin: list users with email
create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  is_admin boolean,
  posts_count bigint,
  activities_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;
  return query
    select p.id, u.email::text, p.display_name, p.avatar_url, p.created_at, u.last_sign_in_at,
      public.has_role(p.id, 'admin'),
      (select count(*) from public.posts po where po.user_id = p.id),
      (select count(*) from public.activities a where a.user_id = p.id)
    from public.profiles p
    join auth.users u on u.id = p.id
    order by p.created_at desc;
end;
$$;

revoke execute on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;