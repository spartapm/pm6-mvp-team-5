// Plory 워드마크 (블랙, 볼드)
export default function PloryLogo({
  className = "text-[26px]",
}: {
  className?: string;
}) {
  return (
    <span
      className={`font-extrabold tracking-tight text-ink ${className}`}
      style={{ fontFamily: "Pretendard, sans-serif" }}
    >
      Plory
    </span>
  );
}
