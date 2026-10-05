import { COLORS } from "@/styles/colors"

const SIZE_CLASSES = {
  sm: { mark: "w-4.5 h-4.5", kr: "text-[18px]", en: "text-[9px]" },
  md: { mark: "w-6 h-6", kr: "text-[22px]", en: "text-[10px]" },
  lg: { mark: "w-9 h-9", kr: "text-[32px]", en: "text-[13px]" },
}

export function Wordmark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const s = SIZE_CLASSES[size]
  return (
    <div className="flex items-center gap-2">
      <svg className={s.mark} viewBox="0 0 64 64" fill="none">
        {/* 열린 자물쇠 — 묶인 계좌가 "풀림" (public/favicon.svg와 동일) */}
        <rect width="64" height="64" rx="16" fill={COLORS.blue} />
        <path
          d="M23 31 V21 a9 9 0 0 1 18 0 V23"
          stroke="#ffffff"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <rect x="16" y="29" width="32" height="23" rx="7" fill="#ffffff" />
        <circle cx="32" cy="38.5" r="3.4" fill={COLORS.blue} />
        <rect x="30.6" y="39" width="2.8" height="7" rx="1.4" fill={COLORS.blue} />
      </svg>
      <div>
        <div
          className={`font-serif-kr font-semibold text-navy leading-none tracking-[-0.01em] ${s.kr}`}
        >
          풀림
        </div>
        <div
          className={`font-sans-kr text-blue tracking-[0.12em] font-medium mt-px ${s.en}`}
        >
          PULL-LIM
        </div>
      </div>
    </div>
  )
}
