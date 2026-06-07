import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plory",
  description: "식물을 기록하고 팔로우하는 식물 SNS, Plory",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body>
        {/* 모바일 전용: 가운데 정렬된 폰 너비 프레임 */}
        <div className="relative mx-auto flex min-h-screen w-full max-w-[420px] flex-col bg-white sm:my-6 sm:min-h-[calc(100vh-3rem)] sm:rounded-[28px] sm:shadow-frame sm:overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
