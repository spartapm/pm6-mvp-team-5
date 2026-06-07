// ---------- 도메인 타입 ----------

export interface User {
  id: string;
  email: string;
  nickname: string; // 이메일 @ 앞부분
}

export interface Species {
  id: string;
  name: string; // 식물 종명 (한글)
  imageUrl: string | null; // 카테고리 대표 이미지
}

export interface Plant {
  id: string;
  userId: string;
  speciesId: string;
  speciesName: string;
  nickname: string | null; // 개체 별명 (≤20자)
  imageUrl: string | null; // 대표 이미지
  // 드롭다운/표시용 라벨: 별명 우선, 없으면 종명
  label: string;
}

export interface Post {
  id: string;
  userId: string;
  authorNickname: string; // @닉네임
  plantId: string;
  plantNickname: string | null; // 식물 별명
  speciesId: string;
  speciesName: string; // 카테고리명
  speciesImageUrl: string | null; // 카테고리 대표 이미지(아바타)
  caption: string;
  images: string[]; // 최대 5장
  thumbnail: string; // 첫 이미지
  reactionSun: number;
  reactionWater: number;
  reactionSprout: number;
  createdAt: string; // ISO
}

// 식물명 말줄임: 8자 초과 시 앞 3 + … + 뒤 2
export function ellipsisName(name: string): string {
  if (name.length <= 8) return name;
  return `${name.slice(0, 3)}…${name.slice(-2)}`;
}

// YYYY.MM.DD
export function formatDate(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}
