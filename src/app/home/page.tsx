"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PloryLogo from "@/components/PloryLogo";
import BottomNav from "@/components/BottomNav";
import Spinner from "@/components/Spinner";
import {
  getFeed,
  getFollowedSpecies,
  getSession,
} from "@/lib/store";
import { ellipsisName, type Post, type Species } from "@/lib/types";

const ALL = "__all__";

export default function HomePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tabs, setTabs] = useState<Species[]>([]);
  const [active, setActive] = useState<string>(ALL);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (!getSession()) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  const loadTabs = useCallback(async () => {
    const user = getSession();
    if (!user) return;
    try {
      const followed = await getFollowedSpecies(user.id);
      setTabs(followed);
    } catch {
      // 탭 로드 실패는 무시 (모두 탭은 항상 노출)
    }
  }, []);

  const loadFeed = useCallback(async (speciesId: string) => {
    setLoading(true);
    setError(false);
    try {
      const data = await getFeed(speciesId === ALL ? null : speciesId);
      setPosts(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    loadTabs();
  }, [ready, loadTabs]);

  useEffect(() => {
    if (!ready) return;
    loadFeed(active);
  }, [ready, active, loadFeed]);

  if (!ready) return <Spinner />;

  return (
    <div className="flex min-h-screen flex-col pb-20 sm:min-h-[calc(100vh-3rem)]">
      {/* 헤더 */}
      <header className="sticky top-0 z-20 bg-white/90 px-5 pb-3 pt-4 backdrop-blur-md sm:rounded-t-[28px]">
        <PloryLogo className="text-[26px]" />
        {/* 카테고리 탭 */}
        <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
          <Tab
            label="모두"
            active={active === ALL}
            onClick={() => setActive(ALL)}
          />
          {tabs.map((s) => (
            <Tab
              key={s.id}
              label={ellipsisName(s.name)}
              active={active === s.id}
              onClick={() => setActive(s.id)}
            />
          ))}
        </div>
      </header>

      {/* 피드 */}
      <div className="flex-1 px-4 pt-3">
        {loading ? (
          <Spinner />
        ) : error ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
            <p className="text-sub">네트워크 오류, 다시 시도해주세요.</p>
            <button
              type="button"
              onClick={() => loadFeed(active)}
              className="rounded-xl border border-line px-4 py-2 text-[14px] font-semibold"
            >
              다시 시도
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <p className="text-sub">등록된 게시물이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 animate-fade-up">
            {posts.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => router.push(`/post/${p.id}`)}
                className="text-left"
              >
                <span className="mb-1.5 block truncate text-[13px] font-semibold text-ink">
                  {ellipsisName(p.speciesName)}
                </span>
                <span className="block aspect-square w-full overflow-hidden rounded-xl bg-field">
                  {p.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.thumbnail}
                      alt={p.speciesName}
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  ) : null}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav active="home" />
    </div>
  );
}

function Tab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-none whitespace-nowrap rounded-full px-4 py-2 text-[14px] font-semibold transition-colors ${
        active
          ? "bg-key text-white"
          : "border border-line bg-white text-ink hover:bg-field"
      }`}
    >
      {label}
    </button>
  );
}
