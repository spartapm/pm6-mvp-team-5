"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import Spinner from "@/components/Spinner";
import {
  getPost,
  getSession,
  isFollowing,
  toggleFollow,
} from "@/lib/store";
import { formatDate, type Post } from "@/lib/types";

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const [following, setFollowing] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    try {
      const p = await getPost(id);
      setPost(p);
      const user = getSession();
      if (p && user) setFollowing(await isFollowing(user.id, p.speciesId));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const onFollow = async () => {
    const user = getSession();
    if (!user || !post) {
      router.push("/login");
      return;
    }
    const next = await toggleFollow(user.id, post.speciesId);
    setFollowing(next);
  };

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setImgIndex(i);
  };

  if (loading) return <Spinner />;
  if (error || !post)
    return (
      <div className="flex min-h-screen flex-col">
        <TopBar logo />
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <p className="text-sub">
            {error ? "네트워크 오류, 다시 시도해주세요." : "게시글을 찾을 수 없습니다."}
          </p>
          <button
            type="button"
            onClick={load}
            className="rounded-xl border border-line px-4 py-2 text-[14px] font-semibold"
          >
            다시 시도
          </button>
        </div>
      </div>
    );

  return (
    <div className="flex min-h-screen flex-col pb-20 sm:min-h-[calc(100vh-3rem)]">
      <TopBar logo />

      <div className="flex-1 animate-fade-up">
        {/* 식물 카테고리 헤더 */}
        <div className="flex items-center gap-3 px-5 py-3">
          <span className="h-11 w-11 flex-none overflow-hidden rounded-full bg-field">
            {post.speciesImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.speciesImageUrl}
                alt={post.speciesName}
                className="h-full w-full object-cover"
              />
            ) : null}
          </span>
          <span className="flex-1 truncate text-[16px] font-bold text-ink">
            {post.speciesName}
          </span>
          <button
            type="button"
            onClick={onFollow}
            className={`flex-none rounded-full px-4 py-1.5 text-[14px] font-semibold transition-all active:scale-95 ${
              following
                ? "bg-key text-white"
                : "border border-ink text-ink hover:bg-field"
            }`}
          >
            {following ? "팔로잉" : "팔로우"}
          </button>
        </div>

        {/* 이미지 캐러셀 */}
        <div className="relative">
          <div
            ref={trackRef}
            onScroll={onScroll}
            className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
          >
            {post.images.map((url, i) => (
              <div key={i} className="aspect-square w-full flex-none snap-center bg-field">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
          {post.images.length > 1 && (
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
              {post.images.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === imgIndex ? "w-4 bg-white" : "w-1.5 bg-white/60"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* 리액션 (1차 표시용) */}
        <div className="flex gap-2.5 px-5 py-4">
          <Reaction bg="bg-sun" emoji="🌞" count={post.reactionSun} />
          <Reaction bg="bg-water" emoji="💧" count={post.reactionWater} />
          <Reaction bg="bg-sprout" emoji="🌱" count={post.reactionSprout} />
        </div>

        {/* 작성글 */}
        <div className="px-5">
          <p className="text-[15px]">
            <span className="font-bold text-ink">@{post.authorNickname}</span>
            {post.plantNickname && (
              <span className="ml-2 font-semibold text-emerald-600">
                {post.plantNickname}
              </span>
            )}
          </p>
          {post.caption && (
            <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink">
              {post.caption}
            </p>
          )}
          <p className="mt-3 text-[12px] text-sub">{formatDate(post.createdAt)}</p>
        </div>
      </div>

      <BottomNav active="home" />
    </div>
  );
}

function Reaction({
  bg,
  emoji,
  count,
}: {
  bg: string;
  emoji: string;
  count: number;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${bg} px-3 py-1.5 text-[14px] font-semibold text-ink`}
    >
      <span>{emoji}</span>
      {count > 0 && <span>{count}</span>}
    </span>
  );
}
