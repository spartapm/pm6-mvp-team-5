"use client";

import { useRouter } from "next/navigation";
import PloryLogo from "./PloryLogo";

// 상단 바: 뒤로가기(←) + 가운데 타이틀(텍스트 or Plory 로고)
export default function TopBar({
  title,
  logo = false,
  onBack,
}: {
  title?: string;
  logo?: boolean;
  onBack?: () => void;
}) {
  const router = useRouter();
  const back = () => (onBack ? onBack() : router.back());

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center bg-white/90 px-3 backdrop-blur-md sm:rounded-t-[28px]">
      <button
        type="button"
        onClick={back}
        aria-label="뒤로"
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
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2">
        {logo ? (
          <PloryLogo className="text-[22px]" />
        ) : (
          <span className="text-[17px] font-bold text-ink">{title}</span>
        )}
      </div>
    </header>
  );
}
