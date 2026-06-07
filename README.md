# Plory (pm6-mvp-team-5)

식물 사진을 기록하고, 식물(카테고리)을 **팔로우**해서 피드로 모아보는 식물 SNS MVP.

## 기술 스택

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS (Pretendard)
- Supabase (Postgres + Storage)

## 화면 (기능 명세서 기준)

| 코드 | 화면 | 경로 |
| --- | --- | --- |
| LG-01 | 로그인 | `/login` |
| LG-02 | 회원가입 | `/signup` |
| HM-01 | 홈 피드 (카테고리 탭 + 그리드) | `/home` |
| PG-01 | 게시글 상세 (이미지 캐러셀 + 팔로우) | `/post/[id]` |
| UP-01 | 새 게시물 업로드 | `/upload` |
| UP-02 | 내 식물 등록 (자동완성) | `/upload/plant` |

## 셋업

1. 의존성 설치

```bash
npm install
```

2. Supabase 환경변수 — `.env.local`

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable 또는 anon key>
```

3. Supabase SQL Editor 에서 순서대로 실행
   - `supabase/schema.sql` (테이블 + RLS + Storage 버킷 `images`)
   - `supabase/seed_content.sql` (식물 종 25종 + 데모 피드 8건)

4. 개발 서버

```bash
npm run dev   # http://localhost:3200
```

## 데모 로그인

- 아이디: `sydney_sad@plory.app`
- 비밀번호: `Plory123`

## MVP 구현 메모

- **인증**: 데모용 커스텀 인증(평문 비밀번호 + localStorage 세션). `인증번호 전송`은 실제 이메일 발송 대신 화면에 6자리 코드를 안내. 운영 시 Supabase Auth 전환 권장.
- **이미지**: 웹 환경이라 네이티브 갤러리 대신 파일 선택 → Supabase Storage 업로드 → public URL 저장.
- **팔로우 대상**: 식물 종(카테고리). 홈 카테고리 탭 = 팔로우한 종 목록.
- **리액션(🌞/💧/🌱)**: 명세상 1차 구현 제외 → 카운트 표시만(비활성).
- **닉네임**: 이메일 `@` 앞부분.
- RLS는 데모용 anon 전체 허용. 운영 시 사용자별 정책으로 강화 필요.

## Vercel 배포

Environment Variables 에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 등록 후 재배포.
