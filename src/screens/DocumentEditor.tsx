import { useEffect, useRef, useState } from "react"
import { INITIAL_DOC, AI_CHAT_SEED } from "@/data/document"
import type { ChatMsg } from "@/types"

const QUICK_PROMPTS = ["2번 항목 더 자세히 써줘", "어조를 더 정중하게", "첨부 자료 언급 추가"]

export function DocumentEditor({ onNext }: { onNext: () => void }) {
  const [doc, setDoc] = useState(INITIAL_DOC)
  const [messages, setMessages] = useState<ChatMsg[]>(AI_CHAT_SEED)
  const [input, setInput] = useState("")
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = () => {
    if (!input.trim()) return
    const userMsg = input.trim()
    setInput("")
    setMessages(m => [...m, { role: "user", text: userMsg }])
    setTimeout(() => {
      let reply = "요청 내용을 소명서에 반영하여 다시 작성했습니다. 수정된 내용을 왼쪽 문서에서 확인해 주세요."
      if (userMsg.includes("2번") || userMsg.includes("거래")) {
        reply = "2항 '거래 정상성에 관한 소명' 부분을 더 구체적으로 보강했습니다. 거래 일자와 금액 세부 내역을 추가했습니다."
        setDoc(d => d.replace(
          "나. 입금된 금액(3,500,000원)은",
          "나. 입금된 금액(3,500,000원, 입금일: 2026.08.05)은"
        ))
      }
      if (userMsg.includes("부드럽") || userMsg.includes("정중")) {
        reply = "전반적인 어조를 더 정중하고 협조적인 어조로 수정했습니다."
      }
      setMessages(m => [...m, { role: "ai", text: reply }])
    }, 1000)
  }

  return (
    <div className="step-section pt-14 h-full">
      <div className="px-12 mb-6">
        <div className="mb-2">
          <span className="text-[11px] text-blue font-semibold tracking-[0.1em]">STEP 4</span>
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
        <p className="font-sans-kr text-[13.5px] text-navy/[50%] mt-1.5">
          문서를 직접 수정하거나, 우측 채팅으로 AI에게 수정을 요청하세요.
        </p>
      </div>

      {/* Editor + Chat split */}
      <div className="grid grid-cols-[1fr_360px] h-[calc(100vh-200px)] border-t-[0.5px] border-navy/[10%]">
        {/* Document editor */}
        <div className="pt-7 pr-8 pb-7 pl-12 overflow-y-auto bg-white">
          <div className="bg-white rounded shadow-[0_1px_4px_rgba(16,35,63,0.06)] py-[52px] px-14 min-h-[900px]">
            <textarea
              value={doc}
              onChange={e => setDoc(e.target.value)}
              className="w-full min-h-[800px] border-none outline-none resize-none text-[13.5px] leading-[2] text-navy bg-transparent"
            />
          </div>
        </div>

        {/* Chat panel */}
        <div className="border-l-[0.5px] border-navy/[10%] flex flex-col bg-white">
          <div className="pt-[18px] px-5 pb-3.5 border-b-[0.5px] border-navy/[8%]">
            <div className="text-[12.5px] font-semibold text-navy">
              AI 편집 도우미
            </div>
            <div className="text-[11px] text-navy/[40%] mt-0.5">
              특정 문단 수정 요청 · 어조 변경 · 내용 보강
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto pt-4 px-4 pb-2">
            {messages.map((m, i) => (
              <div key={i} className={`mb-3 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[84%] py-[9px] px-[13px] text-xs leading-[1.65] rounded-tl-xl rounded-tr-xl ${
                    m.role === "user"
                      ? "rounded-br-[2px] rounded-bl-xl bg-blue text-white"
                      : "rounded-br-xl rounded-bl-[2px] bg-navy/[6%] text-navy"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Quick prompts */}
          <div className="pt-2 px-4">
            {QUICK_PROMPTS.map(q => (
              <button
                key={q}
                onClick={() => { setInput(q) }}
                className="text-[11px] bg-navy/[4%] border-[0.5px] border-navy/[12%] rounded-md py-1 px-[9px] cursor-pointer text-navy/[55%] mb-[5px] mr-[5px] inline-block"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="pt-3 px-4 pb-4 border-t-[0.5px] border-navy/[8%] mt-2">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="수정 요청을 입력하세요…"
                className="flex-1 border-[0.5px] border-navy/[18%] rounded-lg py-[9px] px-3 text-[12.5px] text-navy bg-white outline-none"
              />
              <button
                onClick={sendMessage}
                className="bg-blue border-none rounded-lg w-9 h-9 flex items-center justify-center cursor-pointer shrink-0"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7h10M8 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
