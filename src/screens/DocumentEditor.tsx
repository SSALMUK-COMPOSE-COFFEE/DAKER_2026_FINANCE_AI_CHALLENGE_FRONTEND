import { useEffect, useState } from "react"
import { Loader2, Send, Sparkles } from "lucide-react"
import {
  APPLICATION_REASON_DOC,
  INCIDENT_REPORT_DOC,
  EVIDENCE_INDEX_DOC,
} from "@/data/document"
import { getEvidenceChecklist } from "@/data/evidence"
import { ApiError, api } from "@/api"
import type { AnalysisResponse, Citation, DocKey } from "@/api"
import type { Answers } from "@/types"

const TABS: { key: DocKey; label: string; sub: string }[] = [
  { key: "application", label: "신청서 사유란", sub: "별지 제4호서식" },
  { key: "incident", label: "경위서", sub: "육하원칙 6단락" },
  { key: "evidence", label: "증거 인덱스", sub: "주장 ↔ 증거 대응" },
]

const FALLBACK_DOCS: Record<DocKey, string> = {
  application: APPLICATION_REASON_DOC,
  incident: INCIDENT_REPORT_DOC,
  evidence: EVIDENCE_INDEX_DOC,
}

export function DocumentEditor({
  answers,
  analysis,
  checkedEvidence,
  memo,
  onBack,
  onNext,
}: {
  answers: Answers
  analysis: AnalysisResponse | null
  checkedEvidence: string[]
  memo: string
  onBack: () => void
  onNext: () => void
}) {
  const [docs, setDocs] = useState<Record<DocKey, string>>(FALLBACK_DOCS)
  const [activeTab, setActiveTab] = useState<DocKey>("application")
  const [citations, setCitations] = useState<Citation[]>([])
  const [source, setSource] = useState<"llm" | "template" | "local">("local")
  const [drafting, setDrafting] = useState(true)
  const [draftError, setDraftError] = useState<string | null>(null)

  const [instruction, setInstruction] = useState("")
  const [rewriting, setRewriting] = useState(false)
  const [rewriteError, setRewriteError] = useState<string | null>(null)

  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const checklist = getEvidenceChecklist(answers)
  const applicantName = answers.applicant_name as string ?? ""

  useEffect(() => {
    let alive = true
    setDrafting(true)
    setDraftError(null)
    api
      .draftDocuments({
        answers,
        analysis,
        checked_evidence: checkedEvidence,
        memo,
        applicant: { name: applicantName },
      })
      .then((res) => {
        if (!alive) return
        setDocs({
          application: res.application,
          incident: res.incident,
          evidence: res.evidence_index,
        })
        setCitations(res.citations)
        setSource(res.generated_by)
        setDrafting(false)
      })
      .catch((err: unknown) => {
        if (!alive) return
        setDraftError(
          err instanceof Error ? err.message : "초안 생성에 실패했습니다.",
        )
        setSource("local")
        setDrafting(false)
      })
    return () => {
      alive = false
    }
  }, [])

  const runRewrite = async () => {
    const trimmed = instruction.trim()
    if (!trimmed || rewriting) return
    setRewriting(true)
    setRewriteError(null)
    try {
      const res = await api.rewriteDocument({
        doc_key: activeTab,
        content: docs[activeTab],
        instruction: trimmed,
        answers,
      })
      setDocs((prev) => ({ ...prev, [activeTab]: res.content }))
      setInstruction("")
    } catch (err) {
      setRewriteError(
        err instanceof ApiError && err.status === 503
          ? "AI 재작성을 지금은 쓸 수 없습니다. 문서를 직접 수정해 주세요."
          : err instanceof Error
            ? err.message
            : "재작성에 실패했습니다.",
      )
    } finally {
      setRewriting(false)
    }
  }

  const runExport = async () => {
    setExporting(true)
    setExportError(null)
    try {
      const blob = await api.exportPdf({
        application: docs.application,
        incident: docs.incident,
        evidence_index: docs.evidence,
        applicant_name: applicantName,
      })
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank", "noopener")
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : "PDF 생성에 실패했습니다.",
      )
    } finally {
      setExporting(false)
    }
  }

  const badge = drafting
    ? "초안 생성 중…"
    : source === "llm"
      ? `AI 생성 · 증거 ${checklist.length}종 반영`
      : source === "template"
        ? `표준 서식 기반 · 증거 ${checklist.length}종 반영`
        : `오프라인 초안 · 증거 ${checklist.length}종`

  return (
    <div className="step-section pt-6 md:pt-14 h-full">
      <div className="px-5 md:px-12 mb-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[11px] text-blue font-semibold tracking-widest">
            STEP 4
          </span>
          <span className="text-[11px] text-blue bg-blue/10 py-0.5 px-2 rounded-full font-semibold">
            {badge}
          </span>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="font-serif-kr text-[28px] font-bold text-navy tracking-[-0.01em]">
            소명서 초안 편집
          </h1>
          <div className="flex gap-2">
            <button
              className="btn-secondary text-[13px]"
              onClick={runExport}
              disabled={exporting || drafting}
            >
              {exporting ? "PDF 생성 중…" : "PDF 내려받기"}
            </button>
            <button
              className="btn-primary text-[13px]"
              onClick={onNext}
              disabled={drafting}
            >
              완성 — 제출 지원으로
            </button>
          </div>
        </div>
        <p className="font-sans-kr text-[13.5px] text-navy/50 mt-1.5">
          이의제기신청서 사유란·경위서·증거 인덱스 3종이 함께 준비됩니다. 문서를
          직접 검토하고 필요한 부분을 고쳐 쓰세요.
        </p>

        {draftError && (
          <div className="mt-3 bg-warm/6 border-[0.5px] border-warm/25 rounded-lg py-2.5 px-3.5 text-[11.5px] text-navy/65 leading-[1.6]">
            초안 서버에 연결하지 못했습니다 ({draftError}). 표준 서식 초안을
            대신 띄웠습니다.
          </div>
        )}
        {exportError && (
          <div className="mt-3 bg-warm/6 border-[0.5px] border-warm/25 rounded-lg py-2.5 px-3.5 text-[11.5px] text-navy/65">
            {exportError}
          </div>
        )}
      </div>

      <div className="px-5 md:px-12 mb-2 flex gap-1.5 overflow-x-auto">
        {TABS.map((t) => {
          const active = t.key === activeTab
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`text-left py-2 px-3.5 rounded-t-lg border-[0.5px] border-b-0 shrink-0 ${
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

      <div className="border-t-[0.5px] border-navy/10 pt-5 px-5 pb-5 md:pt-7 md:px-12 md:pb-7 overflow-y-auto bg-white">
        <div className="max-w-190 mx-auto">
          <div className="bg-white rounded shadow-[0_1px_4px_rgba(16,35,63,0.06)] py-6 px-5 md:py-13 md:px-14 min-h-150 relative">
            {drafting && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded">
                <div className="flex items-center gap-2 text-[12.5px] text-navy/55">
                  <Loader2 size={15} className="animate-spin" />
                  초안을 만들고 있습니다…
                </div>
              </div>
            )}
            <textarea
              value={docs[activeTab]}
              onChange={(e) =>
                setDocs((prev) => ({ ...prev, [activeTab]: e.target.value }))
              }
              className="w-full min-h-140 border-none outline-none resize-none text-[13.5px] leading-loose text-navy bg-transparent"
            />
          </div>

          <div className="mt-4 card py-3.5 px-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles size={13} className="text-blue" />
              <span className="text-[11.5px] font-semibold text-navy">
                AI에게 고쳐 달라고 하기
              </span>
              <span className="text-[10.5px] text-navy/40">
                현재 탭: {TABS.find((t) => t.key === activeTab)?.label}
              </span>
            </div>
            <div className="flex gap-2">
              <input
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    e.preventDefault()
                    void runRewrite()
                  }
                }}
                placeholder="예: 입금자명이 다른 이유를 더 자세히 설명해 주세요"
                disabled={rewriting || drafting}
                className="flex-1 min-w-0 py-2.5 px-3.5 border-[0.5px] border-border rounded-lg text-[13px] text-navy bg-white outline-none focus:border-blue/50"
              />
              <button
                className="btn-primary text-[13px] flex items-center gap-1.5 shrink-0"
                onClick={() => void runRewrite()}
                disabled={rewriting || drafting || !instruction.trim()}
              >
                {rewriting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                {rewriting ? "고치는 중" : "요청"}
              </button>
            </div>
            {rewriteError && (
              <div className="mt-2 text-[11.5px] text-warm leading-[1.6]">
                {rewriteError}
              </div>
            )}
          </div>

          {citations.length > 0 && (
            <div className="mt-3 card py-3.5 px-4">
              <div className="text-[11.5px] font-semibold text-navy mb-2">
                이 초안이 근거로 삼은 법령·판례
              </div>
              <div className="flex flex-col gap-2.5">
                {citations.map((c) => (
                  <div key={c.key}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9.5px] font-bold text-blue bg-blue/10 py-px px-1.75 rounded-[10px]">
                        {c.kind === "statute" ? "법령" : "판례"}
                      </span>
                      <span className="text-[12px] font-semibold text-navy">
                        {c.title}
                      </span>
                    </div>
                    <div className="text-[11.5px] text-navy/55 leading-[1.6] mt-0.5">
                      {c.summary}
                    </div>
                    {c.caution && (
                      <div className="text-[11px] text-warm leading-[1.6] mt-0.5">
                        {c.caution}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 flex gap-2.5">
            <button className="btn-secondary" onClick={onBack}>
              ← 이전
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
