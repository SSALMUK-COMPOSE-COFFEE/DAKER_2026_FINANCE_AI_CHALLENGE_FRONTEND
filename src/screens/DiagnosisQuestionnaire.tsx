import { useState } from "react"
import { QUESTIONS } from "@/data/questions"
import { getEvidenceChecklist, CAT_LABELS } from "@/data/evidence"
import type { Answers } from "@/types"

export function DiagnosisQuestionnaire({
  onNext,
  onDdayChange,
  onAnswersChange,
}: {
  onNext: () => void
  onDdayChange: (d: number) => void
  onAnswersChange: (a: Answers) => void
}) {
  // screen: 0-6 = question, "oos" = out-of-scope, "exit" = account handover, "result" = summary
  const [screen, setScreen] = useState<number | "oos" | "exit" | "result">(0)
  const [ans, setAns] = useState<Answers>({})

  const set = (key: string, val: string | string[]) => setAns(prev => ({ ...prev, [key]: val }))

  const advance = (qIdx: number, value?: string) => {
    const q = QUESTIONS[qIdx]
    if (q.id === "q1" && q.outOfScope?.includes(value ?? "")) { setScreen("oos"); return }
    if (q.id === "q2" && value === q.exitIf) { setScreen("exit"); return }
    if (qIdx === QUESTIONS.length - 1) {
      // Calculate D-day from q6
      const dateStr = (ans.q6 ?? "") as string
      if (dateStr) {
        const freeze = new Date(dateStr)
        const deadline = new Date(freeze)
        deadline.setMonth(deadline.getMonth() + 2)
        const today = new Date("2026-08-27")
        const diff = Math.ceil((deadline.getTime() - today.getTime()) / 86400000)
        onDdayChange(diff)
      }
      onAnswersChange(ans)
      setScreen("result")
      return
    }
    setScreen(qIdx + 1)
  }

  const q = typeof screen === "number" ? QUESTIONS[screen] : null

  const canAdvance = () => {
    if (!q) return false
    if (q.type === "date") return !!(ans[q.id] as string)
    if (q.type === "combo") return !!(ans[`${q.id}_platform`]) && !!(ans[`${q.id}_item`] as string)?.trim()
    if (q.type === "multi") return Array.isArray(ans[q.id]) && (ans[q.id] as string[]).length > 0
    return !!ans[q.id]
  }

  // ── OUT-OF-SCOPE screen ────────────────────────────────────────────────────
  if (screen === "oos") return (
    <div className="step-section max-w-[560px] mx-auto py-20 px-12">
      <div className="mb-5">
        <div className="w-11 h-11 rounded-xl bg-warm/[10%] border-[0.5px] border-warm/[30%] flex items-center justify-center mb-4">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 6v5M10 14h.01" stroke="#C77B4E" strokeWidth="1.5" strokeLinecap="round"/><circle cx="10" cy="10" r="8" stroke="#C77B4E" strokeWidth="1.2"/></svg>
        </div>
        <div className="font-serif-kr text-[22px] font-bold text-navy mb-2.5">현재 서비스 범위를 벗어난 유형입니다</div>
        <p className="font-sans-kr text-sm text-navy/[55%] leading-[1.8] mb-6">
          통장협박·통장묶기 유형은 풀림의 현재 MVP 범위에 포함되어 있지 않습니다.<br />
          해당 유형은 별도의 법적 경로가 필요합니다.
        </p>
        <div className="card py-4 px-[18px] mb-5">
          <div className="text-xs font-semibold text-navy mb-2">권고 경로</div>
          {["금융감독원 민원센터 1332 (평일 09:00–18:00)", "법률구조공단 공익 법률 서비스 132", "경찰청 사이버범죄 신고 시스템 (ecrm.police.go.kr)"].map((t, i) => (
            <div key={i} className={`text-[13px] text-navy/[60%] py-1 ${i < 2 ? "border-b-[0.5px] border-navy/[7%]" : ""}`}>{t}</div>
          ))}
        </div>
        <button className="btn-secondary" onClick={() => setScreen(0)}>← 처음 질문으로 돌아가기</button>
      </div>
    </div>
  )

  // ── EXIT screen (접근매체 양도) ────────────────────────────────────────────
  if (screen === "exit") return (
    <div className="step-section max-w-[560px] mx-auto py-20 px-12">
      <div className="w-11 h-11 rounded-xl bg-warm/[10%] border-[0.5px] border-warm/[30%] flex items-center justify-center mb-4">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10h12M10 4l6 6-6 6" stroke="#C77B4E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <div className="font-serif-kr text-[22px] font-bold text-navy mb-2.5">풀림이 도움드리기 어렵습니다</div>
      <p className="font-sans-kr text-sm text-navy/[55%] leading-[1.8] mb-6">
        통장·카드 등 접근매체를 타인에게 제공한 경우는<br />서비스 대상에서 제외됩니다.<br /><br />
        이 상황은 법률 전문가의 개인 상담이 필요합니다.<br />
        법률구조공단(132)에서 무료 상담을 받으실 수 있습니다.
      </p>
      <button className="btn-secondary" onClick={() => { set("q2", ""); setScreen(0) }}>← 처음으로 돌아가기</button>
    </div>
  )

  // ── RESULT screen ──────────────────────────────────────────────────────────
  if (screen === "result") {
    const dateStr = (ans.q6 ?? "") as string
    let dday = 0
    let ddayLabel = ""
    if (dateStr) {
      const freeze = new Date(dateStr)
      const deadline = new Date(freeze); deadline.setMonth(deadline.getMonth() + 2)
      const today = new Date("2026-08-27")
      dday = Math.ceil((deadline.getTime() - today.getTime()) / 86400000)
      ddayLabel = dday <= 0 ? "기한 도과" : `D-${dday}`
    }
    const urgent = dday <= 14
    const checklist = getEvidenceChecklist(ans)
    const mustItems = checklist.filter(c => c.priority === "필수")
    return (
      <div className="step-section max-w-[640px] mx-auto pt-14 px-12 pb-20">
        <div className="text-[11px] text-blue font-semibold tracking-[0.1em] mb-2">STEP 1 · 진단 완료</div>
        <h1 className="font-serif-kr text-[28px] font-bold text-navy mb-6 tracking-[-0.01em]">상황 진단이 완료되었습니다</h1>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 mb-7">
          <div className="card py-[18px] px-5">
            <div className="text-[11px] font-semibold text-navy/[40%] mb-1.5">추정 유형</div>
            <div className="font-serif-kr text-[18px] font-bold text-blue mb-1">3자사기</div>
            <div className="text-[11.5px] text-navy/[50%] leading-[1.5]">중고거래 사기에 연루된<br />단순 경유 계좌로 추정</div>
          </div>
          <div className="card py-[18px] px-5">
            <div className="text-[11px] font-semibold text-navy/[40%] mb-1.5">이의제기 기한</div>
            <div className={`font-serif-kr text-[22px] font-bold mb-1 ${urgent ? "text-warm" : "text-blue"}`}>{ddayLabel || "—"}</div>
            <div className={`text-[11.5px] leading-[1.5] ${urgent ? "text-warm" : "text-navy/[50%]"}`}>
              {dday <= 0 ? "기한 도과 — 금감원 상담 필요" : dday <= 14 ? "임박 — 서두르세요" : "충분한 여유가 있습니다"}
            </div>
          </div>
        </div>

        {/* Evidence preview */}
        <div className="card py-[18px] px-5 mb-6">
          <div className="text-xs font-semibold text-navy mb-3">
            다음 단계에서 준비하실 자료 — {checklist.length}종
          </div>
          {mustItems.map((item, i) => (
            <div key={item.id} className={`flex items-center gap-2.5 py-[7px] ${i < mustItems.length - 1 ? "border-b-[0.5px] border-navy/[7%]" : ""}`}>
              <span className="text-[9.5px] font-bold text-blue bg-blue/[10%] py-0.5 px-[7px] rounded-[10px] whitespace-nowrap">필수</span>
              <span className="text-[13px] text-navy">{item.label}</span>
              <span className="text-[11px] text-navy/[38%] ml-auto">{CAT_LABELS[item.category].title.split(".")[0]}</span>
            </div>
          ))}
          {checklist.filter(c => c.priority !== "필수").length > 0 && (
            <div className="text-xs text-navy/[40%] mt-2 pt-2 border-t-[0.5px] border-navy/[7%]">
              + 권장·가점 자료 {checklist.filter(c => c.priority !== "필수").length}종은 다음 단계에서 안내됩니다
            </div>
          )}
        </div>

        <button className="btn-primary text-sm py-[13px] px-8" onClick={onNext}>
          증거 업로드로 진행 →
        </button>
      </div>
    )
  }

  // ── QUESTION screen ────────────────────────────────────────────────────────
  if (!q) return null
  const qNum = screen as number

  const toggleMulti = (val: string) => {
    const prev = (ans[q.id] as string[] | undefined) ?? []
    const next = prev.includes(val) ? prev.filter(v => v !== val) : [...prev.filter(v => v !== "없음" || val === "없음"), val].filter(v => !(v === "없음" && val !== "없음" && prev.includes("없음")) ? true : v === val)
    set(q.id, val === "없음" ? ["없음"] : prev.includes("없음") ? [val] : next)
  }

  return (
    <div className="step-section max-w-[600px] mx-auto pt-14 px-12 pb-20">
      {/* Header */}
      <div className="text-[11px] text-blue font-semibold tracking-[0.1em] mb-1">
        STEP 1 · 상황 진단
      </div>

      {/* Sub-progress */}
      <div className="flex items-center gap-2 mb-8">
        <div className="flex-1 h-[3px] rounded-[2px] bg-navy/[8%] overflow-hidden">
          <div
            className="h-full bg-blue rounded-[2px] transition-[width] duration-300 ease-in-out"
            style={{ width: `${((qNum + 1) / QUESTIONS.length) * 100}%` }}
          />
        </div>
        <span className="text-[11px] font-semibold text-navy/[45%] whitespace-nowrap">Q{qNum + 1} / {QUESTIONS.length}</span>
      </div>

      {/* Question */}
      <div className="text-[11.5px] font-semibold text-blue mb-2">{q.tag}</div>
      <h2 className={`font-serif-kr text-2xl font-bold text-navy leading-[1.35] tracking-[-0.01em] ${q.note ? "mb-2.5" : "mb-6"}`}>
        {q.question}
      </h2>
      {q.note && (
        <p className="font-sans-kr text-[13px] text-navy/[52%] leading-[1.75] mb-6">{q.note}</p>
      )}

      {/* Single-select */}
      {q.type === "single" && (
        <div className="flex flex-col gap-2 mb-9">
          {q.options!.map(opt => {
            const sel = ans[q.id] === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => { set(q.id, opt.value); advance(qNum, opt.value) }}
                className={`text-left py-3.5 px-[18px] rounded-[10px] cursor-pointer transition-all duration-[120ms] flex items-center gap-3 ${sel ? "bg-blue/[6%] border border-blue/[45%]" : "bg-white border-[0.5px] border-border"}`}
              >
                <div className={`w-[18px] h-[18px] rounded-full shrink-0 flex items-center justify-center ${sel ? "bg-blue" : "border-[1.5px] border-navy/[20%]"}`}>
                  {sel && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M2 4.5L3.8 6.3L7 3" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span className={`text-[13.5px] ${sel ? "font-semibold text-blue" : "font-normal text-navy"}`}>{opt.label}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Multi-select */}
      {q.type === "multi" && (
        <>
          <div className="flex flex-col gap-2 mb-7">
            {q.options!.map(opt => {
              const sel = ((ans[q.id] as string[]) ?? []).includes(opt.value)
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleMulti(opt.value)}
                  className={`text-left py-[13px] px-[18px] rounded-[10px] cursor-pointer transition-all duration-[120ms] flex items-center gap-3 ${sel ? "bg-blue/[6%] border border-blue/[40%]" : "bg-white border-[0.5px] border-border"}`}
                >
                  <div className={`w-4 h-4 rounded shrink-0 flex items-center justify-center ${sel ? "bg-blue" : "border-[1.5px] border-navy/[20%]"}`}>
                    {sel && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <span className={`text-[13.5px] ${sel ? "font-semibold text-blue" : "font-normal text-navy"}`}>{opt.label}</span>
                </button>
              )
            })}
          </div>
          <div className="flex gap-2.5">
            {qNum > 0 && <button className="btn-secondary" onClick={() => setScreen(qNum - 1)}>← 이전</button>}
            <button className="btn-primary" onClick={() => advance(qNum)} disabled={!canAdvance()}>다음 →</button>
          </div>
        </>
      )}

      {/* Combo: platform chips + item text */}
      {q.type === "combo" && (
        <>
          <div className="mb-3.5">
            <div className="text-xs font-semibold text-navy/[50%] mb-2">판매 플랫폼</div>
            <div className="flex flex-wrap gap-2">
              {q.options!.map(opt => {
                const sel = ans[`${q.id}_platform`] === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => set(`${q.id}_platform`, opt.value)}
                    className={`py-[7px] px-4 rounded-full text-[13px] transition-all duration-[120ms] cursor-pointer ${sel ? "border border-blue/[45%] bg-blue/[8%] font-semibold text-blue" : "border-[0.5px] border-border bg-white font-normal text-navy"}`}
                  >{opt.label}</button>
                )
              })}
            </div>
          </div>
          <div className="mb-7">
            <div className="text-xs font-semibold text-navy/[50%] mb-2">판매 물품</div>
            <input
              value={(ans[`${q.id}_item`] as string) ?? ""}
              onChange={e => set(`${q.id}_item`, e.target.value)}
              placeholder="예: 아이패드 에어 5세대, 나이키 운동화"
              className="w-full py-3 px-3.5 border-[0.5px] border-border rounded-[10px] text-[13.5px] text-navy outline-none bg-white box-border focus:border-blue/[50%]"
            />
          </div>
          <div className="flex gap-2.5">
            {qNum > 0 && <button className="btn-secondary" onClick={() => setScreen(qNum - 1)}>← 이전</button>}
            <button className="btn-primary" onClick={() => advance(qNum)} disabled={!canAdvance()}>다음 →</button>
          </div>
        </>
      )}

      {/* Date */}
      {q.type === "date" && (
        <>
          <div className="mb-4">
            <input
              type="date"
              value={(ans[q.id] as string) ?? ""}
              onChange={e => set(q.id, e.target.value)}
              max="2026-08-27"
              className="py-3 px-3.5 border-[0.5px] border-border rounded-[10px] text-sm text-navy outline-none bg-white w-full box-border focus:border-blue/[50%]"
            />
          </div>
          {ans[q.id] && (() => {
            const freeze = new Date(ans[q.id] as string)
            const deadline = new Date(freeze); deadline.setMonth(deadline.getMonth() + 2)
            const today = new Date("2026-08-27")
            const d = Math.ceil((deadline.getTime() - today.getTime()) / 86400000)
            const label = d <= 0 ? "기한 도과" : `D-${d}`
            const urgent = d <= 14
            return (
              <div className={`py-3 px-3.5 rounded-lg border-[0.5px] mb-6 ${urgent ? "bg-warm/[6%] border-warm/[25%]" : "bg-blue/[6%] border-blue/[20%]"}`}>
                <span className={`font-serif-kr text-xl font-bold ${urgent ? "text-warm" : "text-blue"}`}>{label}</span>
                <span className="text-xs text-navy/[50%] ml-2.5">
                  {d <= 0 ? "채권소멸 가능 — 즉시 금감원 상담을 권고드립니다" : d <= 14 ? `기한까지 ${d}일 — 서류 준비를 서두르세요` : `${deadline.toLocaleDateString("ko-KR")}까지`}
                </span>
              </div>
            )
          })()}
          <div className="flex gap-2.5">
            {qNum > 0 && <button className="btn-secondary" onClick={() => setScreen(qNum - 1)}>← 이전</button>}
            <button className="btn-primary" onClick={() => advance(qNum)} disabled={!canAdvance()}>다음 →</button>
          </div>
        </>
      )}
    </div>
  )
}
