import { useState } from "react"

const CHECKLIST = [
  { id: "doc", label: "소명서 (풀림 AI 작성본)" },
  { id: "tx",  label: "거래 내역서 (최소 3개월치)" },
  { id: "tax", label: "세금계산서 또는 입금 근거 자료" },
  { id: "biz", label: "사업자등록증 또는 신분증 사본" },
  { id: "etc", label: "기타 거래 계약서 또는 용역 확인서" },
]

const BANKS = [
  { name: "국민은행", dept: "여신거래지원팀", tel: "1588-9999", days: "평일 09:00–18:00" },
  { name: "신한은행", dept: "고객서비스팀",   tel: "1544-8000", days: "평일 09:00–18:00" },
  { name: "우리은행", dept: "고객행복센터",   tel: "1588-5000", days: "평일 09:00–18:00" },
  { name: "하나은행", dept: "고객상담팀",     tel: "1599-1111", days: "평일 09:00–18:00" },
]

export function SubmissionSupport() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const doneCount = Object.values(checked).filter(Boolean).length

  return (
    <div className="step-section max-w-[700px] mx-auto pt-14 px-12 pb-20">
      <div className="mb-2">
        <span className="text-[11px] text-blue font-semibold tracking-[0.1em]">STEP 5</span>
      </div>
      <h1 className="font-serif-kr text-[28px] font-bold text-navy mb-2 tracking-[-0.01em]">
        제출 지원
      </h1>
      <p className="font-sans-kr text-sm text-navy/[55%] mb-9 leading-[1.7]">
        아래 체크리스트를 확인하고, 은행 창구 또는 고객센터에 소명서와 첨부 자료를 함께 제출하세요.
      </p>

      {/* Download bar */}
      <div className="bg-blue/[7%] border-[0.5px] border-blue/[30%] rounded-[10px] py-4 px-5 flex items-center justify-between mb-7">
        <div>
          <div className="text-[13.5px] font-semibold text-navy mb-0.5">
            소명서 — 홍길동_20260824.pdf
          </div>
          <div className="text-[11.5px] text-blue">
            AI 분석 근거 포함 · A4 3쪽 분량
          </div>
        </div>
        <button className="btn-primary text-[13px]">
          PDF 다운로드
        </button>
      </div>

      {/* Checklist */}
      <div className="card py-2 px-0 mb-7">
        <div className="pt-3.5 px-5 pb-2.5 border-b-[0.5px] border-navy/[7%] flex justify-between">
          <span className="text-[12.5px] font-semibold text-navy">제출 체크리스트</span>
          <span className="text-[11.5px] text-blue">{doneCount}/{CHECKLIST.length} 완료</span>
        </div>
        {CHECKLIST.map(c => (
          <label
            key={c.id}
            className="flex items-center gap-3 py-[11px] px-5 border-b-[0.5px] border-navy/[5%] cursor-pointer"
          >
            <div
              onClick={() => setChecked(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
              className={`w-[18px] h-[18px] rounded shrink-0 flex items-center justify-center cursor-pointer ${checked[c.id] ? "bg-blue" : "border-[1.5px] border-navy/[25%]"}`}
            >
              {checked[c.id] && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5.2L4 7.2L8 3.2" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className={`text-[13px] transition-all duration-150 ${checked[c.id] ? "text-navy/[35%] line-through" : "text-navy"}`}>
              {c.label}
            </span>
          </label>
        ))}
      </div>

      {/* Bank contacts */}
      <div className="mb-2">
        <div className="text-[12.5px] font-semibold text-navy mb-3">
          주요 은행 이의제기 접수처
        </div>
        <div className="grid grid-cols-2 gap-2">
          {BANKS.map(b => (
            <div key={b.name} className="card py-3.5 px-4">
              <div className="text-[13px] font-semibold text-navy mb-[3px]">{b.name}</div>
              <div className="text-[11px] text-navy/[45%] mb-[5px]">{b.dept}</div>
              <div className="text-[12.5px] text-blue font-semibold">{b.tel}</div>
              <div className="text-[10.5px] text-navy/[35%] mt-0.5">{b.days}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Legal note */}
      <div className="mt-7 bg-warm/[6%] border-[0.5px] border-warm/[25%] rounded-lg py-3 px-4">
        <div className="text-[11px] text-warm font-semibold mb-[3px]">
          유의사항
        </div>
        <div className="text-[11.5px] text-navy/[55%] leading-[1.65]">
          본 소명서는 AI가 제안한 초안이며, 법적 효력을 보장하지 않습니다. 은행의 최종 판단에 따라 결과가 달라질 수 있으며, 복잡한 사안은 법률 전문가의 검토를 권고드립니다.
        </div>
      </div>
    </div>
  )
}
