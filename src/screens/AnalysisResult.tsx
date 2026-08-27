import { TransactionGraph } from "@/components/TransactionGraph"

const LEGEND = [
  { dotClass: "bg-blue", label: "내 계좌 (분석 대상)" },
  { dotClass: "bg-warm/[50%]", label: "의심 경유 계좌" },
  { dotClass: "bg-navy/[25%]", label: "정상 수신 계좌" },
]

const KEY_NUMBERS = [
  { label: "분석된 거래", val: "143건" },
  { label: "정상 패턴 일치율", val: "94.4%" },
  { label: "의심 자금 접점", val: "2단계 간접" },
]

const EVIDENCE = [
  { label: "지속 거래 관계 확인", detail: "거래 상대방과 2023.04 ~ 현재 37회 반복 거래 내역 확인", verdict: "정상" },
  { label: "세금계산서 대응 입금", detail: "세금계산서 발행 7일 내 입금, 금액 일치율 100%", verdict: "정상" },
  { label: "자금 체류 패턴", detail: "입금 후 평균 22일 체류 후 생활비·임대료로 소비", verdict: "정상" },
  { label: "피의 자금 접점", detail: "경유 계좌 2단계 거리, 직접 거래 아님", verdict: "주의" },
]

export function AnalysisResult({ onNext }: { onNext: () => void }) {
  return (
    <div className="step-section max-w-[860px] mx-auto pt-14 px-12 pb-20">
      <div className="mb-2">
        <span className="text-[11px] text-blue font-semibold tracking-[0.1em]">STEP 3</span>
      </div>
      <div className="flex items-baseline justify-between mb-2">
        <h1 className="font-serif-kr text-[28px] font-bold text-navy tracking-[-0.01em]">
          AI 분석 결과
        </h1>
        <span className="text-[11px] bg-blue/[10%] text-blue border-[0.5px] border-blue/[30%] py-[3px] px-2.5 rounded-full font-semibold">
          정상 거래로 판정
        </span>
      </div>
      <p className="font-sans-kr text-sm text-navy/[55%] mb-9 leading-[1.7]">
        업로드하신 거래 내역과 첨부 자료를 바탕으로 계좌 거래 패턴을 분석했습니다.
      </p>

      {/* Main analysis grid */}
      <div className="grid grid-cols-[1fr_320px] gap-5 mb-6">
        {/* Graph panel */}
        <div className="card pt-7 px-7 pb-5">
          <div className="text-xs text-navy/[45%] mb-4 tracking-[0.04em]">
            거래 흐름 시각화
          </div>
          <TransactionGraph width={440} height={220} detailed animated />
          <div className="flex gap-4 mt-4">
            {LEGEND.map((l, i) => (
              <div key={i} className="flex items-center gap-[5px]">
                <div className={`w-2 h-2 rounded-full ${l.dotClass}`} />
                <span className="text-[10.5px] text-navy/[50%]">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Evidence list */}
        <div className="flex flex-col gap-2.5">
          <div className="card py-[18px] px-5">
            <div className="text-[11px] text-navy/[40%] mb-2.5 tracking-[0.04em]">
              종합 판정
            </div>
            <div className="font-serif-kr text-[22px] font-bold text-blue mb-1">
              단순 경유 계좌
            </div>
            <div className="text-xs text-navy/[55%] leading-[1.6]">
              의심 자금과 직접 거래 없음. 정상 사업 거래 패턴 확인. 소명 성공 가능성 높음.
            </div>
          </div>

          <div className="card py-[18px] px-5">
            <div className="text-[11px] text-navy/[40%] mb-2.5">
              핵심 수치
            </div>
            {KEY_NUMBERS.map((r, i) => (
              <div key={i} className={`flex justify-between py-1.5 ${i < 2 ? "border-b-[0.5px] border-navy/[7%]" : ""}`}>
                <span className="text-xs text-navy/[50%]">{r.label}</span>
                <span className="text-xs font-semibold text-navy">{r.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Evidence cards */}
      <div className="grid grid-cols-2 gap-2.5 mb-9">
        {EVIDENCE.map((e, i) => (
          <div key={i} className="card py-4 px-[18px]">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[12.5px] font-semibold text-navy">
                {e.label}
              </span>
              <span className={`text-[10px] font-semibold py-0.5 px-[7px] rounded-[10px] ${e.verdict === "정상" ? "text-blue bg-blue/[10%]" : "text-warm bg-warm/[10%]"}`}>
                {e.verdict}
              </span>
            </div>
            <div className="text-[11.5px] text-navy/[50%] leading-[1.5]">
              {e.detail}
            </div>
          </div>
        ))}
      </div>

      <button className="btn-primary" onClick={onNext}>
        이 결과로 소명서 초안 생성
      </button>
    </div>
  )
}
