import { useEffect } from "react"
import { TransactionGraph } from "@/components/TransactionGraph"
import { CAT_LABELS } from "@/data/evidence"
import { api, useAsync } from "@/api"
import type { AnalysisResponse, Fact, Transaction } from "@/api"
import type { Answers } from "@/types"

const LEGEND = [
  { dotClass: "bg-blue", label: "내 계좌 (분석 대상)" },
  { dotClass: "bg-warm/50", label: "의심 경유 계좌" },
  { dotClass: "bg-navy/25", label: "정상 수신 계좌" },
]

const VERDICT_TONE: Record<string, string> = {
  종착점: "text-blue bg-blue/10 border-blue/30",
  판단보류: "text-navy/60 bg-navy/6 border-navy/20",
  중계의심: "text-warm bg-warm/10 border-warm/30",
}

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
    { label: "입금자명", value: answers.q7_depositor as string || "미입력" },
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
  transactions,
  onAnalysis,
  onBack,
  onNext,
}: {
  answers: Answers
  transactions: Transaction[]
  onAnalysis: (a: AnalysisResponse | null) => void
  onBack: () => void
  onNext: () => void
}) {
  const { data, error, loading, reload } = useAsync<AnalysisResponse>(
    () => api.analyze(answers, transactions),
    [JSON.stringify(answers), transactions.length],
  )

  useEffect(() => {
    onAnalysis(data)
  }, [data, onAnalysis])

  const nameMismatch = answers.q6 === "다름"
  const dealAmount = Number(answers.q7_dealAmount ?? 0)
  const noticeAmount = Number(answers.q7_noticeAmount ?? 0)
  const balance = Number(answers.q7_balance ?? 0)
  const amountsMismatch =
    dealAmount > 0 && noticeAmount > 0 && dealAmount !== noticeAmount

  const facts = data?.facts.length ? data.facts : localFacts(answers)
  const verdict = data?.verdict ?? "판단보류"

  return (
    <div className="step-section max-w-215 mx-auto pt-8 px-5 pb-14 md:pt-14 md:px-12 md:pb-20">
      <div className="mb-2">
        <span className="text-[11px] text-blue font-semibold tracking-widest">
          STEP 3
        </span>
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
        <h1 className="font-serif-kr text-[28px] font-bold text-navy tracking-[-0.01em]">
          AI 분석 결과
        </h1>
        {loading ? (
          <span className="text-[11px] bg-navy/6 text-navy/50 border-[0.5px] border-navy/15 py-0.75 px-2.5 rounded-full font-semibold">
            분석 중…
          </span>
        ) : (
          <span
            className={`text-[11px] border-[0.5px] py-0.75 px-2.5 rounded-full font-semibold ${
              VERDICT_TONE[verdict] ?? VERDICT_TONE.판단보류
            }`}
          >
            {verdict}
            {data ? ` · 신뢰도 ${Math.round(data.confidence * 100)}%` : ""}
          </span>
        )}
      </div>
      <p className="font-sans-kr text-sm text-navy/55 mb-6 leading-[1.7]">
        {data?.summary ??
          "문진 답변과 첨부 자료에서 사실관계를 추출하고, 4개 명제 (A. 거래 실재 · B. 물품 인도 · C. 계좌 정상성 · D. 절차 메타)로 구조화했습니다."}
      </p>

      {error && (
        <div className="bg-warm/6 border-[0.5px] border-warm/25 rounded-xl py-4 px-5 mb-6">
          <div className="text-[11px] text-warm font-semibold mb-1">
            분석 서버에 연결하지 못했습니다
          </div>
          <div className="text-[11.5px] text-navy/60 leading-[1.6] mb-2.5">
            {error} — 아래 내용은 문진 답변만으로 구성한 임시 결과입니다.
          </div>
          <button className="btn-secondary text-[12px]" onClick={reload}>
            다시 시도
          </button>
        </div>
      )}

      {data?.abstained && (
        <div className="bg-navy/4 border-[0.5px] border-navy/12 rounded-xl py-4 px-5 mb-6">
          <div className="text-[11px] text-navy/70 font-semibold mb-1">
            판단을 보류했습니다
          </div>
          <div className="text-[11.5px] text-navy/60 leading-[1.6]">
            {data.headline} 근거가 부족할 때는 결론을 단정하지 않습니다. 증거를
            더 올리면 판정이 달라질 수 있습니다.
          </div>
        </div>
      )}

      <div className="card py-4.5 px-5 mb-6">
        <div className="text-xs font-semibold text-navy mb-3">
          추출된 사실관계
        </div>
        <FactRows rows={facts} />
      </div>

      {(data?.signals ?? []).map((s) => (
        <div
          key={s.key}
          className={`rounded-xl py-4 px-5 mb-6 border-[0.5px] ${
            s.level === "warn"
              ? "bg-warm/6 border-warm/25"
              : "bg-blue/5 border-blue/20"
          }`}
        >
          <div
            className={`text-[11px] font-semibold mb-1 ${
              s.level === "warn" ? "text-warm" : "text-blue"
            }`}
          >
            {s.title}
          </div>
          <div className="text-[11.5px] text-navy/60 leading-[1.6]">
            {s.body}
          </div>
        </div>
      ))}

      {!data && nameMismatch && (
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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 mb-6">
        <div className="card pt-7 px-5 pb-5 md:px-7">
          <div className="text-xs text-navy/45 mb-4 tracking-[0.04em]">
            거래 흐름 시각화
            {data && data.graph.nodes.length > 0
              ? ` · 계좌 ${data.graph.nodes.length}개`
              : ""}
          </div>
          <TransactionGraph
            width={440}
            height={220}
            detailed
            animated
            data={data?.graph}
          />
          <div className="flex flex-wrap gap-4 mt-4">
            {LEGEND.map((l, i) => (
              <div key={i} className="flex items-center gap-1.25">
                <div className={`w-2 h-2 rounded-full ${l.dotClass}`} />
                <span className="text-[10.5px] text-navy/50">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="card py-4.5 px-5">
            <div className="text-[11px] text-navy/40 mb-2.5 tracking-[0.04em]">
              종합 판정
            </div>
            <div className="font-serif-kr text-[22px] font-bold text-blue mb-1">
              {data?.headline ?? (loading ? "분석 중…" : "단순 경유 계좌")}
            </div>
            <div className="text-xs text-navy/55 leading-[1.6]">
              {data?.summary ??
                "의심 자금과 직접 거래 없음. 정상 사업 거래 패턴 확인. 소명 성공 가능성 높음."}
            </div>
          </div>

          <div className="card py-4.5 px-5">
            <div className="text-[11px] text-navy/40 mb-2.5">
              계좌 정상성 근거
            </div>
            <FactRows
              rows={
                data?.account_normality.length
                  ? data.account_normality
                  : [
                      { label: "계좌 개설 연수", value: "5년 이상" },
                      { label: "자동이체 반복 개월수", value: "37개월" },
                      { label: "평소 패턴과의 이탈도", value: "낮음" },
                    ]
              }
            />
          </div>
        </div>
      </div>

      {data && data.findings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-9">
          {data.findings.map((e, i) => (
            <div key={i} className="card py-4 px-4.5">
              <div className="flex justify-between items-center gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="text-[9.5px] font-bold text-blue bg-blue/10 py-px px-1.75 rounded-[10px] shrink-0"
                    title={CAT_LABELS[e.category]?.title}
                  >
                    {e.category}
                  </span>
                  <span className="text-[12.5px] font-semibold text-navy truncate">
                    {e.label}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-semibold py-0.5 px-1.75 rounded-[10px] shrink-0 ${
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
      )}

      {data && data.notes.length > 0 && (
        <div className="card py-4 px-5 mb-6">
          <div className="text-[11px] text-navy/40 mb-2">분석 메모</div>
          <ul className="flex flex-col gap-1.5 m-0 pl-4">
            {data.notes.map((n, i) => (
              <li key={i} className="text-[11.5px] text-navy/55 leading-[1.6]">
                {n}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-navy/4 rounded-lg py-3 px-4 mb-6 text-[11px] text-navy/55 leading-[1.7]">
        분석 과정에서 등장한 제3자(거래 상대방 등)의 개인정보는 마스킹
        처리되었으며, 업로드하신 원본 자료는 본 분석이 완료된 직후 삭제됩니다.
        계좌 정상성은 단일 점수가 아니라 근거를 나열하는 방식으로 제시합니다 —
        은행 심사자가 읽어야 하는 것은 점수가 아니라 근거이기 때문입니다.
      </div>

      <div className="flex gap-2.5">
        <button className="btn-secondary" onClick={onBack}>
          ← 이전
        </button>
        <button className="btn-primary" onClick={onNext} disabled={loading}>
          이 결과로 소명서 초안 생성
        </button>
      </div>
    </div>
  )
}
