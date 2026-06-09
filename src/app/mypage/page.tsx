"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import Spinner from "@/components/Spinner";
import { clearSession, getMyPlants, getSession } from "@/lib/store";
import type { User } from "@/lib/types";

export default function MyPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [plantCount, setPlantCount] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const current = getSession();
    if (!current) {
      router.replace("/login");
      return;
    }
    setUser(current);
    setReady(true);
    getMyPlants(current.id)
      .then((plants) => setPlantCount(plants.length))
      .catch(() => setPlantCount(0));
  }, [router]);

  const logout = () => {
    if (loggingOut) return;
    setLoggingOut(true);
    clearSession();
    router.replace("/login");
  };

  if (!ready || !user) return <Spinner />;

  return (
    <div className="flex min-h-screen flex-col pb-20 sm:min-h-[calc(100vh-3rem)]">
      <TopBar title="마이페이지" />

      <main className="flex-1 px-5 pt-4">
        <section className="rounded-2xl border border-line bg-white p-4">
          <p className="text-[13px] text-sub">닉네임</p>
          <p className="mt-1 text-[20px] font-bold text-ink">{user.nickname}</p>
          <p className="mt-4 text-[13px] text-sub">이메일</p>
          <p className="mt-1 text-[15px] text-ink">{user.email}</p>
        </section>

        <section className="mt-3 rounded-2xl border border-line bg-white p-4">
          <p className="text-[13px] text-sub">내 식물</p>
          <p className="mt-1 text-[20px] font-bold text-ink">{plantCount}개</p>
        </section>

        <button
          type="button"
          onClick={logout}
          disabled={loggingOut}
          className="mt-6 w-full rounded-xl bg-key py-4 text-[16px] font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {loggingOut ? "로그아웃 중…" : "로그아웃"}
        </button>
      </main>

      <BottomNav active="garden" />
    </div>
  );
}
