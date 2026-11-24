-- 이 파일이 하는 일: profiles, groups, entries 스키마와 RLS·쓰기 RPC를 초기화한다.
begin;

-- ── 테이블 ──────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 20)
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) <= 30 and name ~ '[^[:space:]]'),
  invite_code text not null unique,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index group_members_user_id_idx on public.group_members (user_id);

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) <= 100 and title ~ '[^[:space:]]'),
  body text not null check (char_length(body) <= 2000 and body ~ '[^[:space:]]'),
  created_at timestamptz not null default now()
);
create index entries_author_id_idx on public.entries (author_id);

create table public.entry_shares (
  entry_id uuid not null references public.entries (id) on delete cascade,
  group_id uuid not null references public.groups (id) on delete cascade,
  primary key (entry_id, group_id)
);
create index entry_shares_group_id_idx on public.entry_shares (group_id);

-- ── 브라우저 권한: 읽기만 ───────────────────────────────
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.entries enable row level security;
alter table public.entry_shares enable row level security;

revoke all privileges on table
  public.profiles, public.groups, public.group_members, public.entries, public.entry_shares
  from public, anon, authenticated;
grant select on table
  public.profiles, public.groups, public.group_members, public.entries, public.entry_shares
  to authenticated;

-- ── 소속 검사 함수 (RLS 재귀 방지) ──────────────────────
create schema if not exists private;
grant usage on schema private to authenticated;

create function private.is_group_member(gid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.group_members m
    where m.group_id = gid and m.user_id = (select auth.uid())
  );
$$;

create function private.can_read_entry(eid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.entry_shares s
    join public.group_members m on m.group_id = s.group_id
    where s.entry_id = eid and m.user_id = (select auth.uid())
  );
$$;

create function private.shares_group_with(other uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.group_members a
    join public.group_members b on b.group_id = a.group_id
    where a.user_id = (select auth.uid()) and b.user_id = other
  );
$$;

revoke all on function
  private.is_group_member(uuid), private.can_read_entry(uuid), private.shares_group_with(uuid)
  from public;
grant execute on function
  private.is_group_member(uuid), private.can_read_entry(uuid), private.shares_group_with(uuid)
  to authenticated;

-- ── 읽기 정책 ──────────────────────────────────────────
create policy profiles_read on public.profiles for select to authenticated
  using (id = (select auth.uid()) or private.shares_group_with(id));

create policy groups_read on public.groups for select to authenticated
  using (private.is_group_member(id));

create policy group_members_read on public.group_members for select to authenticated
  using (private.is_group_member(group_id));

create policy entries_read on public.entries for select to authenticated
  using (author_id = (select auth.uid()) or private.can_read_entry(id));

create policy entry_shares_read on public.entry_shares for select to authenticated
  using (private.is_group_member(group_id));

-- ── 가입 시 프로필 자동 생성 ────────────────────────────
create function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
                  split_part(new.email, '@', 1)), 20)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ── 쓰기 RPC (브라우저에서 supabase.rpc로 호출) ─────────
create function public.create_group(p_name text)
returns public.groups language plpgsql security definer set search_path = '' as $$
declare
  g public.groups;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  -- ponytail: 6자리 16진수 코드라 충돌하면 unique 오류가 난다. 사용자가 다시 시도하면 된다. 그룹 수가 많아지면 재시도 루프 추가
  insert into public.groups (name, invite_code, created_by)
  values (trim(p_name), upper(substr(md5(gen_random_uuid()::text), 1, 6)), auth.uid())
  returning * into g;
  insert into public.group_members (group_id, user_id) values (g.id, auth.uid());
  return g;
end;
$$;

create function public.join_group(p_code text)
returns public.groups language plpgsql security definer set search_path = '' as $$
declare
  g public.groups;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into g from public.groups where invite_code = upper(trim(p_code));
  if not found then raise exception 'invite code not found' using errcode = 'P0002'; end if;
  insert into public.group_members (group_id, user_id)
  values (g.id, auth.uid()) on conflict do nothing;
  return g;
end;
$$;

create function public.create_entry(p_title text, p_body text, p_group_ids uuid[])
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  new_id uuid;
  gid uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  foreach gid in array coalesce(p_group_ids, '{}') loop
    if not private.is_group_member(gid) then
      raise exception 'not a member of group %', gid using errcode = '42501';
    end if;
  end loop;
  insert into public.entries (author_id, title, body)
  values (auth.uid(), trim(p_title), trim(p_body))
  returning id into new_id;
  insert into public.entry_shares (entry_id, group_id)
  select new_id, x from unnest(coalesce(p_group_ids, '{}')) as x
  on conflict do nothing;
  return new_id;
end;
$$;

revoke all on function
  public.create_group(text), public.join_group(text), public.create_entry(text, text, uuid[])
  from public, anon;
grant execute on function
  public.create_group(text), public.join_group(text), public.create_entry(text, text, uuid[])
  to authenticated;

commit;
