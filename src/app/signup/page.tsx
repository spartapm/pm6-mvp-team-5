"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import { signUp } from "@/lib/store";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PW_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,12}$/;

type Errors = {
  email?: string;
  code?: string;
  password?: string;
  terms?: string;
};

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sentCode, setSentCode] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState<string | null>(null);

  const allAgree = agreeTerms && agreePrivacy;
  const toggleAll = () => {
    const next = !allAgree;
    setAgreeTerms(next);
    setAgreePrivacy(next);
  };

  const sendCode = () => {
    if (!EMAIL_RE.test(email.trim())) {
      setErrors((e) => ({ ...e, email: "* 이메일 형식이 올바르지 않습니다" }));
      return;
    }
    setErrors((e) => ({ ...e, email: undefined }));
    const generated = String(Math.floor(100000 + Math.random() * 900000));
    setSentCode(generated);
    // 데모: 실제 이메일 발송 대신 인증번호를 화면에 안내
    setPopup(`데모 인증번호: ${generated}\n(실서비스에서는 이메일로 발송됩니다)`);
  };

  const handleSignup = async () => {
    if (loading) return;
    const next: Errors = {};
    if (!EMAIL_RE.test(email.trim()))
      next.email = "* 이메일 형식이 올바르지 않습니다";
    if (!sentCode || code !== sentCode)
      next.code = "* 인증번호를 다시 확인해주세요";
    if (!PW_RE.test(password))
      next.password = "* 숫자, 영문 대/소문자 포함 6-12자로 입력해주세요";
    else if (password !== password2)
      next.password = "* 비밀번호를 다시 확인해주세요";
    if (!allAgree) next.terms = "* 서비스 사용을 위해 약관에 모두 동의해주세요";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    try {
      const res = await signUp(email.trim(), password);
      if (res.ok) {
        router.replace("/home");
      } else if (res.reason === "exists") {
        setErrors({ email: "이미 가입된 계정입니다." });
      } else {
        setErrors({ email: "가입에 실패했습니다. 다시 시도해주세요." });
      }
    } catch {
      setErrors({ email: "네트워크 오류, 다시 시도해주세요." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col pb-24 sm:min-h-[calc(100vh-3rem)]">
      <TopBar logo />

      <div className="flex-1 px-7 pt-4 animate-fade-up">
        {/* 아이디 + 인증번호 전송 */}
        <label className="mb-2 block text-[15px] font-bold text-ink">아이디</label>
        <div className="flex items-end gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일 주소"
            className="flex-1 border-b border-line bg-transparent py-2.5 text-[15px] outline-none placeholder:text-sub focus:border-ink"
          />
          <button
            type="button"
            onClick={sendCode}
            className="mb-1 flex-none rounded-lg bg-key px-3 py-2 text-[13px] font-bold text-white transition-colors hover:bg-keySoft active:scale-95"
          >
            인증번호 전송
          </button>
        </div>
        {errors.email && (
          <p className="mt-1.5 text-[13px] text-red-500">{errors.email}</p>
        )}

        {/* 인증번호 */}
        <label className="mb-2 mt-7 block text-[15px] font-bold text-ink">
          인증번호
        </label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="인증번호 입력"
          className="w-full border-b border-line bg-transparent py-2.5 text-[15px] outline-none placeholder:text-sub focus:border-ink"
        />
        {errors.code && (
          <p className="mt-1.5 text-[13px] text-red-500">{errors.code}</p>
        )}

        {/* 비밀번호 */}
        <label className="mb-2 mt-7 block text-[15px] font-bold text-ink">
          비밀번호
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="숫자, 영어 대/소문자를 포함하여 6-12자 이내"
          className="w-full border-b border-line bg-transparent py-2.5 text-[15px] outline-none placeholder:text-sub focus:border-ink"
        />

        {/* 비밀번호 확인 */}
        <label className="mb-2 mt-7 block text-[15px] font-bold text-ink">
          비밀번호 확인
        </label>
        <input
          type="password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          placeholder="비밀번호 확인"
          className="w-full border-b border-line bg-transparent py-2.5 text-[15px] outline-none placeholder:text-sub focus:border-ink"
        />
        {errors.password && (
          <p className="mt-1.5 text-[13px] text-red-500">{errors.password}</p>
        )}

        {/* 약관 동의 */}
        <div className="mt-9 space-y-3">
          <button
            type="button"
            onClick={toggleAll}
            className="flex items-center gap-2.5 text-[15px] font-bold text-ink"
          >
            <Check on={allAgree} />
            모두 동의합니다.
          </button>
          <div className="ml-1 space-y-2.5">
            <TermRow
              label="이용약관 동의"
              on={agreeTerms}
              onToggle={() => setAgreeTerms((v) => !v)}
              onView={() => setPopup("이용약관\n\n(데모) 이곳에 이용약관 전문이 표시됩니다.")}
            />
            <TermRow
              label="개인정보 취급방침 동의"
              on={agreePrivacy}
              onToggle={() => setAgreePrivacy((v) => !v)}
              onView={() =>
                setPopup("개인정보 취급방침\n\n(데모) 이곳에 개인정보 처리방침 전문이 표시됩니다.")
              }
            />
          </div>
          {errors.terms && (
            <p className="text-[13px] text-red-500">{errors.terms}</p>
          )}
        </div>
      </div>

      {/* 가입하기 CTA */}
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[420px] bg-white/90 p-4 shadow-bar backdrop-blur-md sm:rounded-b-[28px]">
        <button
          type="button"
          onClick={handleSignup}
          disabled={loading}
          className="w-full rounded-xl bg-key py-4 text-[16px] font-bold text-white transition-all hover:bg-keySoft active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? "가입 중…" : "가입하기"}
        </button>
      </div>

      {popup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8"
          onClick={() => setPopup(null)}
        >
          <div
            className="w-full max-w-[320px] rounded-2xl bg-white p-5 animate-pop-in"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="whitespace-pre-line text-[14px] leading-relaxed text-ink">
              {popup}
            </p>
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

function Check({ on }: { on: boolean }) {
  return (
    <span
      className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border ${
        on ? "border-key bg-key text-white" : "border-line bg-white text-transparent"
      }`}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function TermRow({
  label,
  on,
  onToggle,
  onView,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
  onView: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2.5 text-[14px] text-ink"
      >
        <Check on={on} />
        {label}
      </button>
      <button
        type="button"
        onClick={onView}
        className="text-[13px] text-sub underline-offset-2 hover:underline"
      >
        보기 &gt;
      </button>
    </div>
  );
}
