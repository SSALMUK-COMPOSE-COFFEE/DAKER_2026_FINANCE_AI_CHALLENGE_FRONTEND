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
      <svg className={s.mark} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="10" r="5" stroke={COLORS.blue} strokeWidth="1.5" />
        <path
          d="M9 10 Q9 15 12 18 Q15 15 15 10"
          stroke={COLORS.blue}
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M15 10 Q18 10 18 13"
          stroke={COLORS.blue}
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="2 2"
        />
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
