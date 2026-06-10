"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TopBar from "@/components/TopBar";
import {
  createPlant,
  getSession,
  searchSpecies,
  uploadImage,
} from "@/lib/store";
import type { Species } from "@/lib/types";

const MAX_NAME = 20;

function PlantRegisterInner() {
  const router = useRouter();
  const params = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);
  const from = params.get("from") ?? "/home?tab=__all__";

  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Species[]>([]);
  const [selected, setSelected] = useState<Species | null>(null);
  const [searching, setSearching] = useState(false);

  const [nickname, setNickname] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [popup, setPopup] = useState<string | null>(null);
  const speciesListOpen = !selected && query.trim().length > 0;

  useEffect(() => {
    if (!getSession()) router.replace("/login");
  }, [router]);

  // 자동완성 (디바운스)
  useEffect(() => {
    if (selected) return; // 선택 완료 상태면 검색 안 함
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        setResults(await searchSpecies(q));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [query, selected]);

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      setImage(await uploadImage(file));
    } catch {
      setPopup("이미지 업로드에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setUploading(false);
    }
  };

  const pickSpecies = (s: Species) => {
    setSelected(s);
    setQuery(s.name);
    setResults([]);
  };

  const clearSpecies = () => {
    setSelected(null);
    setQuery("");
    setResults([]);
  };

  const canSubmit = !!image && !!selected && !submitting;

  const submit = async () => {
    const user = getSession();
    if (!user || !image || !selected) return;
    setSubmitting(true);
    try {
      const plant = await createPlant({
        userId: user.id,
        speciesId: selected.id,
        nickname: nickname.trim() ? nickname.trim() : null,
        imageUrl: image,
      });
      router.replace(`/upload?plant=${plant.id}&carry=1&from=${encodeURIComponent(from)}`);
    } catch {
      setPopup("등록에 실패했습니다. 다시 시도해주세요.");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col sm:min-h-[calc(100vh-3rem)]">
      <TopBar
        title="내 식물 등록하기"
        onBack={() => router.replace(`/upload?carry=1&from=${encodeURIComponent(from)}`)}
      />

      <div className="relative z-20 min-h-0 flex-1 overflow-y-auto animate-fade-up pb-4">
        {/* 대표 이미지 추가 */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex aspect-square w-full flex-col items-center justify-center bg-field"
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="대표 이미지" className="h-full w-full object-cover" />
          ) : uploading ? (
            <span className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-ink" />
          ) : (
            <>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7H7l1-2h8l1 2h2.5A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-9z" stroke="#141414" strokeWidth="1.6" strokeLinejoin="round" />
                <circle cx="12" cy="12.5" r="3.2" stroke="#141414" strokeWidth="1.6" />
              </svg>
              <span className="mt-2 text-[14px] font-semibold text-ink">대표 이미지 추가</span>
            </>
          )}
        </button>

        <div className="px-5 pt-6">
          {/* 식물 선택하기 (자동완성) */}
          <p className="mb-2 text-[16px] font-bold text-ink">식물 선택하기</p>
          <div className="relative">
            <div className="flex items-center rounded-xl bg-field px-4">
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (selected) setSelected(null);
                }}
                placeholder="키우는 식물을 선택하세요 (예: 몬스테라)"
                className="w-full bg-transparent py-3.5 text-[15px] outline-none placeholder:text-sub"
              />
              {query && (
                <button type="button" onClick={clearSpecies} aria-label="지우기" className="flex-none pl-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M6 6l12 12M18 6L6 18" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>

            {speciesListOpen && (
              <div className="absolute z-40 mt-1 max-h-[48vh] w-full overflow-y-auto rounded-xl border border-line bg-white shadow-card">
                {searching ? (
                  <p className="px-4 py-3 text-[14px] text-sub">검색 중…</p>
                ) : results.length === 0 ? (
                  <p className="px-4 py-3 text-[14px] text-sub">검색 결과가 없습니다</p>
                ) : (
                  results.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => pickSpecies(s)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-field"
                    >
                      <span className="h-7 w-7 flex-none overflow-hidden rounded-full bg-field">
                        {s.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </span>
                      <span className="text-[15px] text-ink">{s.name}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 식물 이름 입력 (별명) */}
          <p className="mb-2 mt-6 text-[16px] font-bold text-ink">
            식물 이름 입력 <span className="text-[12px] font-normal text-sub">*반려식물 별명</span>
          </p>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value.slice(0, MAX_NAME))}
            placeholder="식물의 별명을 입력하세요"
            className="w-full rounded-xl bg-field px-4 py-3.5 text-[15px] outline-none placeholder:text-sub"
          />
          <p className="mt-1 text-right text-[12px] text-sub">{nickname.length}/{MAX_NAME}</p>
        </div>
      </div>

      {/* 등록하기 CTA */}
      <div
        className={`shrink-0 bg-white/90 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-bar backdrop-blur-md sm:rounded-b-[28px] ${
          speciesListOpen ? "hidden" : ""
        }`}
      >
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="w-full rounded-xl py-4 text-[16px] font-bold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed"
          style={{ backgroundColor: canSubmit ? "#141414" : "#c4c7cc" }}
        >
          {submitting ? "등록 중…" : "등록하기"}
        </button>
      </div>

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickImage} />

      {popup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8" onClick={() => setPopup(null)}>
          <div className="w-full max-w-[320px] rounded-2xl bg-white p-5 animate-pop-in" onClick={(e) => e.stopPropagation()}>
            <p className="text-[14px] leading-relaxed text-ink">{popup}</p>
            <button type="button" onClick={() => setPopup(null)} className="mt-4 w-full rounded-xl bg-key py-3 text-[15px] font-bold text-white">
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlantRegisterPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">로딩 중…</div>}>
      <PlantRegisterInner />
    </Suspense>
  );
}
