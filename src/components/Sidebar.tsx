import { Check, X } from "lucide-react"
import { STEP_LABELS } from "@/data/steps"
import { Wordmark } from "./Wordmark"

export function Sidebar({
  step,
  onStepClick,
  dday,
  mobileOpen,
  onMobileClose,
}: {
  step: number
  onStepClick: (s: number) => void
  dday: number | null
  mobileOpen: boolean
  onMobileClose: () => void
}) {
  return (
    <>
      {/* Mobile-only backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-navy/40 z-40"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`w-56 min-w-56 bg-white border-l-[0.5px] border-navy/10 flex flex-col pt-7 px-5 pb-6 fixed md:sticky top-0 right-0 md:right-auto h-screen z-50 transition-transform duration-200 ease-in-out ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        } md:translate-x-0`}
      >
        <div className="mb-7 flex items-center justify-between">
          <Wordmark size="sm" />
          <button
            onClick={onMobileClose}
            className="md:hidden bg-transparent border-none cursor-pointer text-navy/45 p-1"
            aria-label="메뉴 닫기"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1">
          {STEP_LABELS.map((s, i) => {
            const done = i < step
            const active = i === step
            const pending = i > step
            return (
              <button
                key={i}
                onClick={() => {
                  if (i <= step) {
                    onStepClick(i)
                    onMobileClose()
                  }
                }}
                className={`flex items-start gap-2.5 w-full text-left bg-transparent border-none py-2.25 px-0 rounded-md mb-0.5 ${
                  i <= step ? "cursor-pointer" : "cursor-default"
                } ${pending ? "opacity-[0.45]" : "opacity-100"}`}
              >
                {/* Step badge */}
                <div className="shrink-0 mt-px">
                  {done ? (
                    <div className="w-5 h-5 rounded-full bg-blue flex items-center justify-center">
                      <Check size={12} color="white" strokeWidth={2.5} />
                    </div>
                  ) : active ? (
                    <div className="w-5 h-5 rounded-full bg-blue flex items-center justify-center">
                      <span className="text-white text-[10px] font-semibold">
                        {i}
                      </span>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-navy/20 flex items-center justify-center">
                      <span className="text-navy/40 text-[10px] font-medium">
                        {i}
                      </span>
                    </div>
                  )}
                </div>

                {/* Labels */}
                <div>
                  <div
                    className={`text-[12.5px] leading-[1.3] ${
                      active
                        ? "font-semibold text-blue"
                        : done
                          ? "font-medium text-navy"
                          : "font-normal text-navy/50"
                    }`}
                  >
                    {s.label}
                  </div>
                  <div className="text-[10.5px] text-navy/38 mt-px">
                    {s.sub}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* D-day badge */}
        {dday !== null && (
          <div
            className={`mb-3 rounded-lg py-3 px-3.5 border-[0.5px] ${
              dday <= 0
                ? "bg-warm/8 border-warm/35"
                : dday <= 14
                  ? "bg-warm/6 border-warm/25"
                  : "bg-blue/6 border-blue/20"
            }`}
          >
            <div
              className={`text-[10px] font-semibold mb-0.75 ${
                dday <= 14 ? "text-warm" : "text-blue"
              }`}
            >
              이의제기 기한
            </div>
            <div
              className={`font-serif-kr text-[18px] font-bold tracking-[-0.01em] ${
                dday <= 14 ? "text-warm" : "text-navy"
              }`}
            >
              {dday <= 0 ? "기한 도과" : `D-${dday}`}
            </div>
            <div className="text-[10px] text-navy/45 mt-0.5">
              {dday <= 0
                ? "채권소멸 가능성 — 금감원 상담 필요"
                : dday <= 14
                  ? "임박 — 서류 준비를 서둘러 주세요"
                  : "여유가 있습니다"}
            </div>
          </div>
        )}

        {/* Disclaimer card */}
        <div className="bg-navy/4 rounded-lg py-3.5 px-3.5 border-[0.5px] border-navy/12">
          <div className="text-[10px] text-navy font-semibold mb-1.5 tracking-[0.02em]">
            서비스의 한계
          </div>
          <div className="text-[10px] text-navy/52 leading-[1.75]">
            AI가 초안을 제안하고, 최종 판단은 은행이 합니다. 풀림은 법률
            대리인이 아니며 결과를 보장하지 않습니다.
          </div>
          <div className="mt-2 pt-2 border-t-[0.5px] border-navy/10 text-[10px] text-navy/52 leading-[1.75]">
            업로드한 자료는 소명서 작성에만 사용되며 작성 완료 후 삭제됩니다.
          </div>
        </div>
      </aside>
    </>
  )
}
