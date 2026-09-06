import type { Fact } from "@/api"
import type { Answers } from "@/types"

function FactRows({ rows }: { rows: Fact[] }) {
  return (
    <>
      {rows.map((f, i) => (
        <div
          key={`${f.label}-${i}`}
          className={`flex justify-between gap-3 py-1.5 ${
            i < rows.length - 1 ? "border-b-[0.5px] border-navy/7" : ""
          }`}
        >
          <span className="text-xs text-navy/50 shrink-0">{f.label}</span>
          <span className="text-xs font-semibold text-navy text-right">
            {f.value}
          </span>
        </div>
      ))}
    </>
  )
}

function localFacts(answers: Answers): Fact[] {
  return [
    {
      label: "입금 일시",
      value:
        [answers.q7_date, answers.q7_time].filter(Boolean).join(" ") ||
        "미입력",
    },
    {
      label: "입금액",
      value: answers.q7_amount
        ? `${Number(answers.q7_amount).toLocaleString()}원`
        : "미입력",
    },
    { label: "입금자명", value: (answers.q7_depositor as string) || "미입력" },
    {
      label: "입금자명 일치 여부",
      value:
        answers.q6 === "다름"
          ? "불일치"
          : answers.q6 === "같음"
            ? "일치"
            : "미확인",
    },
  ]
}

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

  const facts = localFacts(answers)

  return (
    <div className="step-section max-w-215 mx-auto pt-8 px-5 pb-14 md:pt-14 md:px-12 md:pb-20">
      <div className="mb-2">
        <span className="text-[11px] text-blue font-semibold tracking-widest">
          STEP 3
        </span>
      </div>
      <h1 className="font-serif-kr text-[28px] font-bold text-navy tracking-[-0.01em] mb-2">
        입력 내용 확인
      </h1>
      <p className="font-sans-kr text-sm text-navy/55 mb-6 leading-[1.7]">
        문진에서 답변하신 입금 정보를 정리했습니다. 내용을 확인한 뒤 다음
        단계로 진행해 주세요.
      </p>

      <div className="card py-4.5 px-5 mb-6">
        <div className="text-xs font-semibold text-navy mb-3">
          입력하신 입금 정보
        </div>
        <FactRows rows={facts} />
      </div>

      {nameMismatch && (
        <div className="bg-warm/6 border-[0.5px] border-warm/25 rounded-xl py-4 px-5 mb-6">
          <div className="text-[11px] text-warm font-semibold mb-1">
            입금자명 불일치 신호 감지
          </div>
          <div className="text-[11.5px] text-navy/60 leading-[1.6]">
            입금자 이름이 대화 상대방과 달랐다고 답변하신 내용을 소명서 전면에
            배치해 선제적으로 해명하도록 반영했습니다. 대화 기록에 입금자
            이름이 등장하지 않는 것은 오히려 3자사기 구조의 증거입니다.
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
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

      <div className="bg-navy/4 rounded-lg py-3 px-4 mb-6 text-[11px] text-navy/55 leading-[1.7]">
        업로드한 자료는 소명서 작성에만 사용되며 작성 완료 후 삭제됩니다.
      </div>

      <div className="flex gap-2.5">
        <button className="btn-secondary" onClick={onBack}>
          ← 이전
        </button>
        <button className="btn-primary" onClick={onNext}>
          이 내용으로 소명서 초안 생성
        </button>
      </div>
    </div>
  )
}
