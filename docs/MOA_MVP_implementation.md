# MOA 공유 다이어리 기반 버전 설계서

HTML · CSS · Vanilla JavaScript (빌드 없음) · Supabase · Netlify

## 0. 프로젝트 운영 방식

이 문서는 **기반 버전**을 정의한다. 기반 버전은 main 에이전트와 운영자가 만들고 배포한다. 그 뒤 팀원(비전공자, git 사용 안 함)이 배포된 사이트를 보면서 기능을 하나씩 추가·수정한다.

1. 운영자가 팀원의 요구사항을 main에게 전달한다.
2. main이 **과제 문서**를 만든다(목표, 수정할 파일, 함수 형태, 힌트, 완료 기준). 코드를 대신 짜 주지 않는다.
3. 운영자가 팀원에게 과제 문서와 `web/` 폴더 압축본을 보낸다.
4. 팀원은 지정된 파일만 고쳐서 그 파일을 회신한다.
5. 운영자가 회신 파일을 main에게 넘긴다. main이 검토하고 저장소에 반영하면 운영자가 push하고, Netlify가 자동으로 배포한다.

이 방식 때문에 아래 설계 원칙을 지킨다.

- **빌드 도구 없음.** 팀원이 Node나 npm을 설치하지 않는다. VS Code에서 Live Server 확장으로 `web/index.html`을 열면 바로 실행된다.
- **과제 하나 = 파일 1~2개.** 화면마다 JS 파일과 CSS 파일을 따로 둔다. 데이터 함수는 `api/`에 모은다.
- **한 파일은 한 번에 한 팀원만 맡는다.** 진행 중인 과제는 `docs/assignments/README.md` 표에 기록하고, 같은 파일을 두 사람에게 동시에 주지 않는다.
- **DB 변경은 main이 SQL을 쓴다.** 팀원 과제는 JS·CSS로 한정한다. DB 변경이 필요한 과제는 main이 `supabase/migrations/NNN_*.sql`을 먼저 만든다. 운영자가 그 SQL을 Supabase SQL Editor에서 실행한 뒤 과제를 배포한다.
- 모든 파일 맨 위에 "이 파일이 하는 일" 주석을 1~3줄 단다.

## 1. 기반 버전 범위

| 구분 | 내용 |
|---|---|
| 계정 | 회원가입(이메일, 비밀번호, 표시 이름), 로그인, 로그아웃. **이메일 인증 없음** |
| 그룹 | 그룹 만들기(초대 코드 자동 발급), 초대 코드로 참여, 내 그룹 목록, 그룹 멤버 보기 |
| 일기 (핵심) | 내 일기 쓰기(제목·본문). 쓸 때 공유할 그룹을 0개 이상 체크 |
| 보기 | 그룹 피드(그 그룹에 공유된 글, 최신순), 내 일기(내가 쓴 글 전체, 최신순) |
| 배포 | GitHub 저장소 → Netlify 자동 배포 |
| 이후 과제 후보 | 글 수정·삭제, 프로필 이름 변경, 댓글, 사진, 달력 보기, 그룹 나가기 등 (8장) |

공유 모델: 일기는 **작성자 소유**이고, 그룹에는 공유한다(N:M). 한 글을 여러 그룹에 공유할 수 있고, 아무 데도 공유하지 않으면 "나만 보기"다. 나중에 1:N 구조를 N:M으로 바꾸려면 DB를 크게 고쳐야 하고 그런 작업은 팀원 과제로 줄 수 없다. 그래서 처음부터 N:M으로 둔다.

## 2. 화면과 흐름

단일 `index.html`에 해시 라우팅을 쓴다. 로그인하지 않은 상태에서 다른 화면으로 가면 `#/login`으로 보낸다.

| 경로 | 화면 | 내용과 동작 |
|---|---|---|
| `#/login` | 로그인 | 이메일·비밀번호. 성공하면 `#/groups`. 실패하면 오류 문구. 회원가입 링크 |
| `#/signup` | 회원가입 | 표시 이름(1~20자)·이메일·비밀번호(6자 이상). 성공하면 바로 로그인 상태로 `#/groups` |
| `#/groups` | 내 그룹 | 그룹 목록(이름) → 클릭하면 피드. "그룹 만들기"(이름 입력), "코드로 참여"(코드 입력) |
| `#/group/:id` | 그룹 피드 | 그룹 이름, 초대 코드, 멤버 이름들, 공유된 글 카드 목록. 글이 없으면 "아직 공유된 글이 없어요." |
| `#/write` | 글쓰기 | 제목(1~100자), 본문(1~2000자), 공유할 그룹 체크박스. 저장하면 `#/my` |
| `#/my` | 내 일기 | 내가 쓴 글 전체 카드 목록 |

- 공통 상단바: 내 그룹 / 내 일기 / 글쓰기 / 로그아웃.
- 글 카드: 작성자 표시 이름, 작성 시각(기기 현지 시간), 제목, 본문(`white-space: pre-wrap`). 사용자 입력은 항상 `textContent`로 넣고 `innerHTML`은 쓰지 않는다.
- 저장 중에는 버튼을 잠근다. 저장에 실패하면 입력 내용을 유지하고 오류 문구를 보여준다.
- 다른 사람의 새 글은 새로고침하면 보인다(실시간 갱신은 이후 과제).

## 3. 폴더 구조

```text
MOA/                              # 저장소 루트
├── web/                          # Netlify가 공개하는 폴더 (이 안만 배포됨)
│   ├── index.html                # 상단바 + 화면이 그려질 <main id="app">
│   ├── css/
│   │   ├── base.css              # 색·글꼴·버튼·입력창·카드 공통 스타일, 모바일 레이아웃
│   │   └── login.css, signup.css, groups.css, group.css, write.css, my.css
│   └── js/
│       ├── config.js             # SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY (공개해도 되는 값)
│       ├── supabase.js           # createClient 한 번만
│       ├── main.js               # 라우터, 로그인 확인, 상단바
│       ├── ui.js                 # 공통 도우미: el(), formatDate(), showError(), entryCard()
│       ├── api/
│       │   ├── auth.js           # 세션·가입·로그인·로그아웃·내 프로필
│       │   ├── groups.js         # 그룹 목록·만들기·참여·상세
│       │   └── entries.js        # 그룹 피드·내 일기·글 저장
│       └── pages/
│           ├── login.js, signup.js, groups.js, group.js, write.js, my.js
├── supabase/
│   └── migrations/
│       └── 001_init.sql          # 4장 SQL
├── docs/
│   ├── MOA_MVP_implementation.md
│   └── assignments/              # 과제 문서와 진행 표(README.md)
├── netlify.toml
└── .gitignore
```

`web/` 폴더를 따로 두는 이유: Netlify는 공개 폴더 안의 모든 파일을 누구나 받을 수 있게 올린다. 루트를 공개하면 `docs/`, `scripts/`, `supabase/`까지 노출된다.

### 모듈 규칙

- 모든 import는 상대경로와 `.js` 확장자를 쓴다. Supabase SDK는 `supabase.js`에서만 CDN으로 불러온다.
  ```js
  import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.1/+esm';
  ```
  (구현할 때 jsDelivr에서 실제로 있는 2.x 최신 버전을 확인하고 정확한 번호로 고정한다.)
- **api 함수는 성공하면 데이터를 반환하고, 실패하면 `throw`한다.** 페이지에서는 `try/catch` 하나로만 처리하면 되게 한다.
- **페이지 모듈은 `export async function render(container, params)` 하나만 내보낸다.** `main.js`가 경로에 맞는 페이지의 `render`를 부른다. 페이지끼리는 서로 import하지 않는다.

### api 함수 목록 (화면과 데이터 작업의 계약)

| 파일 | 함수 | 반환 / 동작 |
|---|---|---|
| `api/auth.js` | `getSession()` | 세션 또는 `null` |
| | `signUp({ email, password, displayName })` | `auth.signUp`, `options.data.display_name`으로 이름 전달 |
| | `signIn({ email, password })` | `auth.signInWithPassword` |
| | `signOut()` | `auth.signOut` |
| | `getMyProfile()` | `{ id, display_name }` |
| `api/groups.js` | `listMyGroups()` | `[{ id, name, invite_code }]` (RLS가 내 그룹만 돌려줌), 만든 순 |
| | `createGroup(name)` | `rpc('create_group')` → 그룹 행 |
| | `joinGroup(code)` | `rpc('join_group')` → 그룹 행. 코드가 틀리면 "초대 코드를 찾을 수 없어요." |
| | `getGroup(id)` | `{ id, name, invite_code, members: [{ display_name }] }` |
| `api/entries.js` | `listGroupEntries(groupId)` | `[{ id, title, body, created_at, author: { display_name } }]` 최신순 |
| | `listMyEntries()` | 같은 형태, 내 글만 |
| | `createEntry({ title, body, groupIds })` | `rpc('create_entry')` → 새 글 id |

그룹 피드 조회 예:

```js
const { data, error } = await supabase
  .from('entries')
  .select('id, title, body, created_at, author:profiles(display_name), entry_shares!inner(group_id)')
  .eq('entry_shares.group_id', groupId)
  .order('created_at', { ascending: false })
  .order('id', { ascending: false });
if (error) throw error;
```

## 4. Supabase

### 대시보드 설정

1. 새 프로젝트를 만든다.
2. **Authentication → Sign In / Providers → Email**에서 **Confirm email을 끈다.** 그러면 가입하자마자 세션이 생긴다.
3. **Project Settings → API Keys**에서 Project URL과 publishable key를 `web/js/config.js`에 넣는다. secret key와 `service_role` 키는 절대 넣지 않는다.
4. SQL Editor에서 `supabase/migrations/001_init.sql`을 실행한다.

### 테이블

| 테이블 | 컬럼 | 비고 |
|---|---|---|
| `profiles` | `id`(= auth 사용자 id), `display_name` | 가입할 때 트리거가 자동 생성 |
| `groups` | `id`, `name`, `invite_code`(unique), `created_by`, `created_at` | |
| `group_members` | `group_id`, `user_id`, `joined_at` | 복합 PK |
| `entries` | `id`, `author_id`, `title`, `body`, `created_at` | 작성자 소유 |
| `entry_shares` | `entry_id`, `group_id` | 복합 PK, 글↔그룹 N:M |

### 권한 설계

- 테이블에 대한 브라우저 권한은 **select만** 준다. 쓰기는 모두 `security definer` RPC 3개(`create_group`, `join_group`, `create_entry`)로만 한다. 이렇게 하는 이유는 두 가지다.
  - 글과 공유 대상을 한 트랜잭션에서 저장해야 한다. 그렇지 않으면 공유 정보 없이 글만 남을 수 있다.
  - 아직 멤버가 아닌 사람은 그룹을 조회할 수 없으므로, 초대 코드 확인은 서버 함수가 해야 한다.
- 읽기 규칙
  - `groups`, `group_members`: 그 그룹의 멤버만 읽는다.
  - `entries`: 내가 쓴 글이거나, 내가 속한 그룹에 공유된 글만 읽는다.
  - `entry_shares`: 그 그룹의 멤버만 읽는다.
  - `profiles`: 나 자신, 그리고 나와 같은 그룹에 있는 사람만 읽는다.
- 소속 검사는 `private` 스키마의 `security definer` 함수로 한다. 정책이 다른 테이블을 조회하고, 그 테이블의 정책이 다시 처음 테이블을 조회하는 RLS 무한 재귀를 피하기 위해서다. `private` 스키마는 Data API에 노출하지 않는다.

### `supabase/migrations/001_init.sql`

```sql
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
```

알려진 한계: 초대 코드는 16진수 6자리(약 1,600만 가지)이고 시도 횟수 제한이 없다. 팀 프로젝트 규모에서는 괜찮다. 공개 서비스로 키울 때 코드 길이를 늘리거나 시도 횟수를 제한한다.

## 5. Netlify 배포

`netlify.toml` (빌드 명령 없음):

```toml
[build]
  publish = "web"
```

1. 운영자가 GitHub에 저장소를 만들고 push한다.
2. Netlify에서 **Add new project → Import from Git**으로 저장소를 연결한다. 빌드 명령은 비우고, 공개 폴더는 `web`으로 둔다(toml이 있으면 자동으로 잡힌다).
3. 이후 `main` 브랜치에 push할 때마다 자동으로 배포된다. 환경변수는 쓰지 않는다. `config.js`의 값은 원래 공개되는 값이다.
4. 배포 주소에서 7장의 완료 기준을 확인한다.

팀원 로컬 실행: `web/` 압축본을 풀고 → VS Code로 `web` 폴더를 연다 → Live Server 확장 설치 → `index.html`에서 **Go Live**. 로컬에서도 같은 Supabase를 쓰므로 테스트 글은 "테스트" 그룹에만 공유하도록 안내한다.

## 6. 구현 순서와 분담

| 순서 | 담당 | 작업 | 확인 |
|---|---|---|---|
| 1 | 운영자 | Supabase 프로젝트 생성, Confirm email 끄기, URL·키 전달 | 대시보드 |
| 2 | code1 | `supabase/migrations/001_init.sql`, `web/js/config.js`, `supabase.js`, `api/*.js`, `netlify.toml` | 운영자가 SQL 실행 후 7장의 권한 시나리오를 브라우저 콘솔로 확인 |
| 2 | code2 | `web/index.html`, `css/*`, `js/main.js`, `ui.js`, `pages/*.js` | 3장의 api 함수 목록을 계약으로 삼아 병렬 작업. 연결 전에는 가짜 데이터로 화면 확인 |
| 3 | main | 두 결과 통합 리뷰, 로컬 Live Server로 전체 흐름 확인 | 7장 체크리스트 |
| 4 | 운영자 | GitHub push, Netlify 연결 | 배포 주소에서 7장 체크리스트 |
| 5 | main | `docs/assignments/README.md`(진행 표)와 과제 템플릿 작성 | |

## 7. 기반 버전 완료 기준

- [ ] 새 이메일로 가입하면 메일 확인 없이 바로 로그인되고, 입력한 표시 이름이 보인다.
- [ ] 로그아웃 후 다시 로그인할 수 있다. 새로고침해도 로그인 상태가 유지된다.
- [ ] A가 그룹을 만들면 초대 코드가 보인다. B가 그 코드로 참여하면 두 사람 모두 멤버 목록에 서로가 보인다.
- [ ] 틀린 코드로 참여하면 "초대 코드를 찾을 수 없어요."가 보인다.
- [ ] A가 그룹에 공유한 글을 B가 다른 기기에서 그룹 피드로 읽는다(작성자·시각·제목·본문).
- [ ] 아무 그룹에도 공유하지 않은 글은 A의 "내 일기"에만 보이고 B에게는 보이지 않는다.
- [ ] 그룹에 속하지 않은 C는 그 그룹의 글·멤버·그룹 정보를 Data API로 읽을 수 없다(브라우저 콘솔에서 확인).
- [ ] 로그아웃 상태(anon)에서는 어떤 테이블도 읽을 수 없다.
- [ ] C가 `create_entry`를 A의 그룹 id로 호출하면 거부된다.
- [ ] 공백만 있는 제목·본문은 저장되지 않는다(화면과 DB 둘 다).
- [ ] 휴대폰 너비(360px)에서 가로 스크롤 없이 모든 화면을 쓸 수 있다.
- [ ] 배포 사이트에서 `/docs/...` 같은 저장소 파일에 접근할 수 없다.

## 8. 팀원 과제 운영

### 과제 문서 템플릿 (`docs/assignments/NN-이름.md` → PDF로 변환해 전달)

1. **목표** — 사용자 입장에서 한두 문장
2. **완성 모습** — 화면 스케치나 스크린샷
3. **받는 파일 / 고칠 파일** — 고칠 파일은 1~2개. 나머지 파일은 고치지 않는다
4. **이미 준비된 것** — 쓸 수 있는 api 함수와 ui 도우미, 그 사용 예
5. **단계별 할 일** — 3~6단계. 각 단계에 개념 키워드와 MDN 링크
6. **힌트** — 막히기 쉬운 지점. 정답 코드는 주지 않는다
7. **완료 기준** — 직접 눌러서 확인할 체크리스트
8. **제출** — 고친 파일만 회신. 파일 이름은 바꾸지 않는다

### 첫 과제 후보 (쉬운 순)

| # | 과제 | 고칠 파일 | DB 변경 |
|---|---|---|---|
| 1 | 글 카드·빈 화면 꾸미기 | `css/group.css` 또는 `css/my.css` | 없음 |
| 2 | 글쓰기 글자 수 표시 (예: 120/2000) | `pages/write.js` | 없음 |
| 3 | 초대 코드 복사 버튼 | `pages/group.js` | 없음 |
| 4 | 내 일기 날짜별 묶어 보기 | `pages/my.js` | 없음 |
| 5 | 내 글 삭제 | `api/entries.js`, `pages/my.js` | main이 삭제 정책 SQL을 먼저 준비 |
| 6 | 표시 이름 변경 | `api/auth.js`, 새 페이지 1개 | main이 수정 권한 SQL을 먼저 준비 |

### 반영 규칙

- 회신 파일은 main이 원본과 비교해, 과제 범위 밖 변경이나 보안 문제(`innerHTML`로 사용자 입력 넣기, 키 노출 등)를 확인한 뒤 반영한다.
- 고칠 점이 있으면 코드를 대신 고치지 않고 피드백을 문장으로 정리해 돌려보낸다.

## 공식 문서

- [Supabase signUp](https://supabase.com/docs/reference/javascript/auth-signup) · [signInWithPassword](https://supabase.com/docs/reference/javascript/auth-signinwithpassword)
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) · [Database Functions](https://supabase.com/docs/guides/database/functions) · [API 키](https://supabase.com/docs/guides/getting-started/api-keys)
- [Netlify 파일 기반 설정](https://docs.netlify.com/build/configure-builds/file-based-configuration/)
- [VS Code Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
