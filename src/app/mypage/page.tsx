"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import Spinner from "@/components/Spinner";
import {
  getFollowingCount,
  getMyPlants,
  getMyPostCount,
  getPlantLatestPostMap,
  getSession,
} from "@/lib/store";
import type { Plant, User } from "@/lib/types";

export default function MyPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [postCount, setPostCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [latestPostByPlant, setLatestPostByPlant] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState<string | null>(null);

  useEffect(() => {
    const current = getSession();
    if (!current) {
      router.replace("/login");
      return;
    }
    setUser(current);
    setReady(true);

    Promise.all([
      getMyPlants(current.id),
      getMyPostCount(current.id),
      getFollowingCount(current.id),
      getPlantLatestPostMap(current.id),
    ])
      .then(([myPlants, myPostCount, myFollowingCount, latestMap]) => {
        setPlants(myPlants);
        setPostCount(myPostCount);
        setFollowingCount(myFollowingCount);
        setLatestPostByPlant(latestMap);
      })
      .catch(() => {
        setPlants([]);
        setPostCount(0);
        setFollowingCount(0);
        setLatestPostByPlant({});
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (!ready || !user || loading) return <Spinner />;

  return (
    <div className="flex min-h-screen flex-col pb-20 sm:min-h-[calc(100vh-3rem)]">
      <header className="sticky top-0 z-20 bg-white px-2 pb-2 pt-3">
        <div className="relative flex h-10 items-center">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="뒤로가기"
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-field active:scale-95"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 5l-7 7 7 7"
                stroke="#141414"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-[17px] font-bold text-ink">
            My 가든
          </h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto animate-fade-up">
        <section className="border-b border-line px-5 pb-4 pt-3">
          <div className="flex items-center gap-4">
            <span className="flex h-20 w-20 flex-none items-center justify-center overflow-hidden rounded-full bg-field">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8a7 7 0 0 1 14 0"
                  stroke="#9ca3af"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[24px] font-bold leading-tight text-ink">@{user.nickname}</p>
              <p className="mt-1 text-[13px] text-sub">한 줄 소개 영역입니다.</p>
            </div>
            <button
              type="button"
              aria-label="프로필 설정"
              onClick={() => setPopup("프로필 설정 화면은 준비 중입니다.")}
              className="flex h-9 w-9 flex-none items-center justify-center rounded-full transition-colors hover:bg-field"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M11.98 3.5a1 1 0 0 1 .94.66l.4 1.2a1 1 0 0 0 .95.69h1.27a1 1 0 0 1 .82.43l.74 1.05a1 1 0 0 0 .88.42l1.28-.06a1 1 0 0 1 .92.55l.57 1.15a1 1 0 0 1-.13 1.07l-.78 1.02a1 1 0 0 0 0 1.21l.78 1.02a1 1 0 0 1 .13 1.07l-.57 1.15a1 1 0 0 1-.92.55l-1.28-.06a1 1 0 0 0-.88.42l-.74 1.05a1 1 0 0 1-.82.43h-1.27a1 1 0 0 0-.95.69l-.4 1.2a1 1 0 0 1-.94.66h-1.21a1 1 0 0 1-.94-.66l-.4-1.2a1 1 0 0 0-.95-.69H8.46a1 1 0 0 1-.82-.43l-.74-1.05a1 1 0 0 0-.88-.42l-1.28.06a1 1 0 0 1-.92-.55l-.57-1.15a1 1 0 0 1 .13-1.07l.78-1.02a1 1 0 0 0 0-1.21l-.78-1.02a1 1 0 0 1-.13-1.07l.57-1.15a1 1 0 0 1 .92-.55l1.28.06a1 1 0 0 0 .88-.42l.74-1.05a1 1 0 0 1 .82-.43h1.27a1 1 0 0 0 .95-.69l.4-1.2a1 1 0 0 1 .94-.66h1.21z"
                  stroke="#141414"
                  strokeWidth="1.4"
                />
                <circle cx="12" cy="12" r="2.7" stroke="#141414" strokeWidth="1.6" />
              </svg>
            </button>
          </div>

          <div className="mt-5 grid grid-cols-3 border-y border-line py-3 text-center">
            <Stat label="내 식물" value={plants.length} />
            <Stat label="게시물" value={postCount} bordered />
            <Stat label="팔로잉" value={followingCount} />
          </div>
        </section>

        <section className="px-5 pb-4 pt-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[18px] font-bold text-ink">내 식물</h2>
            <button
              type="button"
              onClick={() =>
                router.push(`/upload/plant?from=${encodeURIComponent("/mypage")}`)
              }
              className="text-[15px] font-semibold text-ink underline-offset-2 hover:underline"
            >
              내 식물 추가
            </button>
          </div>

          {plants.length === 0 ? (
            <div className="rounded-xl bg-field px-4 py-8 text-center text-[14px] text-sub">
              등록된 식물이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {plants.map((plant) => (
                <button
                  key={plant.id}
                  type="button"
                  onClick={() => {
                    const postId = latestPostByPlant[plant.id];
                    if (!postId) {
                      setPopup("아직 연결된 게시글이 없어요. 게시물을 먼저 작성해주세요.");
                      return;
                    }
                    router.push(
                      `/post/${postId}?from=${encodeURIComponent("/mypage")}`
                    );
                  }}
                  className="flex w-full items-center gap-4 rounded-xl px-1 py-2 text-left transition-colors hover:bg-field"
                >
                  <span className="flex h-16 w-16 flex-none items-center justify-center overflow-hidden rounded-md bg-field">
                    {plant.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={plant.imageUrl}
                        alt={plant.label}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z"
                          stroke="#9ca3af"
                          strokeWidth="1.6"
                        />
                        <circle cx="9" cy="10" r="1.4" fill="#9ca3af" />
                        <path d="M7 16l3.2-3 2.2 2 2.6-2.5L17 16H7z" fill="#9ca3af" />
                      </svg>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] text-sub">
                      {plant.speciesName || "식물 종"}
                    </span>
                    <span className="mt-1 block truncate text-[20px] font-bold leading-tight text-ink">
                      {plant.nickname?.trim() || "식물 별명"}
                    </span>
                  </span>
                  <span className="flex h-6 w-6 items-center justify-center text-sub">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M9 6l6 6-6 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNav active="garden" />

      {popup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8"
          onClick={() => setPopup(null)}
        >
          <div
            className="w-full max-w-[320px] animate-pop-in rounded-2xl bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[14px] leading-relaxed text-ink">{popup}</p>
            <button
              type="button"
              onClick={() => setPopup(null)}
              className="mt-4 w-full rounded-xl bg-key py-3 text-[15px] font-bold text-white"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  bordered = false,
}: {
  label: string;
  value: number;
  bordered?: boolean;
}) {
  return (
    <div className={bordered ? "border-x border-line" : ""}>
      <p className="text-[30px] font-extrabold leading-none text-ink">{value}</p>
      <p className="mt-1 text-[13px] text-ink">{label}</p>
    </div>
  );
}
