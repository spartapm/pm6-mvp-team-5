"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PloryLogo from "@/components/PloryLogo";
import { getSession, signIn } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getSession()) router.replace("/home");
  }, [router]);

  const handleLogin = async () => {
    if (loading) return;
    setError("");
    if (!email || !password) {
      setError("아이디 또는 비밀번호를 확인해주세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await signIn(email.trim(), password);
      if (res.ok) router.replace("/home");
      else setError("아이디 또는 비밀번호를 확인해주세요.");
    } catch {
      setError("네트워크 오류, 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center px-7 pb-16 animate-fade-up sm:min-h-[calc(100vh-3rem)]">
      <div className="mb-12 flex justify-center">
        <PloryLogo className="text-[44px]" />
      </div>

      <label className="mb-2 block text-[15px] font-bold text-ink">아이디</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="아이디는 이메일입니다."
        className="mb-5 w-full rounded-xl bg-field px-4 py-3.5 text-[15px] outline-none placeholder:text-sub focus:ring-2 focus:ring-ink/15"
      />

      <label className="mb-2 block text-[15px] font-bold text-ink">비밀번호</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        placeholder="6-12자를 입력하세요."
        className="w-full rounded-xl bg-field px-4 py-3.5 text-[15px] outline-none placeholder:text-sub focus:ring-2 focus:ring-ink/15"
      />

      {error && <p className="mt-2 text-[13px] text-red-500">{error}</p>}

      <button
        type="button"
        onClick={handleLogin}
        disabled={loading}
        className="mt-7 w-full rounded-xl bg-key py-4 text-[16px] font-bold text-white transition-all hover:bg-keySoft active:scale-[0.98] disabled:opacity-60"
      >
        {loading ? "로그인 중…" : "로그인"}
      </button>
      <button
        type="button"
        onClick={() => router.push("/signup")}
        className="mt-3 w-full rounded-xl border border-ink py-4 text-[16px] font-bold text-ink transition-all hover:bg-field active:scale-[0.98]"
      >
        회원가입
      </button>
    </div>
  );
}
