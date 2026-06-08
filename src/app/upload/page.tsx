"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TopBar from "@/components/TopBar";
import Spinner from "@/components/Spinner";
import {
  createPost,
  getMyPlants,
  getSession,
  uploadImage,
} from "@/lib/store";
import type { Plant } from "@/lib/types";

const DRAFT_KEY = "plory.upload.draft";
const MAX_IMAGES = 5;
const MAX_CAPTION = 150;

type Draft = { images: string[]; caption: string; plantId: string | null };

function loadDraft(): Draft {
  if (typeof window === "undefined")
    return { images: [], caption: "", plantId: null };
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (raw) return JSON.parse(raw) as Draft;
  } catch {
    /* noop */
  }
  return { images: [], caption: "", plantId: null };
}

function UploadInner() {
  const router = useRouter();
  const params = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);

  const [ready, setReady] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [plantId, setPlantId] = useState<string | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [popup, setPopup] = useState<string | null>(null);
  const from = params.get("from") ?? "/home?tab=__all__";
  const carry = params.get("carry") === "1";

  // 초기화: 세션 + 드래프트 복원 + (식물 등록 후) 새 식물 선택
  useEffect(() => {
    const user = getSession();
    if (!user) {
      router.replace("/login");
      return;
    }
    const fromRegister = params.get("plant");
    // 기본 진입은 초기화, 식물 등록을 거쳐 복귀할 때만 드래프트 유지
    if (fromRegister || carry) {
      const d = loadDraft();
      setImages(d.images);
      setCaption(d.caption);
      setPlantId(fromRegister ?? d.plantId);
    } else {
      sessionStorage.removeItem(DRAFT_KEY);
      setImages([]);
      setCaption("");
      setPlantId(null);
      setActiveImg(0);
    }
    setReady(true);
  }, [router, params, carry]);

  const refreshPlants = useCallback(async () => {
    const user = getSession();
    if (!user) return;
    try {
      setPlants(await getMyPlants(user.id));
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    if (ready) refreshPlants();
  }, [ready, refreshPlants]);

  // 드래프트 저장 (식물 등록 화면으로 이동 시 유지)
  const persist = useCallback(
    (next: Partial<Draft>) => {
      const d: Draft = {
        images: next.images ?? images,
        caption: next.caption ?? caption,
        plantId: next.plantId !== undefined ? next.plantId : plantId,
      };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    },
    [images, caption, plantId]
  );

  const onPickImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const ok = files.filter((f) => /image\/(jpeg|png|heic|heif|webp)/i.test(f.type));
    if (ok.length < files.length) {
      setPopup(
        "지원하지 않는 형식의 이미지가 포함되어있습니다.\n이미지 지원 포맷: JPG, PNG, HEIC"
      );
    }
    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      setPopup(`사진은 최대 ${MAX_IMAGES}장까지 선택할 수 있습니다.`);
      return;
    }
    if (ok.length > room) {
      setPopup(`사진은 최대 ${MAX_IMAGES}장까지 선택할 수 있습니다.`);
    }
    const slice = ok.slice(0, Math.max(0, room));
    if (slice.length === 0) return;

    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of slice) urls.push(await uploadImage(f));
      const next = [...images, ...urls];
      setImages(next);
      persist({ images: next });
    } catch {
      setPopup("이미지 업로드에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const next = images.filter((_, i) => i !== index);
    setImages(next);
    setActiveImg((cur) => Math.max(0, Math.min(cur, next.length - 1)));
    persist({ images: next });
  };

  const selectedPlant = plants.find((p) => p.id === plantId) ?? null;
  const canSubmit = images.length > 0 && !!plantId && !submitting;

  const submit = async () => {
    const user = getSession();
    if (!user || !selectedPlant || images.length === 0) return;
    setSubmitting(true);
    try {
      const postId = await createPost({
        userId: user.id,
        plantId: selectedPlant.id,
        speciesId: selectedPlant.speciesId,
        caption,
        images,
      });
      sessionStorage.removeItem(DRAFT_KEY);
      router.replace(`/post/${postId}?from=${encodeURIComponent(from)}`);
    } catch {
      setPopup("게시에 실패했습니다. 다시 시도해주세요.");
      setSubmitting(false);
    }
  };

  const goRegisterPlant = () => {
    persist({});
    router.push(`/upload/plant?from=${encodeURIComponent(from)}`);
  };

  if (!ready) return <Spinner />;

  return (
    <div className="flex min-h-screen flex-col pb-24 sm:min-h-[calc(100vh-3rem)]">
      <TopBar
        title="새 게시물"
        onBack={() => {
          sessionStorage.removeItem(DRAFT_KEY);
          router.replace(from);
        }}
      />

      <div className="flex-1 animate-fade-up">
        {/* 이미지 미리보기 */}
        <div className="flex aspect-square w-full items-center justify-center bg-field">
          {images.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={images[Math.min(activeImg, images.length - 1)]}
              alt="미리보기"
              className="h-full w-full object-cover"
            />
          ) : (
            <p className="text-sub">사진을 추가해주세요</p>
          )}
        </div>

        {/* 이미지 스트립 */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
          <button
            type="button"
            onClick={() => {
              if (images.length >= MAX_IMAGES) {
                setPopup(`사진은 최대 ${MAX_IMAGES}장까지 선택할 수 있습니다.`);
                return;
              }
              fileRef.current?.click();
            }}
            className="flex h-16 w-16 flex-none flex-col items-center justify-center rounded-lg bg-field text-sub"
          >
            {uploading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-ink" />
            ) : (
              <>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="5" width="18" height="14" rx="2" stroke="#6b7280" strokeWidth="1.6" />
                  <circle cx="8.5" cy="10" r="1.5" fill="#6b7280" />
                  <path d="M5 17l4.5-4 3 2.5L16 11l3 3" stroke="#6b7280" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="mt-1 text-[11px]">사진 {images.length}/{MAX_IMAGES}</span>
              </>
            )}
          </button>
          {images.map((url, i) => (
            <div
              key={i}
              className={`relative h-16 w-16 flex-none overflow-hidden rounded-lg border-2 ${
                activeImg === i ? "border-ink" : "border-transparent"
              }`}
            >
              <button type="button" onClick={() => setActiveImg(i)} className="h-full w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
              </button>
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white"
                aria-label="사진 제거"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* 내 식물 선택 */}
        <div className="px-4 pt-2">
          <p className="mb-2 text-[15px] font-bold text-ink">내 식물 선택하기</p>
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl bg-field px-4 py-3.5 text-[15px]"
            >
              <span className={selectedPlant ? "text-ink" : "text-sub"}>
                {selectedPlant ? selectedPlant.label : "눌러서 선택"}
              </span>
              <svg
                width="18" height="18" viewBox="0 0 24 24" fill="none"
                className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              >
                <path d="M6 9l6 6 6-6" stroke="#141414" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-line bg-white shadow-card animate-pop-in">
                {plants.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPlantId(p.id);
                      persist({ plantId: p.id });
                      setDropdownOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-field"
                  >
                    <span className="h-7 w-7 flex-none overflow-hidden rounded-full bg-field">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </span>
                    <span className="truncate text-[15px] text-ink">{p.label}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={goRegisterPlant}
                  className="flex w-full items-center gap-2 border-t border-line px-4 py-3 text-left text-ink hover:bg-field"
                >
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-key text-white">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span className="text-[15px] font-semibold">내 식물 추가하기</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 캡션 */}
        <div className="px-4 pt-5">
          <p className="mb-2 text-[15px] font-bold text-ink">캡션 작성하기</p>
          <div className="rounded-xl bg-field px-4 py-3">
            <textarea
              value={caption}
              onChange={(e) => {
                const v = e.target.value.slice(0, MAX_CAPTION);
                setCaption(v);
                persist({ caption: v });
              }}
              placeholder="캡션을 입력해 주세요"
              rows={3}
              className="w-full resize-none bg-transparent text-[15px] outline-none placeholder:text-sub"
            />
            <p className="text-right text-[12px] text-sub">
              {caption.length}/{MAX_CAPTION}
            </p>
          </div>
        </div>
      </div>

      {/* 게시하기 CTA */}
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[420px] bg-white/90 p-4 shadow-bar backdrop-blur-md sm:rounded-b-[28px]">
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="w-full rounded-xl py-4 text-[16px] font-bold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed"
          style={{ backgroundColor: canSubmit ? "#141414" : "#c4c7cc" }}
        >
          {submitting ? "게시 중…" : "게시하기"}
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={onPickImages}
      />

      {popup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8"
          onClick={() => setPopup(null)}
        >
          <div className="w-full max-w-[320px] rounded-2xl bg-white p-5 animate-pop-in" onClick={(e) => e.stopPropagation()}>
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

export default function UploadPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <UploadInner />
    </Suspense>
  );
}
