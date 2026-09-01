import { TransactionGraph } from "@/components/TransactionGraph"
import { CAT_LABELS } from "@/data/evidence"
import type { Answers } from "@/types"

const LEGEND = [
  { dotClass: "bg-blue", label: "내 계좌 (분석 대상)" },
  { dotClass: "bg-warm/50", label: "의심 경유 계좌" },
  { dotClass: "bg-navy/25", label: "정상 수신 계좌" },
]

const EVIDENCE = [
  {
    cat: "A",
    label: "지속 거래 관계 확인",
    detail: "거래 상대방과 2023.04 ~ 현재 37회 반복 거래 내역 확인",
    verdict: "정상",
  },
  {
    cat: "A",
    label: "세금계산서 대응 입금",
    detail: "세금계산서 발행 7일 내 입금, 금액 일치율 100%",
    verdict: "정상",
  },
  {
    cat: "C",
    label: "자금 체류 패턴",
    detail: "입금 후 평균 22일 체류 후 생활비·임대료로 소비",
    verdict: "정상",
  },
  {
    cat: "C",
    label: "피의 자금 접점",
    detail: "경유 계좌 2단계 거리, 직접 거래 아님",
    verdict: "주의",
  },
] as const

export function AnalysisResult({
  answers,
  onBack,
  onNext,
}: {
  answers: Answers
  onBack: () => void
  onNext: () => void
}) {
  const nameMismatch = answers.q6 === "다름"
  const dealAmount = Number(answers.q7_dealAmount ?? 0)
  const noticeAmount = Number(answers.q7_noticeAmount ?? 0)
  const balance = Number(answers.q7_balance ?? 0)
  const amountsMismatch =
    dealAmount > 0 && noticeAmount > 0 && dealAmount !== noticeAmount

  const facts = [
    {
      label: "입금 일시",
      val:
        [answers.q7_date, answers.q7_time].filter(Boolean).join(" ") ||
        "미입력",
    },
    {
      label: "입금액",
      val: answers.q7_amount
        ? `${Number(answers.q7_amount).toLocaleString()}원`
        : "미입력",
    },
    { label: "입금자명", val: answers.q7_depositor as string || "미입력" },
    {
      label: "입금자명 일치 여부",
      val:
        answers.q6 === "다름"
          ? "불일치"
          : answers.q6 === "같음"
            ? "일치"
            : "미확인",
    },
  ]

  return (
    <div className="step-section max-w-215 mx-auto pt-14 px-12 pb-20">
      <div className="mb-2">
        <span className="text-[11px] text-blue font-semibold tracking-widest">
          STEP 3
        </span>
      </div>
      <div className="flex items-baseline justify-between mb-2">
        <h1 className="font-serif-kr text-[28px] font-bold text-navy tracking-[-0.01em]">
          AI 분석 결과
        </h1>
        <span className="text-[11px] bg-blue/10 text-blue border-[0.5px] border-blue/30 py-0.75 px-2.5 rounded-full font-semibold">
          정상 거래로 판정
        </span>
      </div>
      <p className="font-sans-kr text-sm text-navy/55 mb-9 leading-[1.7]">
        문진 답변과 첨부 자료에서 사실관계를 추출하고, 4개 명제 (A. 거래 실재 ·
        B. 물품 인도 · C. 계좌 정상성 · D. 절차 메타)로 구조화했습니다.
      </p>

      {/* Extracted facts */}
      <div className="card py-4.5 px-5 mb-6">
        <div className="text-xs font-semibold text-navy mb-3">
          추출된 사실관계
        </div>
        {facts.map((f, i) => (
          <div
            key={i}
            className={`flex justify-between py-1.5 ${
              i < facts.length - 1 ? "border-b-[0.5px] border-navy/7" : ""
            }`}
          >
            <span className="text-xs text-navy/50">{f.label}</span>
            <span className="text-xs font-semibold text-navy">{f.val}</span>
          </div>
        ))}
      </div>

      {nameMismatch && (
        <div className="bg-warm/6 border-[0.5px] border-warm/25 rounded-xl py-4 px-5 mb-6">
          <div className="text-[11px] text-warm font-semibold mb-1">
            입금자명 불일치 신호 감지
          </div>
          <div className="text-[11.5px] text-navy/60 leading-[1.6]">
            입금자 이름이 대화 상대방과 달랐다고 답변하신 내용을 소명서 전면에
            배치해 선제적으로 해명하도록 반영했습니다. 대화 기록에 입금자 이름이
            등장하지 않는 것은 오히려 3자사기 구조의 증거입니다.
          </div>
        </div>
      )}

      {amountsMismatch && (
        <div className="bg-warm/6 border-[0.5px] border-warm/25 rounded-xl py-4 px-5 mb-6">
          <div className="text-[11px] text-warm font-semibold mb-1">
            금액 정합성 확인 필요
          </div>
          <div className="text-[11.5px] text-navy/60 leading-[1.6] mb-2">
            거래금액과 공고금액이 일치하지 않습니다. 환급 청구 상한은 "공고되어
            소멸된 채권액" 기준이므로, 청구액을 자동으로 상한선에 맞춰
            두었습니다.
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white rounded-lg py-2 px-2 border-[0.5px] border-warm/20">
              <div className="text-[10px] text-navy/45 mb-1">거래금액</div>
              <div className="text-[12.5px] font-semibold text-navy">
                {dealAmount.toLocaleString()}원
              </div>
            </div>
            <div className="bg-white rounded-lg py-2 px-2 border-[0.5px] border-warm/20">
              <div className="text-[10px] text-navy/45 mb-1">공고금액</div>
              <div className="text-[12.5px] font-semibold text-warm">
                {noticeAmount.toLocaleString()}원
              </div>
            </div>
            <div className="bg-white rounded-lg py-2 px-2 border-[0.5px] border-warm/20">
              <div className="text-[10px] text-navy/45 mb-1">계좌잔액</div>
              <div className="text-[12.5px] font-semibold text-navy">
                {balance.toLocaleString()}원
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main analysis grid */}
      <div className="grid grid-cols-[1fr_320px] gap-5 mb-6">
        {/* Graph panel */}
        <div className="card pt-7 px-7 pb-5">
          <div className="text-xs text-navy/45 mb-4 tracking-[0.04em]">
            거래 흐름 시각화
          </div>
          <TransactionGraph width={440} height={220} detailed animated />
          <div className="flex gap-4 mt-4">
            {LEGEND.map((l, i) => (
              <div key={i} className="flex items-center gap-1.25">
                <div className={`w-2 h-2 rounded-full ${l.dotClass}`} />
                <span className="text-[10.5px] text-navy/50">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Evidence list */}
        <div className="flex flex-col gap-2.5">
          <div className="card py-4.5 px-5">
            <div className="text-[11px] text-navy/40 mb-2.5 tracking-[0.04em]">
              종합 판정
            </div>
            <div className="font-serif-kr text-[22px] font-bold text-blue mb-1">
              단순 경유 계좌
            </div>
            <div className="text-xs text-navy/55 leading-[1.6]">
              의심 자금과 직접 거래 없음. 정상 사업 거래 패턴 확인. 소명 성공
              가능성 높음.
            </div>
          </div>

          <div className="card py-4.5 px-5">
            <div className="text-[11px] text-navy/40 mb-2.5">
              계좌 정상성 근거
            </div>
            {[
              { label: "계좌 개설 연수", val: "5년 이상" },
              { label: "자동이체 반복 개월수", val: "37개월" },
              { label: "평소 패턴과의 이탈도", val: "낮음" },
            ].map((r, i) => (
              <div
                key={i}
                className={`flex justify-between py-1.5 ${
                  i < 2 ? "border-b-[0.5px] border-navy/7" : ""
                }`}
              >
                <span className="text-xs text-navy/50">{r.label}</span>
                <span className="text-xs font-semibold text-navy">{r.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Evidence cards */}
      <div className="grid grid-cols-2 gap-2.5 mb-9">
        {EVIDENCE.map((e, i) => (
          <div key={i} className="card py-4 px-4.5">
            <div className="flex justify-between items-center mb-1.5">
              <div className="flex items-center gap-2">
                <span
                  className="text-[9.5px] font-bold text-blue bg-blue/10 py-px px-1.75 rounded-[10px]"
                  title={CAT_LABELS[e.cat].title}
                >
                  {e.cat}
                </span>
                <span className="text-[12.5px] font-semibold text-navy">
                  {e.label}
                </span>
              </div>
              <span
                className={`text-[10px] font-semibold py-0.5 px-1.75 rounded-[10px] ${
                  e.verdict === "정상"
                    ? "text-blue bg-blue/10"
                    : "text-warm bg-warm/10"
                }`}
              >
                {e.verdict}
              </span>
            </div>
            <div className="text-[11.5px] text-navy/50 leading-normal">
              {e.detail}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-navy/4 rounded-lg py-3 px-4 mb-6 text-[11px] text-navy/55 leading-[1.7]">
        분석 과정에서 등장한 제3자(거래 상대방 등)의 개인정보는 마스킹
        처리되었으며, 업로드하신 원본 자료는 본 분석이 완료된 직후 삭제됩니다.
        계좌 정상성은 단일 점수가 아니라 근거를 나열하는 방식으로 제시합니다 —
        은행 심사자가 읽어야 하는 것은 점수가 아니라 근거이기 때문입니다.
      </div>

      <div className="flex gap-2.5">
        <button className="btn-secondary" onClick={onBack}>← 이전</button>
        <button className="btn-primary" onClick={onNext}>
          이 결과로 소명서 초안 생성
        </button>
      </div>
    </div>
  )
}
