"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Tab = "home" | "upload" | "garden";

// 하단 네비게이션: 홈 / (+) 업로드 / My가든(leaf)
export default function BottomNav({ active }: { active?: Tab }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current: Tab =
    active ?? (pathname?.startsWith("/upload") ? "upload" : "home");
  const query = searchParams?.toString();
  const currentUrl = `${pathname ?? "/home"}${query ? `?${query}` : ""}`;
  const activeTab = searchParams?.get("tab") ?? "__all__";

  const goHomeWithRefresh = () => {
    router.push(
      `/home?tab=${encodeURIComponent(activeTab)}&refresh=${Date.now()}`
    );
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 left-1/2 z-30 flex h-16 w-full max-w-[420px] -translate-x-1/2 items-center justify-around bg-key px-6 sm:rounded-b-[28px]">
      {/* 홈 */}
      <button
        type="button"
        onClick={goHomeWithRefresh}
        aria-label="홈"
        className="flex h-12 w-12 items-center justify-center transition-transform active:scale-90"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 11l9-7 9 7M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={current === "home" ? 1 : 0.55}
          />
        </svg>
      </button>

      {/* 업로드 (+) */}
      <button
        type="button"
        onClick={() => router.push(`/upload?from=${encodeURIComponent(currentUrl)}`)}
        aria-label="새 게시물"
        className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/80 transition-transform active:scale-90"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </button>

      {/* My 가든 (leaf) — 현재 범위 외 */}
      <button
        type="button"
        aria-label="My 가든"
        className="flex h-12 w-12 items-center justify-center transition-transform active:scale-90"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 19c0-7 5-12 14-13-1 9-6 14-13 14-1 0-1 0-1-1z"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.55"
          />
        </svg>
      </button>
    </nav>
  );
}
