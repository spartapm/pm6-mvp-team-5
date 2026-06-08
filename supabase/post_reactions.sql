-- =========================================================
-- Plory (team-5) 게시글 리액션 마이그레이션
-- 기존 schema.sql 적용된 프로젝트에 추가로 1회 실행하세요.
-- =========================================================

create table if not exists post_reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  post_id uuid not null references posts(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('sun','water','sprout')),
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

create index if not exists idx_post_reactions_post on post_reactions(post_id);
create index if not exists idx_post_reactions_user on post_reactions(user_id);

alter table post_reactions enable row level security;

drop policy if exists "anon all post_reactions" on post_reactions;
create policy "anon all post_reactions" on post_reactions
  for all to anon, authenticated using (true) with check (true);
