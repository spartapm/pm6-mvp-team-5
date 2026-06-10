"use client";

import { supabase, STORAGE_BUCKET } from "./supabase";
import type { Plant, Post, Species, User } from "./types";

// =========================================================
// 세션 (MVP 데모용: localStorage)
// =========================================================
const SESSION_KEY = "plory.session";

export function getSession(): User | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function setSession(user: User) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
}

function nicknameFromEmail(email: string): string {
  return email.split("@")[0] ?? email;
}

// =========================================================
// 인증
// =========================================================
export type AuthResult =
  | { ok: true; user: User }
  | { ok: false; reason: "not_found" | "exists" | "error" };

export async function emailExists(email: string): Promise<boolean> {
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  return !!data;
}

export async function signUp(
  email: string,
  password: string
): Promise<AuthResult> {
  if (await emailExists(email)) return { ok: false, reason: "exists" };
  const nickname = nicknameFromEmail(email);
  const { data, error } = await supabase
    .from("users")
    .insert({ email, password, nickname })
    .select("id, email, nickname")
    .single();
  if (error || !data) return { ok: false, reason: "error" };
  const user: User = { id: data.id, email: data.email, nickname: data.nickname };
  setSession(user);
  return { ok: true, user };
}

export async function signIn(
  email: string,
  password: string
): Promise<AuthResult> {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, nickname")
    .eq("email", email)
    .eq("password", password)
    .maybeSingle();
  if (error) return { ok: false, reason: "error" };
  if (!data) return { ok: false, reason: "not_found" };
  const user: User = { id: data.id, email: data.email, nickname: data.nickname };
  setSession(user);
  return { ok: true, user };
}

// =========================================================
// 식물 종 (자동완성)
// =========================================================
type SpeciesRow = { id: string; name: string; image_url: string | null };

const mapSpecies = (r: SpeciesRow): Species => ({
  id: r.id,
  name: r.name,
  imageUrl: r.image_url,
});

// 부분 일치 검색 → 앞글자 일치 우선 정렬
export async function searchSpecies(q: string): Promise<Species[]> {
  const query = q.trim();
  if (!query) return [];
  const { data, error } = await supabase
    .from("species")
    .select("id, name, image_url")
    .ilike("name", `%${query}%`)
    .limit(30);
  if (error || !data) return [];
  const rows = (data as SpeciesRow[]).map(mapSpecies);
  return rows.sort((a, b) => {
    const ap = a.name.startsWith(query) ? 0 : 1;
    const bp = b.name.startsWith(query) ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return a.name.localeCompare(b.name, "ko");
  });
}

// =========================================================
// 내 식물
// =========================================================
type PlantRow = {
  id: string;
  user_id: string;
  species_id: string;
  nickname: string | null;
  image_url: string | null;
  species: { name: string } | null;
};

const mapPlant = (r: PlantRow): Plant => {
  const speciesName = r.species?.name ?? "";
  return {
    id: r.id,
    userId: r.user_id,
    speciesId: r.species_id,
    speciesName,
    nickname: r.nickname,
    imageUrl: r.image_url,
    label: r.nickname && r.nickname.trim() ? r.nickname : speciesName,
  };
};

export async function getMyPlants(userId: string): Promise<Plant[]> {
  const { data, error } = await supabase
    .from("plants")
    .select("id, user_id, species_id, nickname, image_url, species:species_id(name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as PlantRow[]).map(mapPlant);
}

export async function createPlant(input: {
  userId: string;
  speciesId: string;
  nickname: string | null;
  imageUrl: string | null;
}): Promise<Plant> {
  const { data, error } = await supabase
    .from("plants")
    .insert({
      user_id: input.userId,
      species_id: input.speciesId,
      nickname: input.nickname,
      image_url: input.imageUrl,
    })
    .select("id, user_id, species_id, nickname, image_url, species:species_id(name)")
    .single();
  if (error || !data) throw error ?? new Error("create plant failed");
  return mapPlant(data as unknown as PlantRow);
}

// =========================================================
// 게시글
// =========================================================
type PostRow = {
  id: string;
  user_id: string;
  plant_id: string;
  species_id: string;
  caption: string;
  reaction_sun: number;
  reaction_water: number;
  reaction_sprout: number;
  created_at: string;
  users: { nickname: string } | null;
  plants: { nickname: string | null } | null;
  species: { name: string; image_url: string | null } | null;
  post_images: { url: string; order_index: number }[] | null;
};

const POST_SELECT = `
  id, user_id, plant_id, species_id, caption,
  reaction_sun, reaction_water, reaction_sprout, created_at,
  users:user_id ( nickname ),
  plants:plant_id ( nickname ),
  species:species_id ( name, image_url ),
  post_images ( url, order_index )
`;

const mapPost = (r: PostRow): Post => {
  const images = (r.post_images ?? [])
    .slice()
    .sort((a, b) => a.order_index - b.order_index)
    .map((i) => i.url);
  return {
    id: r.id,
    userId: r.user_id,
    authorNickname: r.users?.nickname ?? "user",
    plantId: r.plant_id,
    plantNickname: r.plants?.nickname ?? null,
    speciesId: r.species_id,
    speciesName: r.species?.name ?? "",
    speciesImageUrl: r.species?.image_url ?? null,
    caption: r.caption,
    images,
    thumbnail: images[0] ?? "",
    reactionSun: r.reaction_sun,
    reactionWater: r.reaction_water,
    reactionSprout: r.reaction_sprout,
    createdAt: r.created_at,
  };
};

// 피드: speciesId 없으면 전체, 있으면 해당 카테고리만 (모두 최신순)
export async function getFeed(speciesId?: string | null): Promise<Post[]> {
  let query = supabase.from("posts").select(POST_SELECT);
  if (speciesId) query = query.eq("species_id", speciesId);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  const posts = ((data ?? []) as unknown as PostRow[]).map(mapPost);
  return posts;
}

export async function getPost(id: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapPost(data as unknown as PostRow);
}

export async function createPost(input: {
  userId: string;
  plantId: string;
  speciesId: string;
  caption: string;
  images: string[];
}): Promise<string> {
  const { data, error } = await supabase
    .from("posts")
    .insert({
      user_id: input.userId,
      plant_id: input.plantId,
      species_id: input.speciesId,
      caption: input.caption,
    })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("create post failed");
  const postId = data.id as string;

  if (input.images.length > 0) {
    const rows = input.images.map((url, i) => ({
      post_id: postId,
      url,
      order_index: i,
    }));
    const { error: imgErr } = await supabase.from("post_images").insert(rows);
    if (imgErr) throw imgErr;
  }
  return postId;
}

export async function getMyPostCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw error;
  return count ?? 0;
}

export async function getFollowingCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("follows")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw error;
  return count ?? 0;
}

type PlantLatestPostRow = {
  id: string;
  plant_id: string;
  created_at: string;
};

export async function getPlantLatestPostMap(userId: string): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from("posts")
    .select("id, plant_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const latestMap: Record<string, string> = {};
  for (const row of (data ?? []) as PlantLatestPostRow[]) {
    if (!latestMap[row.plant_id]) latestMap[row.plant_id] = row.id;
  }
  return latestMap;
}

// =========================================================
// 게시글 리액션
// =========================================================
export type ReactionType = "sun" | "water" | "sprout";

async function countReaction(postId: string, type: ReactionType): Promise<number> {
  const { count } = await supabase
    .from("post_reactions")
    .select("id", { count: "exact", head: true })
    .eq("post_id", postId)
    .eq("reaction_type", type);
  return count ?? 0;
}

export async function getPostReactionSummary(
  postId: string,
  userId?: string | null
): Promise<{
  sun: number;
  water: number;
  sprout: number;
  myReactions: ReactionType[];
}> {
  const [sun, water, sprout, mine] = await Promise.all([
    countReaction(postId, "sun"),
    countReaction(postId, "water"),
    countReaction(postId, "sprout"),
    userId
      ? supabase
          .from("post_reactions")
          .select("reaction_type")
          .eq("post_id", postId)
          .eq("user_id", userId)
      : Promise.resolve({ data: [] } as { data: { reaction_type: ReactionType }[] }),
  ]);

  return {
    sun,
    water,
    sprout,
    myReactions: ((mine.data ?? []) as { reaction_type: ReactionType }[]).map(
      (row) => row.reaction_type
    ),
  };
}

// 반응은 종류별로 독립 토글(한 게시글에 여러 반응 동시 가능)
export async function togglePostReaction(
  userId: string,
  postId: string,
  reactionType: ReactionType
): Promise<{
  sun: number;
  water: number;
  sprout: number;
  myReactions: ReactionType[];
}> {
  const { data: exists, error: checkError } = await supabase
    .from("post_reactions")
    .select("id")
    .eq("user_id", userId)
    .eq("post_id", postId)
    .eq("reaction_type", reactionType)
    .maybeSingle();
  if (checkError) throw checkError;

  if (exists?.id) {
    const { error: delError } = await supabase
      .from("post_reactions")
      .delete()
      .eq("id", exists.id);
    if (delError) throw delError;
  } else {
    const { error: insError } = await supabase.from("post_reactions").insert({
      user_id: userId,
      post_id: postId,
      reaction_type: reactionType,
    });
    if (insError) throw insError;
  }

  return getPostReactionSummary(postId, userId);
}

// =========================================================
// 팔로우 (사용자 → 식물 카테고리/종)
// =========================================================
export async function getFollowedSpecies(userId: string): Promise<Species[]> {
  const { data, error } = await supabase
    .from("follows")
    .select("species:species_id ( id, name, image_url )")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as unknown as { species: SpeciesRow | null }[])
    .map((r) => r.species)
    .filter((s): s is SpeciesRow => !!s)
    .map(mapSpecies);
}

export async function isFollowing(
  userId: string,
  speciesId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("follows")
    .select("id")
    .eq("user_id", userId)
    .eq("species_id", speciesId)
    .maybeSingle();
  return !!data;
}

// 팔로우 토글 → 최종 팔로잉 여부 반환
export async function toggleFollow(
  userId: string,
  speciesId: string
): Promise<boolean> {
  if (await isFollowing(userId, speciesId)) {
    await supabase
      .from("follows")
      .delete()
      .eq("user_id", userId)
      .eq("species_id", speciesId);
    return false;
  }
  await supabase.from("follows").insert({ user_id: userId, species_id: speciesId });
  return true;
}

// =========================================================
// 이미지 업로드 (Supabase Storage)
// =========================================================
export async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
