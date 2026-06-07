import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // 키 컬러 (Plory = 블랙 기반)
        key: "#141414",
        keySoft: "#2b2b2b",
        ink: "#141414",
        sub: "#6b7280",
        line: "#e5e7eb",
        field: "#f1f2f4", // 입력 필드 배경
        disabled: "#c4c7cc", // 비활성 버튼 회색 배경
        // 리액션 칩
        sun: "#fef3c7",
        water: "#dbeafe",
        sprout: "#dcfce7",
      },
      fontFamily: {
        sans: [
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        frame: "0 1px 3px rgba(16,24,40,0.06), 0 12px 40px rgba(16,24,40,0.08)",
        card: "0 1px 2px rgba(16,24,40,0.05), 0 2px 8px rgba(16,24,40,0.06)",
        bar: "0 -1px 0 rgba(16,24,40,0.06), 0 -8px 24px rgba(16,24,40,0.06)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.3s ease-out both",
        "pop-in": "pop-in 0.2s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
