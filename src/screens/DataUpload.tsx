import { useEffect, useRef, useState } from "react"
import { Check, CircleAlert, CircleCheck } from "lucide-react"
import { getEvidenceChecklist, CAT_LABELS } from "@/data/evidence"
import { BANKS, BANK_DISCLOSURE_NOTE } from "@/data/bankRequirements"
import { getLetterTemplate } from "@/data/letterTemplates"
import { api, useAsync } from "@/api"
import type { Transaction } from "@/api"
import type { Answers, EvidenceCategory, Purpose, UploadedFile } from "@/types"

const CAT_ORDER: EvidenceCategory[] = ["D", "A", "B", "C"]

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} B`
}

function priorityClasses(p: string) {
  if (p === "필수") return "text-blue bg-blue/10"
  if (p === "권장") return "text-navy/60 bg-navy/8"
  return "text-warm bg-warm/10"
}

export function DataUpload({
  answers,
  onBack,
  onNext,
  onTransactionsChange,
  onCheckedEvidenceChange,
  onMemoChange,
}: {
  answers: Answers
  onBack: () => void
  onNext: () => void
  onTransactionsChange: (t: Transaction[]) => void
  onCheckedEvidenceChange: (ids: string[]) => void
  onMemoChange: (memo: string) => void
}) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [dragging, setDragging] = useState(false)
  const [memo, setMemo] = useState("")
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
  const [selectedBank, setSelectedBank] = useState("")
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const [uploadError, setUploadError] = useState<string | null>(null)

  const remote = useAsync(
    () => api.evidenceChecklist(answers),
    [JSON.stringify(answers)],
  )
  const banksRemote = useAsync(() => api.banks(), [])
  const purpose = answers.q3 as Purpose ?? "없음"
  const lettersRemote = useAsync(() => api.letters(), [])

  const banks = banksRemote.data?.banks ?? BANKS
  const disclosureNote =
    banksRemote.data?.disclosure_note ?? BANK_DISCLOSURE_NOTE
  const bank = banks.find((b) => b.name === selectedBank)
  const letter =
    lettersRemote.data?.find((l) => l.purpose === purpose) ??
    getLetterTemplate(purpose)

  const checklist = remote.data?.items ?? getEvidenceChecklist(answers)
  const mustItems = checklist.filter((c) => c.priority === "필수")
  const checkedMust = mustItems.filter((m) => checkedItems[m.id]).length
  const gaugePercent =
    mustItems.length > 0
      ? Math.round((checkedMust / mustItems.length) * 100)
      : 0
  const gaugeReady = gaugePercent >= 75

  useEffect(() => {
    onCheckedEvidenceChange(
      Object.entries(checkedItems)
        .filter(([, on]) => on)
        .map(([id]) => id),
    )
  }, [checkedItems, onCheckedEvidenceChange])

  useEffect(() => {
    onMemoChange(memo)
  }, [memo, onMemoChange])

  const addFiles = async (incoming: File[]) => {
    const fresh = incoming.filter(
      (f) => !files.some((existing) => existing.name === f.name),
    )
    if (fresh.length === 0) return

    setUploadError(null)
    setFiles((prev) => [
      ...prev,
      ...fresh.map((f) => ({
        name: f.name,
        size: formatSize(f.size),
        status: "loading" as const,
      })),
    ])

    try {
      const res = await api.parseUploads(fresh)
      const byName = new Map(res.files.map((p) => [p.name, p]))
      setFiles((prev) =>
        prev.map((f) => {
          const parsed = byName.get(f.name)
          if (!parsed) return f
          return {
            ...f,
            size: formatSize(parsed.size),
            kind: parsed.kind,
            transactionCount: parsed.transaction_count,
            error: parsed.error ?? undefined,
            status: parsed.error ? "error" as const : "done" as const,
          }
        }),
      )
      setTransactions((prev) => {
        const merged = [...prev, ...res.transactions]
        onTransactionsChange(merged)
        return merged
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "업로드에 실패했습니다."
      setUploadError(message)
      setFiles((prev) =>
        prev.map((f) =>
          fresh.some((n) => n.name === f.name)
            ? { ...f, status: "error" as const, error: message }
            : f,
        ),
      )
    }
  }

  return (
    <div className="step-section max-w-175 mx-auto pt-8 px-5 pb-14 md:pt-14 md:px-12 md:pb-20">
      <div className="text-[11px] text-blue font-semibold tracking-widest mb-2">
        STEP 2
      </div>
      <h1 className="font-serif-kr text-[28px] font-bold text-navy mb-2 tracking-[-0.01em]">
        소명 자료를 올려주세요
      </h1>
      <p className="font-sans-kr text-sm text-navy/55 mb-7 leading-[1.7]">
        진단 결과를 바탕으로 준비하실 자료 목록을 정리했습니다.
        <br />
        필수 항목부터 순서대로 업로드하시면 5영업일 심사 트랙에 진입할 수
        있어요.
      </p>

      {/* Completeness gauge */}
      <div className="card py-4 px-5 mb-6">
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-[12.5px] font-semibold text-navy">
            완결성 게이지
          </span>
          <span
            className={`text-[12.5px] font-bold ${
              gaugeReady ? "text-blue" : "text-navy/45"
            }`}
          >
            {gaugePercent}% —{" "}
            {gaugePercent >= 100
              ? "5영업일 트랙 진입 가능"
              : gaugeReady
                ? "거의 준비됐어요"
                : `필수 ${checkedMust}/${mustItems.length} 확인됨`}
          </span>
        </div>
        <div className="h-1.5 bg-navy/8 rounded-[3px] overflow-hidden">
          <div
            className={`h-full rounded-[3px] transition-[width] duration-300 ease-in-out ${
              gaugeReady ? "bg-blue" : "bg-sky"
            }`}
            style={{ width: `${gaugePercent}%` }}
          />
        </div>
        {gaugeReady && (
          <div className="text-[11px] text-blue mt-1.5">
            금감원 2026.5 표준화 기준 충족 — 충분한 소명자료 제출 시 5영업일 내
            심사결과 통보
          </div>
        )}
      </div>

      {/* Bank-specific requirements */}
      <div className="mb-6">
        <div className="text-[13.5px] font-semibold text-navy mb-2">
          내 은행이 요구하는 서류
        </div>
        <select
          value={selectedBank}
          onChange={(e) => setSelectedBank(e.target.value)}
          className="w-full py-3 px-3.5 border-[0.5px] border-border rounded-[10px] text-[13.5px] text-navy outline-none bg-white box-border focus:border-blue/50"
        >
          <option value="">은행을 선택하세요</option>
          {banks.map((b) => (
            <option key={b.name} value={b.name}>
              {b.name}
            </option>
          ))}
        </select>
        {bank && (
          <div className="card mt-3 py-4 px-5">
            {bank.requirements ? (
              <>
                <div className="text-[12.5px] font-semibold text-navy mb-2">
                  {bank.name}은(는) 이렇게 안내하고 있습니다
                </div>
                {bank.requirements.map((r, i) => (
                  <div
                    key={i}
                    className={`text-[13px] text-navy/65 py-1.5 ${
                      i < bank.requirements!.length - 1
                        ? "border-b-[0.5px] border-navy/7"
                        : ""
                    }`}
                  >
                    {r}
                  </div>
                ))}
              </>
            ) : (
              <>
                <div className="text-[12.5px] font-semibold text-navy mb-2">
                  {bank.name}은(는) 이의제기 요구서류를 공개하지 않고 있습니다
                </div>
                <div className="text-[11.5px] text-navy/55 leading-[1.6]">
                  {disclosureNote} 아래 체크리스트의 법정 필수 서류와, 같은
                  유형에서 실제로 인정받은 자료로 준비해 주세요.
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Evidence checklist by category */}
      {CAT_ORDER.map((cat) => {
        const items = checklist.filter((c) => c.category === cat)
        if (items.length === 0) return null
        const catInfo = CAT_LABELS[cat]
        return (
          <div key={cat} className="mb-4.5">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-5.5 h-5.5 rounded-md bg-blue/12 flex items-center justify-center">
                <span className="text-[10px] font-bold text-blue">{cat}</span>
              </div>
              <div>
                <span className="text-[13px] font-bold text-navy">
                  {catInfo.title}
                </span>
                <span className="text-[11.5px] text-navy/45 ml-2">
                  {catInfo.desc}
                </span>
              </div>
            </div>
            <div className="card py-1 px-0">
              {items.map((item, i) => {
                const checked = !!checkedItems[item.id]
                return (
                  <label
                    key={item.id}
                    onClick={() =>
                      setCheckedItems((prev) => ({
                        ...prev,
                        [item.id]: !prev[item.id],
                      }))
                    }
                    className={`flex items-start gap-3 py-2.75 px-4 cursor-pointer ${
                      i < items.length - 1
                        ? "border-b-[0.5px] border-navy/7"
                        : ""
                    }`}
                  >
                    <div
                      className={`w-4.5 h-4.5 rounded shrink-0 mt-px cursor-pointer flex items-center justify-center ${
                        checked ? "bg-blue" : "border-[1.5px] border-navy/22"
                      }`}
                    >
                      {checked && (
                        <Check size={12} color="white" strokeWidth={2.5} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                          className={`text-[9.5px] font-bold py-px px-1.75 rounded-[10px] ${priorityClasses(item.priority)}`}
                        >
                          {item.priority}
                        </span>
                        <span
                          className={`text-[13px] font-medium ${
                            checked ? "text-navy/35 line-through" : "text-navy"
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>
                      <span className="text-[11.5px] text-navy/42">
                        {item.description}
                      </span>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Issuance request letter */}
      {letter && (
        <div className="mb-8">
          <div className="text-[13.5px] font-semibold text-navy mb-1">
            증거 발급 요청문
          </div>
          <div className="text-xs text-navy/50 mb-2">
            어디에 무엇을 요청해야 할지 몰라서 못 받는 경우가 많습니다. 아래
            내용을 복사해서 빈칸만 채워 보내세요.
          </div>
          <div className="card py-4 px-5">
            <div className="text-[11px] text-navy/45 mb-1">
              수신: {letter.recipient}
            </div>
            <div className="text-[13px] font-semibold text-navy mb-2.5">
              {letter.subject}
            </div>
            <pre className="font-sans-kr whitespace-pre-wrap text-[12.5px] text-navy/70 leading-[1.7] m-0">
              {letter.body}
            </pre>
          </div>
        </div>
      )}

      {/* Drop zone */}
      <div className="mt-6 mb-4">
        <div className="text-[13.5px] font-semibold text-navy mb-2">
          파일 업로드
        </div>
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            void addFiles(Array.from(e.dataTransfer.files))
          }}
          onClick={() => inputRef.current?.click()}
          className={`border-[1.5px] border-dashed rounded-xl py-7 px-6 text-center cursor-pointer transition-all duration-150 mb-3.5 ${
            dragging ? "border-blue bg-blue/4" : "border-navy/20 bg-navy/2"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => void addFiles(Array.from(e.target.files ?? []))}
          />
          <div className="text-[13px] text-navy font-medium mb-0.75">
            파일을 끌어다 놓거나 클릭해서 선택
          </div>
          <div className="text-[11.5px] text-navy/40">
            CSV, XLSX, PDF, JPG, PNG — 파일당 최대 20MB
          </div>
        </div>

        {uploadError && (
          <div className="bg-warm/6 border-[0.5px] border-warm/25 rounded-lg py-2.5 px-3.5 mb-3 text-[11.5px] text-navy/65 leading-[1.6]">
            {uploadError}
          </div>
        )}

        {files.length > 0 && (
          <div className="card py-1 mb-4">
            {files.map((f, i) => (
              <div
                key={i}
                className={`flex items-center gap-2.5 py-2.25 px-4 ${
                  i < files.length - 1 ? "border-b-[0.5px] border-navy/7" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-medium text-navy truncate">
                    {f.name}
                  </div>
                  <div className="text-[10.5px] text-navy/40">
                    {f.size}
                    {f.transactionCount
                      ? ` · 거래 ${f.transactionCount.toLocaleString()}건 인식`
                      : ""}
                  </div>
                  {f.error && (
                    <div className="text-[10.5px] text-warm leading-[1.5] mt-0.5">
                      {f.error}
                    </div>
                  )}
                </div>
                {f.status === "loading" ? (
                  <span className="text-[11px] text-blue shrink-0">
                    분석 중…
                  </span>
                ) : f.status === "error" ? (
                  <CircleAlert size={16} className="text-warm shrink-0" />
                ) : (
                  <CircleCheck
                    size={16}
                    className="text-blue shrink-0"
                    fill="rgba(61,111,166,0.12)"
                    strokeWidth={1.75}
                  />
                )}
                <button
                  onClick={() =>
                    setFiles((prev) => prev.filter((_, j) => j !== i))
                  }
                  aria-label={`${f.name} 삭제`}
                  className="bg-transparent border-none cursor-pointer text-navy/30 text-base leading-none"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Freetext memo */}
      <div className="mb-8">
        <div className="text-[13.5px] font-semibold text-navy mb-1">
          직접 전달하고 싶은 내용
        </div>
        <div className="text-xs text-navy/50 mb-2">
          파일로 설명하기 어려운 거래 배경, 관계, 당시 상황 등을 자유롭게
          적어주세요.
        </div>
        <div className="relative">
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            maxLength={800}
            placeholder="예: 해당 금액은 당근마켓에서 아이패드를 판매하고 받은 대금입니다. 채팅 상대가 '동생 계좌로 보낸다'고 해서 이름이 달랐지만 당시엔 의심하지 않았습니다."
            className="w-full h-28 pt-3.25 px-4 pb-7 border-[0.5px] border-navy/18 rounded-[10px] text-[13px] text-navy bg-white resize-none outline-none leading-[1.7] box-border focus:border-blue/50"
          />
          <div className="absolute bottom-2.25 right-3.5 text-[10.5px] text-navy/30">
            {memo.length} / 800
          </div>
        </div>
      </div>

      <div className="flex gap-2.5">
        <button className="btn-secondary" onClick={onBack}>
          ← 이전
        </button>
        <button className="btn-primary text-sm py-3.25 px-8" onClick={onNext}>
          AI 분석 시작
          {transactions.length > 0
            ? ` (거래 ${transactions.length.toLocaleString()}건)`
            : ""}{" "}
          →
        </button>
      </div>
    </div>
  )
}
