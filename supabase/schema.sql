-- =========================================================
-- Plory (team-5) 스키마
-- Supabase SQL Editor 에 붙여넣어 1회 실행하세요.
-- 콘텐츠(식물 종 DB + 데모 피드)는 seed_content.sql 참고.
-- =========================================================

-- 확장 (uuid 생성)
create extension if not exists "pgcrypto";

-- ---------- 사용자 ----------
-- MVP 데모용 커스텀 인증 (실제 이메일 발송 없음, 비밀번호 평문 저장)
-- ※ 운영 단계에서는 Supabase Auth + 해시 저장으로 전환 권장
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password text not null,
  nickname text not null,
  created_at timestamptz not null default now()
);

-- ---------- 식물 종 (카테고리/자동완성 대상) ----------
create table if not exists species (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  image_url text,
  created_at timestamptz not null default now()
);

-- ---------- 내 식물 (사용자가 등록한 개체) ----------
create table if not exists plants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  species_id uuid not null references species(id),
  nickname text,                       -- 개체 별명 (≤20자, nullable)
  image_url text,                      -- 대표 이미지
  created_at timestamptz not null default now()
);

-- ---------- 게시글 ----------
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  plant_id uuid not null references plants(id) on delete cascade,
  species_id uuid not null references species(id),
  caption text not null default '',
  reaction_sun int not null default 0,
  reaction_water int not null default 0,
  reaction_sprout int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- 게시글 이미지 (최대 5장) ----------
create table if not exists post_images (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  url text not null,
  order_index int not null default 0
);

-- ---------- 팔로우 (사용자 → 식물 카테고리/종) ----------
create table if not exists follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  species_id uuid not null references species(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, species_id)
);

-- ---------- 인덱스 ----------
create index if not exists idx_plants_user on plants(user_id);
create index if not exists idx_posts_species on posts(species_id);
create index if not exists idx_posts_created on posts(created_at desc);
create index if not exists idx_post_images_post on post_images(post_id);
create index if not exists idx_follows_user on follows(user_id);

-- ---------- RLS (MVP 데모용: anon 전체 허용) ----------
-- ※ 운영 단계에서는 사용자별 정책으로 강화하세요.
alter table users enable row level security;
alter table species enable row level security;
alter table plants enable row level security;
alter table posts enable row level security;
alter table post_images enable row level security;
alter table follows enable row level security;

do $$
declare t text;
begin
  foreach t in array array['users','species','plants','posts','post_images','follows']
  loop
    execute format('drop policy if exists "anon all %1$s" on %1$s;', t);
    execute format('create policy "anon all %1$s" on %1$s for all to anon, authenticated using (true) with check (true);', t);
  end loop;
end $$;

-- ---------- Storage 버킷 (이미지 업로드) ----------
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

drop policy if exists "images public read" on storage.objects;
create policy "images public read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'images');

drop policy if exists "images anon write" on storage.objects;
create policy "images anon write" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'images');
