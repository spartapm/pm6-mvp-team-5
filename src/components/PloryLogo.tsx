import Image from "next/image";

export default function PloryLogo({
  className = "",
}: {
  className?: string;
}) {
  return (
    <Image
      src="/plory-logo.png"
      alt="Plory"
      width={114}
      height={38}
      className={`h-[30px] w-auto object-contain ${className}`}
      priority
    />
  );
}
