import { useState } from "react"
import {
  APPLICATION_REASON_DOC,
  INCIDENT_REPORT_DOC,
  EVIDENCE_INDEX_DOC,
} from "@/data/document"
import { getEvidenceChecklist } from "@/data/evidence"
import type { Answers } from "@/types"

type DocKey = "application" | "incident" | "evidence"

const TABS: { key: DocKey; label: string; sub: string }[] = [
  { key: "application", label: "신청서 사유란", sub: "별지 제4호서식" },
  { key: "incident", label: "경위서", sub: "육하원칙 6단락" },
  { key: "evidence", label: "증거 인덱스", sub: "주장 ↔ 증거 대응" },
]

export function DocumentEditor({
  answers,
  onNext,
}: {
  answers: Answers
  onNext: () => void
}) {
  const [docs, setDocs] = useState<Record<DocKey, string>>({
    application: APPLICATION_REASON_DOC,
    incident: INCIDENT_REPORT_DOC,
    evidence: EVIDENCE_INDEX_DOC,
  })
  const [activeTab, setActiveTab] = useState<DocKey>("application")

  const checklist = getEvidenceChecklist(answers)

  return (
    <div className="step-section pt-14 h-full">
      <div className="px-12 mb-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[11px] text-blue font-semibold tracking-widest">
            STEP 4
          </span>
          <span className="text-[11px] text-blue bg-blue/10 py-0.5 px-2 rounded-full font-semibold">
            증거 {checklist.length}종 기반 초안
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <h1 className="font-serif-kr text-[28px] font-bold text-navy tracking-[-0.01em]">
            소명서 초안 편집
          </h1>
          <div className="flex gap-2">
            <button className="btn-secondary text-[13px]">인쇄 미리보기</button>
            <button className="btn-primary text-[13px]" onClick={onNext}>
              완성 — 제출 지원으로
            </button>
          </div>
        </div>
        <p className="font-sans-kr text-[13.5px] text-navy/50 mt-1.5">
          이의제기신청서 사유란·경위서·증거 인덱스 3종이 함께 준비됩니다. 문서를
          직접 검토하고 필요한 부분을 고쳐 쓰세요.
        </p>
      </div>

      {/* Document tabs */}
      <div className="px-12 mb-2 flex gap-1.5">
        {TABS.map((t) => {
          const active = t.key === activeTab
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`text-left py-2 px-3.5 rounded-t-lg border-[0.5px] border-b-0 ${
                active
                  ? "bg-white border-navy/10"
                  : "bg-navy/3 border-transparent"
              }`}
            >
              <div
                className={`text-[12.5px] font-semibold ${
                  active ? "text-blue" : "text-navy/55"
                }`}
              >
                {t.label}
              </div>
              <div className="text-[10px] text-navy/38">{t.sub}</div>
            </button>
          )
        })}
      </div>

      {/* Document editor */}
      <div className="border-t-[0.5px] border-navy/10 pt-7 px-12 pb-7 overflow-y-auto bg-white">
        <div className="bg-white rounded shadow-[0_1px_4px_rgba(16,35,63,0.06)] py-13 px-14 max-w-190 mx-auto min-h-150">
          <textarea
            value={docs[activeTab]}
            onChange={(e) =>
              setDocs((prev) => ({ ...prev, [activeTab]: e.target.value }))
            }
            className="w-full min-h-140 border-none outline-none resize-none text-[13.5px] leading-loose text-navy bg-transparent"
          />
        </div>
      </div>
    </div>
  )
}
