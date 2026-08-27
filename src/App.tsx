import { useState, useRef, useEffect } from "react"

// ── Types ────────────────────────────────────────────────────────────────────
interface ChatMsg { role: "user" | "ai"; text: string }
interface UploadedFile { name: string; size: string; status: "done" | "loading" }

// ── Constants ────────────────────────────────────────────────────────────────
const STEP_LABELS = [
  { label: "서비스 소개",   sub: "풀림 소개 · 동의" },
  { label: "상황 진단",     sub: "7가지 문진" },
  { label: "증거 업로드",   sub: "체크리스트 · 완결성" },
  { label: "AI 분석 결과",  sub: "증거 구조화" },
  { label: "소명서 초안",   sub: "문서 편집" },
  { label: "제출 지원",     sub: "은행 제출 안내" },
]

// ── Questionnaire data ────────────────────────────────────────────────────────
interface QOption { value: string; label: string }
interface Question {
  id: string; tag: string; question: string
  note?: string
  type: "single" | "multi" | "combo" | "date"
  options?: QOption[]
  exitIf?: string
  outOfScope?: string[]
}

const QUESTIONS: Question[] = [
  {
    id: "q1", tag: "Q1 · 유형 판별",
    question: "어떤 상황에서 계좌가 정지되었나요?",
    note: "가장 가까운 상황을 선택해 주세요.",
    type: "single",
    options: [
      { value: "3자사기",  label: "중고거래로 물건을 팔고 대금을 받은 후" },
      { value: "협박",     label: "모르는 돈이 입금된 후 협박 메시지를 받음" },
      { value: "묶기",     label: "모르는 소액이 입금됐는데 메시지는 없었음" },
      { value: "모름",     label: "이유를 전혀 모르겠음" },
    ],
    outOfScope: ["협박", "묶기"],
  },
  {
    id: "q2", tag: "Q2 · 서비스 대상 확인",
    question: "통장·카드·OTP·비밀번호를 다른 사람에게 넘긴 적이 있나요?",
    note: "아르바이트 조건이나 대출을 위해 제공한 경우도 포함됩니다. 풀림이 왜 이걸 묻는지 이해합니다 — 이 경우는 저희가 안내드릴 수 있는 범위가 아니기 때문입니다.",
    type: "single",
    options: [
      { value: "없음", label: "전혀 없음" },
      { value: "있음", label: "있음 (사유 불문)" },
    ],
    exitIf: "있음",
  },
  {
    id: "q3", tag: "Q3 · 거래 맥락",
    question: "어디서 무엇을 판매하셨나요?",
    note: "판매 플랫폼과 물품을 알면 필요한 증거를 더 정확하게 안내할 수 있어요.",
    type: "combo",
    options: [
      { value: "당근마켓", label: "당근마켓" },
      { value: "번개장터", label: "번개장터" },
      { value: "중고나라", label: "중고나라" },
      { value: "기타",     label: "기타 플랫폼" },
    ],
  },
  {
    id: "q4", tag: "Q4 · 인도 방식",
    question: "물건을 어떻게 전달하셨나요?",
    note: "전달 방식에 따라 준비해야 할 증거 서류가 달라집니다.",
    type: "single",
    options: [
      { value: "택배",    label: "택배 발송" },
      { value: "직거래",  label: "직접 만나서 전달" },
      { value: "기프티콘", label: "기프티콘·핀번호 전송" },
      { value: "미전달",  label: "아직 전달하지 않았음" },
    ],
  },
  {
    id: "q5", tag: "Q5 · 입금자명 확인",
    question: "입금자 이름이 채팅 상대방의 이름과 같았나요?",
    note: "이 질문은 삼각사기 구조를 확인하는 핵심 신호입니다. 다를 경우 소명서에서 전면에 해명합니다.",
    type: "single",
    options: [
      { value: "같음", label: "같았음" },
      { value: "다름", label: "달랐음 (예: \"동생 계좌로 보낸다\"고 했음)" },
      { value: "모름", label: "기억나지 않음" },
    ],
  },
  {
    id: "q6", tag: "Q6 · 기한 확인",
    question: "계좌가 정지된 날짜가 언제인가요?",
    note: "통보 문자 또는 앱 알림에 표시된 날짜입니다. 지급정지일로부터 2개월 이내에 이의제기를 해야 합니다.",
    type: "date",
  },
  {
    id: "q7", tag: "Q7 · 사전 조치",
    question: "이미 취하신 조치가 있다면 모두 선택해 주세요.",
    note: "아직 아무것도 못하셨어도 괜찮습니다. 지금부터 함께 준비할 수 있어요.",
    type: "multi",
    options: [
      { value: "은행전화",  label: "은행에 전화해 봄" },
      { value: "경찰신고",  label: "경찰에 신고함" },
      { value: "더치트",    label: "더치트(The Cheat) 조회함" },
      { value: "없음",      label: "아직 아무것도 못함" },
    ],
  },
]

// ── Evidence checklist builder ────────────────────────────────────────────────
interface EvidenceItem {
  id: string; category: "A" | "B" | "C" | "D"
  priority: "필수" | "권장" | "가점"
  label: string; description: string
}

const CAT_LABELS: Record<string, { title: string; desc: string }> = {
  A: { title: "A. 거래 실재",    desc: "거래가 실제로 있었음을 증명" },
  B: { title: "B. 물품 인도",    desc: "물건을 실제로 전달했음을 증명" },
  C: { title: "C. 계좌 정상성",  desc: "계좌가 정상적으로 운용됐음을 증명" },
  D: { title: "D. 절차 메타",    desc: "이의제기 절차에 필요한 공식 서류" },
}

function getEvidenceChecklist(answers: Record<string, string | string[]>): EvidenceItem[] {
  const items: EvidenceItem[] = [
    { id: "notif",     category: "D", priority: "필수", label: "지급정지 통보 캡처",           description: "문자·앱 알림 스크린샷" },
    { id: "chat",      category: "A", priority: "필수", label: "거래 대화 전체 스크린샷",      description: "협의~입금 요청까지 전 과정" },
    { id: "txhistory", category: "C", priority: "필수", label: "거래내역 CSV (수개월치 권장)", description: "은행 앱·영업점에서 발급" },
    { id: "id",        category: "D", priority: "필수", label: "신분증 사본",                  description: "주민등록증 또는 운전면허증" },
  ]
  const q4 = answers.q4 as string
  const q5 = answers.q5 as string
  const q7 = (answers.q7 ?? []) as string[]

  if (q4 === "택배") {
    items.push({ id: "tracking", category: "B", priority: "권장", label: "운송장·배송조회 완료 캡처", description: "배송완료 상태 확인 가능한 것" })
    items.push({ id: "receipt",  category: "B", priority: "권장", label: "편의점 택배 영수증",         description: "발송 사실 추가 증명" })
  } else if (q4 === "직거래") {
    items.push({ id: "meetup",    category: "B", priority: "권장", label: "만남 약속 대화 캡처",       description: "시각·장소 특정 가능한 것" })
    items.push({ id: "movement",  category: "B", priority: "권장", label: "이동 기록 (지도 앱·교통카드)", description: "정황 증거로 인도 시점 특정" })
  } else if (q4 === "기프티콘") {
    items.push({ id: "giftpin",    category: "B", priority: "필수", label: "기프티콘·핀번호 전송 화면", description: "상대에게 전달한 캡처" })
    items.push({ id: "giftorigin", category: "A", priority: "필수", label: "기프티콘 원구매 영수증",    description: "\"장물 아니냐\" 의심을 차단" })
  }
  if (q5 === "다름") {
    items.push({ id: "mismatch", category: "A", priority: "권장", label: "입금내역 + 대화 병치 캡처",  description: "불일치를 전면에 해명하는 핵심 증거" })
  }
  items.push({ id: "employment", category: "C", priority: "권장", label: "재직증명서 또는 고용계약서 (택1)", description: "2026.5 금감원 표준화 — 생활계좌 근거" })
  if (q7.includes("경찰신고")) {
    items.push({ id: "police",   category: "D", priority: "가점", label: "경찰 신고 접수증·사건사고사실확인원", description: "\"본인도 피해자\" 절차 기록" })
  }
  if (q7.includes("더치트")) {
    items.push({ id: "thecheat", category: "D", priority: "가점", label: "더치트 조회 결과 캡처",       description: "사기범 정보 기록" })
  }
  return items
}

const INITIAL_DOC = `소 명 서

수  신: ○○은행 여신거래지원팀
발  신: 홍길동
계좌번호: 123-456-789012
작성일: 2026년 8월 24일

제 목: 지급정지 계좌에 대한 이의제기 및 소명

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 계좌 정지 경위

저는 2026년 8월 10일, 귀행으로부터 본인 명의 계좌(123-456-789012)가
전기통신금융사기 피해 방지 및 피해금 환급에 관한 특별법 제6조에 따라
지급정지 조치되었음을 문자로 통보받았습니다.

그러나 해당 계좌는 오로지 정상적인 사업 거래 목적으로만 사용되었으며,
저는 어떠한 사기 행위에도 가담하거나 인지한 바가 없습니다.

2. 거래 정상성에 관한 소명

AI 거래 분석 결과, 해당 기간 본 계좌의 거래는 아래 근거로 정상 거래로 판단됩니다:

  가. 입금 주체(김○○, 사업자 등록번호 123-45-67890)는 본인과
      2023년부터 지속적인 용역 거래 관계를 유지해온 사업 파트너입니다.

  나. 입금된 금액(3,500,000원)은 2026년 7월 31일 발행된 세금계산서
      (공급가액 3,181,818원, 부가세 318,182원)의 대금으로,
      과세 당국에 신고된 정상 매출에 해당합니다.

  다. 해당 자금은 입금 후 즉시 인출되지 않고 다음 달 임대료·
      직원 급여 지급에 사용되어, 자금 세탁 목적 거래와는 패턴이 상이합니다.

  라. 지급정지 통보 이전 3년간 귀행에서 이상거래 이력이 없으며,
      신용 등급 또한 양호(1~2등급)합니다.

3. 요청 사항

상기 소명 내용 및 첨부 자료를 면밀히 검토하시어, 지급정지 해제를 요청드립니다.
만약 추가 소명 자료가 필요하실 경우 즉시 제출하겠습니다.

4. 첨부 자료 목록

  [1] 거래 내역서 (2026.06 ~ 2026.08)
  [2] 세금계산서 사본 (2026-07-31 발행)
  [3] 사업자등록증 사본
  [4] 거래 계약서 또는 용역 확인서 사본

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

위 내용이 모두 사실임을 확인하며, 허위 사실 기재 시 관련 법령에 따른
책임을 질 것임을 동의합니다.

2026년 8월 24일

홍 길 동  (서명/인)
연락처: 010-1234-5678  |  이메일: hong@example.com`

const AI_CHAT_SEED: ChatMsg[] = [
  {
    role: "ai",
    text: "AI가 거래 내역을 바탕으로 소명서 초안을 작성했습니다. 내용을 직접 수정하거나, 특정 부분에 대해 요청해 주시면 다시 작성해 드립니다.",
  },
]

// ── Wordmark ─────────────────────────────────────────────────────────────────
function Wordmark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: { mark: 18, kr: 18, en: 9 }, md: { mark: 24, kr: 22, en: 10 }, lg: { mark: 36, kr: 32, en: 13 } }
  const s = sizes[size]
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <svg width={s.mark} height={s.mark} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="10" r="5" stroke="#3D6FA6" strokeWidth="1.5" />
        <path d="M9 10 Q9 15 12 18 Q15 15 15 10" stroke="#3D6FA6" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M15 10 Q18 10 18 13" stroke="#3D6FA6" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeDasharray="2 2" />
      </svg>
      <div>
        <div
          className="font-serif-kr"
          style={{ fontSize: s.kr, fontWeight: 600, color: "#10233F", lineHeight: 1, letterSpacing: "-0.01em" }}
        >
          풀림
        </div>
        <div
          className="font-sans-kr"
          style={{ fontSize: s.en, color: "#3D6FA6", letterSpacing: "0.12em", fontWeight: 500, marginTop: 1 }}
        >
          PULL-LIM
        </div>
      </div>
    </div>
  )
}

// ── SVG Transaction Graph ─────────────────────────────────────────────────────
function TransactionGraph({
  width = 520,
  height = 260,
  detailed = false,
  animated = true,
}: {
  width?: number
  height?: number
  detailed?: boolean
  animated?: boolean
}) {
  const nodes = [
    { id: "orig", x: 48,  y: 68,  type: "origin",  label: "최초 계좌" },
    { id: "mid1", x: 148, y: 38,  type: "suspect", label: "경유 A" },
    { id: "mid2", x: 148, y: 148, type: "suspect", label: "경유 B" },
    { id: "self", x: 268, y: 88,  type: "self",    label: "내 계좌" },
    { id: "out1", x: 390, y: 48,  type: "normal",  label: "수신 계좌 1" },
    { id: "out2", x: 390, y: 148, type: "normal",  label: "수신 계좌 2" },
    { id: "out3", x: 470, y: 210, type: "normal",  label: "수신 계좌 3" },
    { id: "sub1", x: 80,  y: 210, type: "other",   label: "연관 계좌" },
  ]
  const edges = [
    { f: "orig", t: "mid1", s: true },
    { f: "orig", t: "mid2", s: true },
    { f: "mid1", t: "self", s: true },
    { f: "mid2", t: "self", s: true },
    { f: "self", t: "out1", s: false },
    { f: "self", t: "out2", s: false },
    { f: "out2", t: "out3", s: false },
    { f: "mid2", t: "sub1", s: true },
  ]
  const map = Object.fromEntries(nodes.map(n => [n.id, n]))

  const nodeColor = (type: string) => {
    if (type === "self") return "#3D6FA6"
    if (type === "suspect" || type === "origin") return "#C77B4E"
    return "#7FA8C9"
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="rgba(16,35,63,0.2)" />
        </marker>
        <marker id="arrow-s" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="rgba(199,123,78,0.35)" />
        </marker>
      </defs>

      {/* Edges */}
      {edges.map((e, i) => {
        const f = map[e.f], t = map[e.t]
        const dx = t.x - f.x, dy = t.y - f.y
        const len = Math.sqrt(dx * dx + dy * dy)
        const r = e.t === "self" ? 9 : 5
        const ex = t.x - (dx / len) * r
        const ey = t.y - (dy / len) * r
        return (
          <line
            key={i}
            x1={f.x} y1={f.y} x2={ex} y2={ey}
            stroke={e.s ? "rgba(199,123,78,0.3)" : "rgba(16,35,63,0.15)"}
            strokeWidth={1}
            strokeDasharray={e.s ? "4 3" : "none"}
            markerEnd={`url(#${e.s ? "arrow-s" : "arrow"})`}
            className={animated && e.s ? "animate-dash" : ""}
            style={animated && e.s ? { strokeDashoffset: 0 } : {}}
          />
        )
      })}

      {/* Nodes */}
      {nodes.map(n => {
        const isSelf = n.type === "self"
        const c = nodeColor(n.type)
        const r = isSelf ? 9 : 5
        return (
          <g key={n.id}>
            {isSelf && (
              <circle
                cx={n.x} cy={n.y} r={22}
                fill="#3D6FA6" fillOpacity={0.08}
                className="animate-pulse-ring"
              />
            )}
            <circle
              cx={n.x} cy={n.y} r={r}
              fill={isSelf ? "#3D6FA6" : n.type === "suspect" || n.type === "origin" ? "rgba(199,123,78,0.12)" : "rgba(127,168,201,0.15)"}
              stroke={c}
              strokeWidth={isSelf ? 0 : 1}
              strokeOpacity={0.5}
            />
            {detailed && (
              <text
                x={n.x}
                y={n.y + (n.y < 120 ? -14 : 18)}
                textAnchor="middle"
                fontSize={9.5}
                fontFamily="'Noto Sans KR', sans-serif"
                fill={isSelf ? "#3D6FA6" : "rgba(16,35,63,0.5)"}
                fontWeight={isSelf ? "600" : "400"}
              >
                {n.label}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ step, onStepClick, dday }: { step: number; onStepClick: (s: number) => void; dday: number | null }) {
  return (
    <aside
      style={{
        width: 224,
        minWidth: 224,
        background: "#FFFFFF",
        borderLeft: "0.5px solid rgba(16,35,63,0.1)",
        position: "sticky",
        top: 0,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "28px 20px 24px",
      }}
    >
      <div style={{ marginBottom: 28 }}>
        <Wordmark size="sm" />
      </div>

      <div style={{ flex: 1 }}>
        {STEP_LABELS.map((s, i) => {
          const done = i < step
          const active = i === step
          const pending = i > step
          return (
            <button
              key={i}
              onClick={() => i <= step && onStepClick(i)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                width: "100%",
                textAlign: "left",
                background: "none",
                border: "none",
                cursor: i <= step ? "pointer" : "default",
                padding: "9px 0",
                borderRadius: 6,
                opacity: pending ? 0.45 : 1,
                marginBottom: 2,
              }}
            >
              {/* Step badge */}
              <div style={{ flexShrink: 0, marginTop: 1 }}>
                {done ? (
                  <div
                    style={{
                      width: 20, height: 20, borderRadius: "50%",
                      background: "#3D6FA6",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5.5 L4.2 7.5 L8 3" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                ) : active ? (
                  <div
                    style={{
                      width: 20, height: 20, borderRadius: "50%",
                      background: "#3D6FA6",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <span style={{ color: "white", fontSize: 10, fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif" }}>
                      {i}
                    </span>
                  </div>
                ) : (
                  <div
                    style={{
                      width: 20, height: 20, borderRadius: "50%",
                      border: "1px solid rgba(16,35,63,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <span style={{ color: "rgba(16,35,63,0.4)", fontSize: 10, fontWeight: 500, fontFamily: "'Noto Sans KR', sans-serif" }}>
                      {i}
                    </span>
                  </div>
                )}
              </div>

              {/* Labels */}
              <div>
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: active ? 600 : done ? 500 : 400,
                    color: active ? "#3D6FA6" : done ? "#10233F" : "rgba(16,35,63,0.5)",
                    fontFamily: "'Noto Sans KR', sans-serif",
                    lineHeight: 1.3,
                  }}
                >
                  {s.label}
                </div>
                <div style={{ fontSize: 10.5, color: "rgba(16,35,63,0.38)", marginTop: 1, fontFamily: "'Noto Sans KR', sans-serif" }}>
                  {s.sub}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* D-day badge */}
      {dday !== null && (
        <div
          style={{
            marginBottom: 12,
            borderRadius: 8,
            padding: "12px 14px",
            background: dday <= 0 ? "rgba(199,123,78,0.08)" : dday <= 14 ? "rgba(199,123,78,0.06)" : "rgba(61,111,166,0.06)",
            border: `0.5px solid ${dday <= 0 ? "rgba(199,123,78,0.35)" : dday <= 14 ? "rgba(199,123,78,0.25)" : "rgba(61,111,166,0.2)"}`,
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 3, color: dday <= 14 ? "#C77B4E" : "#3D6FA6" }}>
            이의제기 기한
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Noto Serif KR', Georgia, serif", color: dday <= 0 ? "#C77B4E" : dday <= 14 ? "#C77B4E" : "#10233F", letterSpacing: "-0.01em" }}>
            {dday <= 0 ? "기한 도과" : `D-${dday}`}
          </div>
          <div style={{ fontSize: 10, color: "rgba(16,35,63,0.45)", fontFamily: "'Noto Sans KR', sans-serif", marginTop: 2 }}>
            {dday <= 0 ? "채권소멸 가능성 — 금감원 상담 필요" : dday <= 14 ? "임박 — 서류 준비를 서둘러 주세요" : "여유가 있습니다"}
          </div>
        </div>
      )}

      {/* Disclaimer card */}
      <div
        style={{
          background: "rgba(16,35,63,0.04)",
          borderRadius: 8,
          padding: "14px 14px",
          border: "0.5px solid rgba(16,35,63,0.12)",
        }}
      >
        <div style={{ fontSize: 10, color: "#10233F", fontWeight: 600, marginBottom: 6, fontFamily: "'Noto Sans KR', sans-serif", letterSpacing: "0.02em" }}>
          서비스의 한계
        </div>
        <div style={{ fontSize: 10, color: "rgba(16,35,63,0.52)", lineHeight: 1.75, fontFamily: "'Noto Sans KR', sans-serif" }}>
          AI가 초안을 제안하고, 최종 판단은 은행이 합니다. 풀림은 법률 대리인이 아니며 결과를 보장하지 않습니다.
        </div>
        <div
          style={{
            marginTop: 8, paddingTop: 8,
            borderTop: "0.5px solid rgba(16,35,63,0.1)",
            fontSize: 10, color: "rgba(16,35,63,0.52)", lineHeight: 1.75,
            fontFamily: "'Noto Sans KR', sans-serif",
          }}
        >
          업로드한 자료는 소명서 작성에만 사용되며 작성 완료 후 삭제됩니다.
        </div>
      </div>
    </aside>
  )
}

// ── Landing ───────────────────────────────────────────────────────────────────
function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div className="step-section" style={{ maxWidth: 720, margin: "0 auto", padding: "64px 48px 80px" }}>
      {/* Wordmark */}
      <div style={{ marginBottom: 56 }}>
        <Wordmark size="lg" />
      </div>

      {/* Hero */}
      <div style={{ marginBottom: 48 }}>
        <div
          className="font-serif-kr"
          style={{ fontSize: 42, fontWeight: 700, color: "#10233F", lineHeight: 1.25, letterSpacing: "-0.02em", marginBottom: 16 }}
        >
          묶인 계좌,<br />
          <span style={{ color: "#3D6FA6" }}>근거로 풀립니다.</span>
        </div>
        <p
          className="font-sans-kr"
          style={{ fontSize: 16, color: "rgba(16,35,63,0.62)", lineHeight: 1.8, maxWidth: 480 }}
        >
          보이스피싱 피해 여파로 계좌가 부당하게 지급정지 되셨나요?<br />
          거래 내역을 업로드하면 AI가 정상 거래 근거를 분석하고,<br />
          은행에 제출할 소명서를 함께 작성해 드립니다.
        </p>
      </div>

      {/* Graph hero card */}
      <div
        className="card"
        style={{ padding: "32px 40px 28px", marginBottom: 40, position: "relative", overflow: "hidden" }}
      >
        <div style={{ position: "absolute", top: 16, right: 16 }}>
          <span
            style={{
              fontSize: 10, fontFamily: "'Noto Sans KR', sans-serif",
              color: "rgba(16,35,63,0.35)", letterSpacing: "0.08em",
            }}
          >
            거래 흐름 분석 예시
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <TransactionGraph width={480} height={240} animated />
          <div style={{ minWidth: 160 }}>
            <div style={{ marginBottom: 18 }}>
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 7, marginBottom: 6,
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3D6FA6" }} />
                <span style={{ fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif", color: "#10233F", fontWeight: 500 }}>
                  내 계좌 (정상 판정)
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(199,123,78,0.5)" }} />
                <span style={{ fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif", color: "rgba(16,35,63,0.55)" }}>
                  의심 경유 계좌
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 16, height: 1, background: "rgba(16,35,63,0.25)" }} />
                <span style={{ fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif", color: "rgba(16,35,63,0.55)" }}>
                  정상 거래
                </span>
              </div>
            </div>
            <div
              style={{
                background: "rgba(61,111,166,0.08)", borderRadius: 8, padding: "10px 12px",
                border: "0.5px solid rgba(61,111,166,0.2)",
              }}
            >
              <div style={{ fontSize: 10, fontFamily: "'Noto Sans KR', sans-serif", color: "#3D6FA6", fontWeight: 600, marginBottom: 3 }}>
                AI 판정 결과
              </div>
              <div style={{ fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif", color: "#10233F", lineHeight: 1.5 }}>
                단순 경유 계좌<br />정상 거래 패턴 확인
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Process steps */}
      <div style={{ display: "flex", gap: 12, marginBottom: 44 }}>
        {["거래 내역 업로드", "AI 분석 3분", "소명서 초안 생성", "은행 제출"].map((s, i) => (
          <div
            key={i}
            style={{
              flex: 1, background: "rgba(16,35,63,0.04)", borderRadius: 8,
              padding: "12px 14px", border: "0.5px solid rgba(16,35,63,0.1)",
            }}
          >
            <div style={{ fontSize: 10, color: "#3D6FA6", fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 4 }}>
              {String(i + 1).padStart(2, "0")}
            </div>
            <div style={{ fontSize: 11.5, color: "#10233F", fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 500, lineHeight: 1.4 }}>
              {s}
            </div>
          </div>
        ))}
      </div>

      <button className="btn-primary" onClick={onStart} style={{ fontSize: 15, padding: "13px 36px" }}>
        소명서 작성 시작하기
      </button>
    </div>
  )
}

// ── Step 1: Diagnosis Questionnaire ──────────────────────────────────────────
function DiagnosisQuestionnaire({
  onNext,
  onDdayChange,
  onAnswersChange,
}: {
  onNext: () => void
  onDdayChange: (d: number) => void
  onAnswersChange: (a: Record<string, string | string[]>) => void
}) {
  // screen: 0-6 = question, "oos" = out-of-scope, "exit" = account handover, "result" = summary
  const [screen, setScreen] = useState<number | "oos" | "exit" | "result">(0)
  const [ans, setAns] = useState<Record<string, string | string[]>>({})

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
  const currentAns = q ? ans[q.id] : undefined

  const canAdvance = () => {
    if (!q) return false
    if (q.type === "date") return !!(ans[q.id] as string)
    if (q.type === "combo") return !!(ans[`${q.id}_platform`]) && !!(ans[`${q.id}_item`] as string)?.trim()
    if (q.type === "multi") return Array.isArray(ans[q.id]) && (ans[q.id] as string[]).length > 0
    return !!ans[q.id]
  }

  const san = (s: string) => ({ fontFamily: "'Noto Sans KR', sans-serif", color: s })

  // ── OUT-OF-SCOPE screen ────────────────────────────────────────────────────
  if (screen === "oos") return (
    <div className="step-section" style={{ maxWidth: 560, margin: "0 auto", padding: "80px 48px" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(199,123,78,0.1)", border: "0.5px solid rgba(199,123,78,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 6v5M10 14h.01" stroke="#C77B4E" strokeWidth="1.5" strokeLinecap="round"/><circle cx="10" cy="10" r="8" stroke="#C77B4E" strokeWidth="1.2"/></svg>
        </div>
        <div className="font-serif-kr" style={{ fontSize: 22, fontWeight: 700, color: "#10233F", marginBottom: 10 }}>현재 서비스 범위를 벗어난 유형입니다</div>
        <p className="font-sans-kr" style={{ fontSize: 14, color: "rgba(16,35,63,0.55)", lineHeight: 1.8, marginBottom: 24 }}>
          통장협박·통장묶기 유형은 풀림의 현재 MVP 범위에 포함되어 있지 않습니다.<br />
          해당 유형은 별도의 법적 경로가 필요합니다.
        </p>
        <div className="card" style={{ padding: "16px 18px", marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, ...san("#10233F"), marginBottom: 8 }}>권고 경로</div>
          {["금융감독원 민원센터 1332 (평일 09:00–18:00)", "법률구조공단 공익 법률 서비스 132", "경찰청 사이버범죄 신고 시스템 (ecrm.police.go.kr)"].map((t, i) => (
            <div key={i} style={{ fontSize: 13, ...san("rgba(16,35,63,0.6)"), padding: "4px 0", borderBottom: i < 2 ? "0.5px solid rgba(16,35,63,0.07)" : "none" }}>{t}</div>
          ))}
        </div>
        <button className="btn-secondary" onClick={() => setScreen(0)}>← 처음 질문으로 돌아가기</button>
      </div>
    </div>
  )

  // ── EXIT screen (접근매체 양도) ────────────────────────────────────────────
  if (screen === "exit") return (
    <div className="step-section" style={{ maxWidth: 560, margin: "0 auto", padding: "80px 48px" }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(199,123,78,0.1)", border: "0.5px solid rgba(199,123,78,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10h12M10 4l6 6-6 6" stroke="#C77B4E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <div className="font-serif-kr" style={{ fontSize: 22, fontWeight: 700, color: "#10233F", marginBottom: 10 }}>풀림이 도움드리기 어렵습니다</div>
      <p className="font-sans-kr" style={{ fontSize: 14, color: "rgba(16,35,63,0.55)", lineHeight: 1.8, marginBottom: 24 }}>
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
    let ddayColor = "#3D6FA6"
    if (dateStr) {
      const freeze = new Date(dateStr)
      const deadline = new Date(freeze); deadline.setMonth(deadline.getMonth() + 2)
      const today = new Date("2026-08-27")
      dday = Math.ceil((deadline.getTime() - today.getTime()) / 86400000)
      ddayLabel = dday <= 0 ? "기한 도과" : `D-${dday}`
      ddayColor = dday <= 0 ? "#C77B4E" : dday <= 14 ? "#C77B4E" : "#3D6FA6"
    }
    const checklist = getEvidenceChecklist(ans)
    const mustItems = checklist.filter(c => c.priority === "필수")
    return (
      <div className="step-section" style={{ maxWidth: 640, margin: "0 auto", padding: "56px 48px 80px" }}>
        <div style={{ fontSize: 11, color: "#3D6FA6", fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 600, letterSpacing: "0.1em", marginBottom: 8 }}>STEP 1 · 진단 완료</div>
        <h1 className="font-serif-kr" style={{ fontSize: 28, fontWeight: 700, color: "#10233F", marginBottom: 24, letterSpacing: "-0.01em" }}>상황 진단이 완료되었습니다</h1>

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
          <div className="card" style={{ padding: "18px 20px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, ...san("rgba(16,35,63,0.4)"), marginBottom: 6 }}>추정 유형</div>
            <div className="font-serif-kr" style={{ fontSize: 18, fontWeight: 700, color: "#3D6FA6", marginBottom: 4 }}>3자사기</div>
            <div style={{ fontSize: 11.5, ...san("rgba(16,35,63,0.5)"), lineHeight: 1.5 }}>중고거래 사기에 연루된<br />단순 경유 계좌로 추정</div>
          </div>
          <div className="card" style={{ padding: "18px 20px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, ...san("rgba(16,35,63,0.4)"), marginBottom: 6 }}>이의제기 기한</div>
            <div className="font-serif-kr" style={{ fontSize: 22, fontWeight: 700, color: ddayColor, marginBottom: 4 }}>{ddayLabel || "—"}</div>
            <div style={{ fontSize: 11.5, ...san(dday <= 14 ? "#C77B4E" : "rgba(16,35,63,0.5)"), lineHeight: 1.5 }}>
              {dday <= 0 ? "기한 도과 — 금감원 상담 필요" : dday <= 14 ? "임박 — 서두르세요" : "충분한 여유가 있습니다"}
            </div>
          </div>
        </div>

        {/* Evidence preview */}
        <div className="card" style={{ padding: "18px 20px", marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, ...san("#10233F"), marginBottom: 12 }}>
            다음 단계에서 준비하실 자료 — {checklist.length}종
          </div>
          {mustItems.map((item, i) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: i < mustItems.length - 1 ? "0.5px solid rgba(16,35,63,0.07)" : "none" }}>
              <span style={{ fontSize: 9.5, fontWeight: 700, ...san("#3D6FA6"), background: "rgba(61,111,166,0.1)", padding: "2px 7px", borderRadius: 10, whiteSpace: "nowrap" }}>필수</span>
              <span style={{ fontSize: 13, ...san("#10233F") }}>{item.label}</span>
              <span style={{ fontSize: 11, ...san("rgba(16,35,63,0.38)"), marginLeft: "auto" }}>{CAT_LABELS[item.category].title.split(".")[0]}</span>
            </div>
          ))}
          {checklist.filter(c => c.priority !== "필수").length > 0 && (
            <div style={{ fontSize: 12, ...san("rgba(16,35,63,0.4)"), marginTop: 8, paddingTop: 8, borderTop: "0.5px solid rgba(16,35,63,0.07)" }}>
              + 권장·가점 자료 {checklist.filter(c => c.priority !== "필수").length}종은 다음 단계에서 안내됩니다
            </div>
          )}
        </div>

        <button className="btn-primary" onClick={onNext} style={{ fontSize: 14, padding: "13px 32px" }}>
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
    <div className="step-section" style={{ maxWidth: 600, margin: "0 auto", padding: "56px 48px 80px" }}>
      {/* Header */}
      <div style={{ fontSize: 11, ...san("#3D6FA6"), fontWeight: 600, letterSpacing: "0.1em", marginBottom: 4 }}>
        STEP 1 · 상황 진단
      </div>

      {/* Sub-progress */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
        <div style={{ flex: 1, height: 3, borderRadius: 2, background: "rgba(16,35,63,0.08)", overflow: "hidden" }}>
          <div style={{ width: `${((qNum + 1) / QUESTIONS.length) * 100}%`, height: "100%", background: "#3D6FA6", borderRadius: 2, transition: "width 0.3s ease" }} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, ...san("rgba(16,35,63,0.45)"), whiteSpace: "nowrap" }}>Q{qNum + 1} / {QUESTIONS.length}</span>
      </div>

      {/* Question */}
      <div style={{ fontSize: 11.5, fontWeight: 600, ...san("#3D6FA6"), marginBottom: 8 }}>{q.tag}</div>
      <h2 className="font-serif-kr" style={{ fontSize: 24, fontWeight: 700, color: "#10233F", marginBottom: q.note ? 10 : 24, lineHeight: 1.35, letterSpacing: "-0.01em" }}>
        {q.question}
      </h2>
      {q.note && (
        <p className="font-sans-kr" style={{ fontSize: 13, color: "rgba(16,35,63,0.52)", lineHeight: 1.75, marginBottom: 24 }}>{q.note}</p>
      )}

      {/* Single-select */}
      {q.type === "single" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 36 }}>
          {q.options!.map(opt => {
            const sel = ans[q.id] === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => { set(q.id, opt.value); advance(qNum, opt.value) }}
                style={{
                  textAlign: "left", padding: "14px 18px",
                  background: sel ? "rgba(61,111,166,0.06)" : "#FFFFFF",
                  border: sel ? "1px solid rgba(61,111,166,0.45)" : "0.5px solid #E4E4E1",
                  borderRadius: 10, cursor: "pointer", transition: "all 0.12s",
                  display: "flex", alignItems: "center", gap: 12,
                }}
              >
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: sel ? "none" : "1.5px solid rgba(16,35,63,0.2)", background: sel ? "#3D6FA6" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {sel && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M2 4.5L3.8 6.3L7 3" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span style={{ fontSize: 13.5, fontWeight: sel ? 600 : 400, ...san(sel ? "#3D6FA6" : "#10233F") }}>{opt.label}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Multi-select */}
      {q.type === "multi" && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
            {q.options!.map(opt => {
              const sel = ((ans[q.id] as string[]) ?? []).includes(opt.value)
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleMulti(opt.value)}
                  style={{
                    textAlign: "left", padding: "13px 18px",
                    background: sel ? "rgba(61,111,166,0.06)" : "#FFFFFF",
                    border: sel ? "1px solid rgba(61,111,166,0.4)" : "0.5px solid #E4E4E1",
                    borderRadius: 10, cursor: "pointer", transition: "all 0.12s",
                    display: "flex", alignItems: "center", gap: 12,
                  }}
                >
                  <div style={{ width: 16, height: 16, borderRadius: 4, border: sel ? "none" : "1.5px solid rgba(16,35,63,0.2)", background: sel ? "#3D6FA6" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {sel && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <span style={{ fontSize: 13.5, fontWeight: sel ? 600 : 400, ...san(sel ? "#3D6FA6" : "#10233F") }}>{opt.label}</span>
                </button>
              )
            })}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {qNum > 0 && <button className="btn-secondary" onClick={() => setScreen(qNum - 1)}>← 이전</button>}
            <button className="btn-primary" onClick={() => advance(qNum)} disabled={!canAdvance()} style={{ opacity: canAdvance() ? 1 : 0.35 }}>다음 →</button>
          </div>
        </>
      )}

      {/* Combo: platform chips + item text */}
      {q.type === "combo" && (
        <>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, ...san("rgba(16,35,63,0.5)"), marginBottom: 8 }}>판매 플랫폼</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {q.options!.map(opt => {
                const sel = ans[`${q.id}_platform`] === opt.value
                return (
                  <button key={opt.value} onClick={() => set(`${q.id}_platform`, opt.value)}
                    style={{ padding: "7px 16px", borderRadius: 20, border: sel ? "1px solid rgba(61,111,166,0.45)" : "0.5px solid #E4E4E1", background: sel ? "rgba(61,111,166,0.08)" : "#FFFFFF", cursor: "pointer", fontSize: 13, fontWeight: sel ? 600 : 400, ...san(sel ? "#3D6FA6" : "#10233F"), transition: "all 0.12s" }}
                  >{opt.label}</button>
                )
              })}
            </div>
          </div>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 600, ...san("rgba(16,35,63,0.5)"), marginBottom: 8 }}>판매 물품</div>
            <input
              value={(ans[`${q.id}_item`] as string) ?? ""}
              onChange={e => set(`${q.id}_item`, e.target.value)}
              placeholder="예: 아이패드 에어 5세대, 나이키 운동화"
              style={{ width: "100%", padding: "12px 14px", border: "0.5px solid #E4E4E1", borderRadius: 10, fontSize: 13.5, ...san("#10233F"), outline: "none", background: "#FFFFFF", boxSizing: "border-box" }}
              onFocus={e => (e.target.style.borderColor = "rgba(61,111,166,0.5)")}
              onBlur={e => (e.target.style.borderColor = "#E4E4E1")}
            />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {qNum > 0 && <button className="btn-secondary" onClick={() => setScreen(qNum - 1)}>← 이전</button>}
            <button className="btn-primary" onClick={() => advance(qNum)} disabled={!canAdvance()} style={{ opacity: canAdvance() ? 1 : 0.35 }}>다음 →</button>
          </div>
        </>
      )}

      {/* Date */}
      {q.type === "date" && (
        <>
          <div style={{ marginBottom: 16 }}>
            <input
              type="date"
              value={(ans[q.id] as string) ?? ""}
              onChange={e => set(q.id, e.target.value)}
              max="2026-08-27"
              style={{ padding: "12px 14px", border: "0.5px solid #E4E4E1", borderRadius: 10, fontSize: 14, ...san("#10233F"), outline: "none", background: "#FFFFFF", width: "100%", boxSizing: "border-box" }}
              onFocus={e => (e.target.style.borderColor = "rgba(61,111,166,0.5)")}
              onBlur={e => (e.target.style.borderColor = "#E4E4E1")}
            />
          </div>
          {ans[q.id] && (() => {
            const freeze = new Date(ans[q.id] as string)
            const deadline = new Date(freeze); deadline.setMonth(deadline.getMonth() + 2)
            const today = new Date("2026-08-27")
            const d = Math.ceil((deadline.getTime() - today.getTime()) / 86400000)
            const label = d <= 0 ? "기한 도과" : `D-${d}`
            const col = d <= 0 ? "#C77B4E" : d <= 14 ? "#C77B4E" : "#3D6FA6"
            return (
              <div style={{ padding: "12px 14px", borderRadius: 8, background: d <= 14 ? "rgba(199,123,78,0.06)" : "rgba(61,111,166,0.06)", border: `0.5px solid ${d <= 14 ? "rgba(199,123,78,0.25)" : "rgba(61,111,166,0.2)"}`, marginBottom: 24 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: col, fontFamily: "'Noto Serif KR', serif" }}>{label}</span>
                <span style={{ fontSize: 12, ...san("rgba(16,35,63,0.5)"), marginLeft: 10 }}>
                  {d <= 0 ? "채권소멸 가능 — 즉시 금감원 상담을 권고드립니다" : d <= 14 ? `기한까지 ${d}일 — 서류 준비를 서두르세요` : `${deadline.toLocaleDateString("ko-KR")}까지`}
                </span>
              </div>
            )
          })()}
          <div style={{ display: "flex", gap: 10 }}>
            {qNum > 0 && <button className="btn-secondary" onClick={() => setScreen(qNum - 1)}>← 이전</button>}
            <button className="btn-primary" onClick={() => advance(qNum)} disabled={!canAdvance()} style={{ opacity: canAdvance() ? 1 : 0.35 }}>다음 →</button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Step 2: Evidence Upload ────────────────────────────────────────────────────
function DataUpload({ answers, onNext }: { answers: Record<string, string | string[]>; onNext: () => void }) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [dragging, setDragging] = useState(false)
  const [memo, setMemo] = useState("")
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
  const inputRef = useRef<HTMLInputElement>(null)

  const checklist = getEvidenceChecklist(answers)
  const mustItems = checklist.filter(c => c.priority === "필수")
  const checkedMust = mustItems.filter(m => checkedItems[m.id]).length
  const gaugePercent = mustItems.length > 0 ? Math.round((checkedMust / mustItems.length) * 100) : 0

  const addFile = (name: string) => {
    setFiles(prev => { if (prev.find(f => f.name === name)) return prev; return [...prev, { name, size: "2.3 MB", status: "loading" }] })
    setTimeout(() => setFiles(prev => prev.map(f => f.name === name ? { ...f, status: "done" } : f)), 1100)
  }

  const catOrder: Array<"A" | "B" | "C" | "D"> = ["D", "A", "B", "C"]

  const priorityColor = (p: string) => p === "필수" ? { bg: "rgba(61,111,166,0.1)", color: "#3D6FA6" } : p === "권장" ? { bg: "rgba(16,35,63,0.08)", color: "rgba(16,35,63,0.6)" } : { bg: "rgba(199,123,78,0.1)", color: "#C77B4E" }

  return (
    <div className="step-section" style={{ maxWidth: 700, margin: "0 auto", padding: "56px 48px 80px" }}>
      <div style={{ fontSize: 11, color: "#3D6FA6", fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 600, letterSpacing: "0.1em", marginBottom: 8 }}>STEP 2</div>
      <h1 className="font-serif-kr" style={{ fontSize: 28, fontWeight: 700, color: "#10233F", marginBottom: 8, letterSpacing: "-0.01em" }}>
        소명 자료를 올려주세요
      </h1>
      <p className="font-sans-kr" style={{ fontSize: 14, color: "rgba(16,35,63,0.55)", marginBottom: 28, lineHeight: 1.7 }}>
        진단 결과를 바탕으로 준비하실 자료 목록을 정리했습니다.<br />
        필수 항목부터 순서대로 업로드하시면 5영업일 심사 트랙에 진입할 수 있어요.
      </p>

      {/* Completeness gauge */}
      <div className="card" style={{ padding: "16px 20px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif", color: "#10233F" }}>완결성 게이지</span>
          <span style={{ fontSize: 12.5, fontWeight: 700, fontFamily: "'Noto Sans KR', sans-serif", color: gaugePercent >= 75 ? "#3D6FA6" : "rgba(16,35,63,0.45)" }}>
            {gaugePercent}% — {gaugePercent >= 100 ? "5영업일 트랙 진입 가능" : gaugePercent >= 75 ? "거의 준비됐어요" : `필수 ${checkedMust}/${mustItems.length} 확인됨`}
          </span>
        </div>
        <div style={{ height: 6, background: "rgba(16,35,63,0.08)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ width: `${gaugePercent}%`, height: "100%", background: gaugePercent >= 75 ? "#3D6FA6" : "#7FA8C9", borderRadius: 3, transition: "width 0.3s ease" }} />
        </div>
        {gaugePercent >= 75 && (
          <div style={{ fontSize: 11, color: "#3D6FA6", fontFamily: "'Noto Sans KR', sans-serif", marginTop: 6 }}>
            금감원 2026.5 표준화 기준 충족 — 충분한 소명자료 제출 시 5영업일 내 심사결과 통보
          </div>
        )}
      </div>

      {/* Evidence checklist by category */}
      {catOrder.map(cat => {
        const items = checklist.filter(c => c.category === cat)
        if (items.length === 0) return null
        const catInfo = CAT_LABELS[cat]
        return (
          <div key={cat} style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(61,111,166,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#3D6FA6", fontFamily: "'Noto Sans KR', sans-serif" }}>{cat}</span>
              </div>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#10233F", fontFamily: "'Noto Sans KR', sans-serif" }}>{catInfo.title}</span>
                <span style={{ fontSize: 11.5, color: "rgba(16,35,63,0.45)", fontFamily: "'Noto Sans KR', sans-serif", marginLeft: 8 }}>{catInfo.desc}</span>
              </div>
            </div>
            <div className="card" style={{ padding: "4px 0" }}>
              {items.map((item, i) => {
                const pc = priorityColor(item.priority)
                const checked = !!checkedItems[item.id]
                return (
                  <label
                    key={item.id}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 12,
                      padding: "11px 16px",
                      borderBottom: i < items.length - 1 ? "0.5px solid rgba(16,35,63,0.07)" : "none",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      onClick={() => setCheckedItems(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                      style={{ width: 18, height: 18, borderRadius: 4, border: checked ? "none" : "1.5px solid rgba(16,35,63,0.22)", background: checked ? "#3D6FA6" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, cursor: "pointer" }}
                    >
                      {checked && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 9.5, fontWeight: 700, color: pc.color, background: pc.bg, padding: "1px 7px", borderRadius: 10, fontFamily: "'Noto Sans KR', sans-serif" }}>{item.priority}</span>
                        <span style={{ fontSize: 13, fontWeight: 500, color: checked ? "rgba(16,35,63,0.35)" : "#10233F", fontFamily: "'Noto Sans KR', sans-serif", textDecoration: checked ? "line-through" : "none" }}>{item.label}</span>
                      </div>
                      <span style={{ fontSize: 11.5, color: "rgba(16,35,63,0.42)", fontFamily: "'Noto Sans KR', sans-serif" }}>{item.description}</span>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Drop zone */}
      <div style={{ marginTop: 24, marginBottom: 16 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#10233F", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 8 }}>파일 업로드</div>
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); Array.from(e.dataTransfer.files).forEach(f => addFile(f.name)) }}
          onClick={() => inputRef.current?.click()}
          style={{ border: dragging ? "1.5px dashed #3D6FA6" : "1.5px dashed rgba(16,35,63,0.2)", borderRadius: 12, background: dragging ? "rgba(61,111,166,0.04)" : "rgba(16,35,63,0.02)", padding: "28px 24px", textAlign: "center", cursor: "pointer", transition: "all 0.15s", marginBottom: 14 }}
        >
          <input ref={inputRef} type="file" multiple style={{ display: "none" }} onChange={e => Array.from(e.target.files ?? []).forEach(f => addFile(f.name))} />
          <div style={{ fontSize: 13, fontFamily: "'Noto Sans KR', sans-serif", color: "#10233F", fontWeight: 500, marginBottom: 3 }}>파일을 끌어다 놓거나 클릭해서 선택</div>
          <div style={{ fontSize: 11.5, color: "rgba(16,35,63,0.4)", fontFamily: "'Noto Sans KR', sans-serif" }}>CSV, XLSX, PDF, JPG, PNG — 파일당 최대 20MB</div>
        </div>

        {files.length > 0 && (
          <div className="card" style={{ padding: "4px 0", marginBottom: 16 }}>
            {files.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", borderBottom: i < files.length - 1 ? "0.5px solid rgba(16,35,63,0.07)" : "none" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500, color: "#10233F", fontFamily: "'Noto Sans KR', sans-serif" }}>{f.name}</div>
                  <div style={{ fontSize: 10.5, color: "rgba(16,35,63,0.4)", fontFamily: "'Noto Sans KR', sans-serif" }}>{f.size}</div>
                </div>
                {f.status === "loading"
                  ? <span style={{ fontSize: 11, color: "#3D6FA6", fontFamily: "'Noto Sans KR', sans-serif" }}>업로드 중…</span>
                  : <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="rgba(61,111,166,0.12)"/><path d="M5 8.2L7 10.2L11 6.2" stroke="#3D6FA6" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                }
                <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(16,35,63,0.3)", fontSize: 16, lineHeight: 1 }}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Freetext memo */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#10233F", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 4 }}>직접 전달하고 싶은 내용</div>
        <div style={{ fontSize: 12, color: "rgba(16,35,63,0.5)", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 8 }}>파일로 설명하기 어려운 거래 배경, 관계, 당시 상황 등을 자유롭게 적어주세요.</div>
        <div style={{ position: "relative" }}>
          <textarea value={memo} onChange={e => setMemo(e.target.value)} maxLength={800}
            placeholder="예: 해당 금액은 당근마켓에서 아이패드를 판매하고 받은 대금입니다. 채팅 상대가 '동생 계좌로 보낸다'고 해서 이름이 달랐지만 당시엔 의심하지 않았습니다."
            style={{ width: "100%", height: 112, padding: "13px 16px 28px", border: "0.5px solid rgba(16,35,63,0.18)", borderRadius: 10, fontFamily: "'Noto Sans KR', sans-serif", fontSize: 13, color: "#10233F", background: "#FFFFFF", resize: "none", outline: "none", lineHeight: 1.7, boxSizing: "border-box" }}
            onFocus={e => (e.target.style.borderColor = "rgba(61,111,166,0.5)")}
            onBlur={e => (e.target.style.borderColor = "rgba(16,35,63,0.18)")}
          />
          <div style={{ position: "absolute", bottom: 9, right: 14, fontSize: 10.5, color: "rgba(16,35,63,0.3)", fontFamily: "'Noto Sans KR', sans-serif" }}>{memo.length} / 800</div>
        </div>
      </div>

      <button className="btn-primary" onClick={onNext} style={{ fontSize: 14, padding: "13px 32px" }}>AI 분석 시작 →</button>
    </div>
  )
}

// ── Step 3: AI Analysis ───────────────────────────────────────────────────────
function AnalysisResult({ onNext }: { onNext: () => void }) {
  const evidence = [
    { label: "지속 거래 관계 확인", detail: "거래 상대방과 2023.04 ~ 현재 37회 반복 거래 내역 확인", verdict: "정상" },
    { label: "세금계산서 대응 입금", detail: "세금계산서 발행 7일 내 입금, 금액 일치율 100%", verdict: "정상" },
    { label: "자금 체류 패턴", detail: "입금 후 평균 22일 체류 후 생활비·임대료로 소비", verdict: "정상" },
    { label: "피의 자금 접점", detail: "경유 계좌 2단계 거리, 직접 거래 아님", verdict: "주의" },
  ]

  return (
    <div className="step-section" style={{ maxWidth: 860, margin: "0 auto", padding: "56px 48px 80px" }}>
      <div style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: "#3D6FA6", fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 600, letterSpacing: "0.1em" }}>
          STEP 3
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
        <h1 className="font-serif-kr" style={{ fontSize: 28, fontWeight: 700, color: "#10233F", letterSpacing: "-0.01em" }}>
          AI 분석 결과
        </h1>
        <span
          style={{
            fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif",
            background: "rgba(61,111,166,0.1)", color: "#3D6FA6",
            border: "0.5px solid rgba(61,111,166,0.3)", padding: "3px 10px", borderRadius: 20, fontWeight: 600,
          }}
        >
          정상 거래로 판정
        </span>
      </div>
      <p className="font-sans-kr" style={{ fontSize: 14, color: "rgba(16,35,63,0.55)", marginBottom: 36, lineHeight: 1.7 }}>
        업로드하신 거래 내역과 첨부 자료를 바탕으로 계좌 거래 패턴을 분석했습니다.
      </p>

      {/* Main analysis grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, marginBottom: 24 }}>
        {/* Graph panel */}
        <div className="card" style={{ padding: "28px 28px 20px" }}>
          <div style={{ fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif", color: "rgba(16,35,63,0.45)", marginBottom: 16, letterSpacing: "0.04em" }}>
            거래 흐름 시각화
          </div>
          <TransactionGraph width={440} height={220} detailed animated />
          <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
            {[
              { c: "#3D6FA6", label: "내 계좌 (분석 대상)" },
              { c: "rgba(199,123,78,0.5)", label: "의심 경유 계좌" },
              { c: "rgba(16,35,63,0.25)", label: "정상 수신 계좌" },
            ].map((l, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.c }} />
                <span style={{ fontSize: 10.5, color: "rgba(16,35,63,0.5)", fontFamily: "'Noto Sans KR', sans-serif" }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Evidence list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="card" style={{ padding: "18px 20px" }}>
            <div style={{ fontSize: 11, color: "rgba(16,35,63,0.4)", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 10, letterSpacing: "0.04em" }}>
              종합 판정
            </div>
            <div className="font-serif-kr" style={{ fontSize: 22, fontWeight: 700, color: "#3D6FA6", marginBottom: 4 }}>
              단순 경유 계좌
            </div>
            <div style={{ fontSize: 12, color: "rgba(16,35,63,0.55)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.6 }}>
              의심 자금과 직접 거래 없음. 정상 사업 거래 패턴 확인. 소명 성공 가능성 높음.
            </div>
          </div>

          <div className="card" style={{ padding: "18px 20px" }}>
            <div style={{ fontSize: 11, color: "rgba(16,35,63,0.4)", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 10 }}>
              핵심 수치
            </div>
            {[
              { label: "분석된 거래", val: "143건" },
              { label: "정상 패턴 일치율", val: "94.4%" },
              { label: "의심 자금 접점", val: "2단계 간접" },
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 2 ? "0.5px solid rgba(16,35,63,0.07)" : "none" }}>
                <span style={{ fontSize: 12, color: "rgba(16,35,63,0.5)", fontFamily: "'Noto Sans KR', sans-serif" }}>{r.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#10233F", fontFamily: "'Noto Sans KR', sans-serif" }}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Evidence cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 36 }}>
        {evidence.map((e, i) => (
          <div key={i} className="card" style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "#10233F", fontFamily: "'Noto Sans KR', sans-serif" }}>
                {e.label}
              </span>
              <span
                style={{
                  fontSize: 10, fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 600,
                  color: e.verdict === "정상" ? "#3D6FA6" : "#C77B4E",
                  background: e.verdict === "정상" ? "rgba(61,111,166,0.1)" : "rgba(199,123,78,0.1)",
                  padding: "2px 7px", borderRadius: 10,
                }}
              >
                {e.verdict}
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: "rgba(16,35,63,0.5)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.5 }}>
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

// ── Step 4: Document Editor ───────────────────────────────────────────────────
function DocumentEditor({ onNext }: { onNext: () => void }) {
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
    <div className="step-section" style={{ padding: "56px 0 0", height: "100%" }}>
      <div style={{ padding: "0 48px", marginBottom: 24 }}>
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: "#3D6FA6", fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 600, letterSpacing: "0.1em" }}>
            STEP 4
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <h1 className="font-serif-kr" style={{ fontSize: 28, fontWeight: 700, color: "#10233F", letterSpacing: "-0.01em" }}>
            소명서 초안 편집
          </h1>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-secondary" style={{ fontSize: 13 }}>인쇄 미리보기</button>
            <button className="btn-primary" onClick={onNext} style={{ fontSize: 13 }}>
              완성 — 제출 지원으로
            </button>
          </div>
        </div>
        <p className="font-sans-kr" style={{ fontSize: 13.5, color: "rgba(16,35,63,0.5)", marginTop: 6 }}>
          문서를 직접 수정하거나, 우측 채팅으로 AI에게 수정을 요청하세요.
        </p>
      </div>

      {/* Editor + Chat split */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", height: "calc(100vh - 200px)", borderTop: "0.5px solid rgba(16,35,63,0.1)" }}>
        {/* Document editor */}
        <div style={{ padding: "28px 32px 28px 48px", overflowY: "auto", background: "#FFFFFF" }}>
          <div
            style={{
              background: "white",
              borderRadius: 4,
              boxShadow: "0 1px 4px rgba(16,35,63,0.06)",
              padding: "52px 56px",
              minHeight: 900,
            }}
          >
            <textarea
              value={doc}
              onChange={e => setDoc(e.target.value)}
              style={{
                width: "100%",
                minHeight: 800,
                border: "none",
                outline: "none",
                resize: "none",
                fontFamily: "'Noto Sans KR', sans-serif",
                fontSize: 13.5,
                lineHeight: 2,
                color: "#10233F",
                background: "transparent",
              }}
            />
          </div>
        </div>

        {/* Chat panel */}
        <div
          style={{
            borderLeft: "0.5px solid rgba(16,35,63,0.1)",
            display: "flex", flexDirection: "column",
            background: "#FFFFFF",
          }}
        >
          <div style={{ padding: "18px 20px 14px", borderBottom: "0.5px solid rgba(16,35,63,0.08)" }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "#10233F", fontFamily: "'Noto Sans KR', sans-serif" }}>
              AI 편집 도우미
            </div>
            <div style={{ fontSize: 11, color: "rgba(16,35,63,0.4)", fontFamily: "'Noto Sans KR', sans-serif", marginTop: 2 }}>
              특정 문단 수정 요청 · 어조 변경 · 내용 보강
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ marginBottom: 12, display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div
                  style={{
                    maxWidth: "84%",
                    padding: "9px 13px",
                    borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                    background: m.role === "user" ? "#3D6FA6" : "rgba(16,35,63,0.06)",
                    color: m.role === "user" ? "white" : "#10233F",
                    fontSize: 12,
                    fontFamily: "'Noto Sans KR', sans-serif",
                    lineHeight: 1.65,
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Quick prompts */}
          <div style={{ padding: "8px 16px 0" }}>
            {["2번 항목 더 자세히 써줘", "어조를 더 정중하게", "첨부 자료 언급 추가"].map(q => (
              <button
                key={q}
                onClick={() => { setInput(q); }}
                style={{
                  fontSize: 11, background: "rgba(16,35,63,0.04)", border: "0.5px solid rgba(16,35,63,0.12)",
                  borderRadius: 6, padding: "4px 9px", cursor: "pointer",
                  color: "rgba(16,35,63,0.55)", fontFamily: "'Noto Sans KR', sans-serif",
                  marginBottom: 5, marginRight: 5, display: "inline-block",
                }}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding: "12px 16px 16px", borderTop: "0.5px solid rgba(16,35,63,0.08)", marginTop: 8 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="수정 요청을 입력하세요…"
                style={{
                  flex: 1, border: "0.5px solid rgba(16,35,63,0.18)", borderRadius: 8,
                  padding: "9px 12px", fontSize: 12.5,
                  fontFamily: "'Noto Sans KR', sans-serif", color: "#10233F",
                  background: "white", outline: "none",
                }}
              />
              <button
                onClick={sendMessage}
                style={{
                  background: "#3D6FA6", border: "none", borderRadius: 8,
                  width: 36, height: 36, display: "flex", alignItems: "center",
                  justifyContent: "center", cursor: "pointer", flexShrink: 0,
                }}
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

// ── Step 5: Submission ────────────────────────────────────────────────────────
function SubmissionSupport() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const checklist = [
    { id: "doc", label: "소명서 (풀림 AI 작성본)" },
    { id: "tx",  label: "거래 내역서 (최소 3개월치)" },
    { id: "tax", label: "세금계산서 또는 입금 근거 자료" },
    { id: "biz", label: "사업자등록증 또는 신분증 사본" },
    { id: "etc", label: "기타 거래 계약서 또는 용역 확인서" },
  ]
  const banks = [
    { name: "국민은행", dept: "여신거래지원팀", tel: "1588-9999", days: "평일 09:00–18:00" },
    { name: "신한은행", dept: "고객서비스팀",   tel: "1544-8000", days: "평일 09:00–18:00" },
    { name: "우리은행", dept: "고객행복센터",   tel: "1588-5000", days: "평일 09:00–18:00" },
    { name: "하나은행", dept: "고객상담팀",     tel: "1599-1111", days: "평일 09:00–18:00" },
  ]
  const doneCount = Object.values(checked).filter(Boolean).length

  return (
    <div className="step-section" style={{ maxWidth: 700, margin: "0 auto", padding: "56px 48px 80px" }}>
      <div style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: "#3D6FA6", fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 600, letterSpacing: "0.1em" }}>
          STEP 5
        </span>
      </div>
      <h1 className="font-serif-kr" style={{ fontSize: 28, fontWeight: 700, color: "#10233F", marginBottom: 8, letterSpacing: "-0.01em" }}>
        제출 지원
      </h1>
      <p className="font-sans-kr" style={{ fontSize: 14, color: "rgba(16,35,63,0.55)", marginBottom: 36, lineHeight: 1.7 }}>
        아래 체크리스트를 확인하고, 은행 창구 또는 고객센터에 소명서와 첨부 자료를 함께 제출하세요.
      </p>

      {/* Download bar */}
      <div
        style={{
          background: "rgba(61,111,166,0.07)", border: "0.5px solid rgba(61,111,166,0.3)",
          borderRadius: 10, padding: "16px 20px", display: "flex", alignItems: "center",
          justifyContent: "space-between", marginBottom: 28,
        }}
      >
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: "#10233F", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 2 }}>
            소명서 — 홍길동_20260824.pdf
          </div>
          <div style={{ fontSize: 11.5, color: "#3D6FA6", fontFamily: "'Noto Sans KR', sans-serif" }}>
            AI 분석 근거 포함 · A4 3쪽 분량
          </div>
        </div>
        <button className="btn-primary" style={{ fontSize: 13 }}>
          PDF 다운로드
        </button>
      </div>

      {/* Checklist */}
      <div className="card" style={{ padding: "8px 0", marginBottom: 28 }}>
        <div style={{ padding: "14px 20px 10px", borderBottom: "0.5px solid rgba(16,35,63,0.07)", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "#10233F", fontFamily: "'Noto Sans KR', sans-serif" }}>제출 체크리스트</span>
          <span style={{ fontSize: 11.5, color: "#3D6FA6", fontFamily: "'Noto Sans KR', sans-serif" }}>{doneCount}/{checklist.length} 완료</span>
        </div>
        {checklist.map(c => (
          <label
            key={c.id}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "11px 20px",
              borderBottom: "0.5px solid rgba(16,35,63,0.05)",
              cursor: "pointer",
            }}
          >
            <div
              onClick={() => setChecked(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
              style={{
                width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                border: checked[c.id] ? "none" : "1.5px solid rgba(16,35,63,0.25)",
                background: checked[c.id] ? "#3D6FA6" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              {checked[c.id] && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5.2L4 7.2L8 3.2" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span style={{
              fontSize: 13, fontFamily: "'Noto Sans KR', sans-serif",
              color: checked[c.id] ? "rgba(16,35,63,0.35)" : "#10233F",
              textDecoration: checked[c.id] ? "line-through" : "none",
              transition: "all 0.15s",
            }}>
              {c.label}
            </span>
          </label>
        ))}
      </div>

      {/* Bank contacts */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "#10233F", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 12 }}>
          주요 은행 이의제기 접수처
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {banks.map(b => (
            <div key={b.name} className="card" style={{ padding: "14px 16px" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#10233F", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 3 }}>{b.name}</div>
              <div style={{ fontSize: 11, color: "rgba(16,35,63,0.45)", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 5 }}>{b.dept}</div>
              <div style={{ fontSize: 12.5, color: "#3D6FA6", fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif" }}>{b.tel}</div>
              <div style={{ fontSize: 10.5, color: "rgba(16,35,63,0.35)", fontFamily: "'Noto Sans KR', sans-serif", marginTop: 2 }}>{b.days}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Legal note */}
      <div
        style={{
          marginTop: 28, background: "rgba(199,123,78,0.06)", border: "0.5px solid rgba(199,123,78,0.25)",
          borderRadius: 8, padding: "12px 16px",
        }}
      >
        <div style={{ fontSize: 11, color: "#C77B4E", fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 3 }}>
          유의사항
        </div>
        <div style={{ fontSize: 11.5, color: "rgba(16,35,63,0.55)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.65 }}>
          본 소명서는 AI가 제안한 초안이며, 법적 효력을 보장하지 않습니다. 은행의 최종 판단에 따라 결과가 달라질 수 있으며, 복잡한 사안은 법률 전문가의 검토를 권고드립니다.
        </div>
      </div>
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────
// ── Onboarding Modal ─────────────────────────────────────────────────────────
const MODAL_SLIDES = [
  {
    tag: "소명서 작성, 이렇게 달라져요",
    headline: "혼자 쓰면 하루,\n풀림이면 15분",
    body: "거래 내역만 올리면\n소명서·근거 자료를 대신 채워드려요.\n남은 건 확인뿐이에요.",
  },
  {
    tag: "하는 일은 세 가지뿐",
    headline: "거래 내역을\n올리기만 하면 돼요",
    body: "거래 내역서, 세금계산서, 계약서—\n완벽하지 않아도 괜찮아요.\nAI가 정상 거래 근거를 찾아드려요.",
  },
  {
    tag: "준비는 끝났어요",
    headline: "소명서 초안이\n바로 완성됩니다",
    body: "AI가 초안을 작성하고,\n직접 수정하거나 채팅으로 요청할 수 있어요.\n작성 완료 후 자료는 즉시 삭제됩니다.",
  },
]

function SlideIllustration1() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 420 280" fill="none" style={{ display: "block" }}>
      {/* Before card */}
      <rect x="28" y="48" width="158" height="188" rx="14" fill="white" stroke="rgba(16,35,63,0.1)" strokeWidth="1" />
      {/* Clock - before (messy, lots of hours) */}
      <circle cx="107" cy="82" r="22" fill="rgba(16,35,63,0.06)" stroke="rgba(16,35,63,0.18)" strokeWidth="1" />
      <line x1="107" y1="82" x2="107" y2="65" stroke="rgba(16,35,63,0.35)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="107" y1="82" x2="118" y2="78" stroke="rgba(16,35,63,0.35)" strokeWidth="1.5" strokeLinecap="round" />
      {/* Scribbled lines - manual writing */}
      <rect x="44" y="124" width="126" height="8" rx="2" fill="rgba(16,35,63,0.1)" />
      <rect x="44" y="140" width="96" height="8" rx="2" fill="rgba(16,35,63,0.1)" />
      <rect x="44" y="156" width="112" height="8" rx="2" fill="rgba(16,35,63,0.1)" />
      <rect x="44" y="172" width="80" height="8" rx="2" fill="rgba(16,35,63,0.1)" />
      {/* Pencil icon */}
      <g transform="translate(88,108) rotate(-30)">
        <rect x="0" y="0" width="8" height="22" rx="1.5" fill="#C77B4E" opacity="0.7" />
        <polygon points="0,22 8,22 4,28" fill="rgba(16,35,63,0.35)" />
        <rect x="0" y="0" width="8" height="5" rx="1.5" fill="rgba(16,35,63,0.2)" />
      </g>
      {/* Time label */}
      <rect x="60" y="202" width="94" height="22" rx="11" fill="rgba(16,35,63,0.07)" />
      <text x="107" y="218" textAnchor="middle" fontSize="11" fontFamily="'Noto Sans KR', sans-serif" fill="rgba(16,35,63,0.55)" fontWeight="500">수 시간 소요</text>

      {/* Arrow */}
      <path d="M196 144 L224 144" stroke="rgba(61,111,166,0.4)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M218 138 L224 144 L218 150" stroke="rgba(61,111,166,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* After card */}
      <rect x="234" y="48" width="158" height="188" rx="14" fill="white" stroke="rgba(61,111,166,0.2)" strokeWidth="1" />
      {/* Clock - after (fast) */}
      <circle cx="313" cy="82" r="22" fill="rgba(61,111,166,0.08)" stroke="rgba(61,111,166,0.3)" strokeWidth="1" />
      <line x1="313" y1="82" x2="313" y2="66" stroke="#3D6FA6" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="313" y1="82" x2="322" y2="86" stroke="#3D6FA6" strokeWidth="1.5" strokeLinecap="round" />
      {/* Clean document lines */}
      <rect x="250" y="124" width="126" height="8" rx="2" fill="rgba(61,111,166,0.2)" />
      <rect x="250" y="140" width="100" height="8" rx="2" fill="rgba(61,111,166,0.15)" />
      <rect x="250" y="156" width="118" height="8" rx="2" fill="rgba(61,111,166,0.2)" />
      <rect x="250" y="172" width="88" height="8" rx="2" fill="rgba(61,111,166,0.12)" />
      {/* Check badge */}
      <circle cx="349" cy="116" r="10" fill="#3D6FA6" />
      <path d="M344.5 116.5L347.5 119.5L353.5 113" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Time label */}
      <rect x="268" y="202" width="90" height="22" rx="11" fill="rgba(61,111,166,0.1)" />
      <text x="313" y="218" textAnchor="middle" fontSize="11" fontFamily="'Noto Sans KR', sans-serif" fill="#3D6FA6" fontWeight="600">약 15분</text>

      {/* Labels */}
      <text x="107" y="250" textAnchor="middle" fontSize="11" fontFamily="'Noto Sans KR', sans-serif" fill="rgba(16,35,63,0.45)">직접 작성할 때</text>
      <text x="313" y="250" textAnchor="middle" fontSize="11" fontFamily="'Noto Sans KR', sans-serif" fill="#3D6FA6">풀림 사용 시</text>
    </svg>
  )
}

function SlideIllustration2() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 420 280" fill="none" style={{ display: "block" }}>
      {/* Step 1 - Document */}
      <rect x="28" y="70" width="90" height="110" rx="10" fill="white" stroke="rgba(16,35,63,0.12)" strokeWidth="1" />
      <rect x="42" y="90" width="62" height="7" rx="2" fill="rgba(16,35,63,0.12)" />
      <rect x="42" y="105" width="50" height="7" rx="2" fill="rgba(16,35,63,0.08)" />
      <rect x="42" y="120" width="58" height="7" rx="2" fill="rgba(16,35,63,0.1)" />
      <rect x="42" y="135" width="44" height="7" rx="2" fill="rgba(16,35,63,0.08)" />
      <text x="73" y="200" textAnchor="middle" fontSize="10.5" fontFamily="'Noto Sans KR', sans-serif" fill="rgba(16,35,63,0.5)">거래 내역</text>
      <circle cx="16" cy="118" r="10" fill="rgba(16,35,63,0.08)" stroke="rgba(16,35,63,0.15)" strokeWidth="0.5" />
      <text x="16" y="122" textAnchor="middle" fontSize="9" fontFamily="'Noto Sans KR', sans-serif" fill="rgba(16,35,63,0.55)" fontWeight="600">1</text>

      {/* Arrow 1 */}
      <path d="M124 125 L156 125" stroke="rgba(61,111,166,0.35)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M150 119 L156 125 L150 131" stroke="rgba(61,111,166,0.35)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Step 2 - Upload/AI */}
      <circle cx="185" cy="125" r="42" fill="rgba(61,111,166,0.08)" stroke="rgba(61,111,166,0.2)" strokeWidth="1" />
      <path d="M185 115 L185 138M178 122 L185 115 L192 122" stroke="#3D6FA6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="176" y="138" width="18" height="3" rx="1.5" fill="#3D6FA6" opacity="0.5" />
      <text x="185" y="200" textAnchor="middle" fontSize="10.5" fontFamily="'Noto Sans KR', sans-serif" fill="#3D6FA6">AI 분석</text>
      <circle cx="237" cy="90" r="10" fill="#3D6FA6" />
      <text x="237" y="94" textAnchor="middle" fontSize="9" fontFamily="'Noto Sans KR', sans-serif" fill="white" fontWeight="600">2</text>

      {/* Arrow 2 */}
      <path d="M232 125 L264 125" stroke="rgba(61,111,166,0.35)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M258 119 L264 125 L258 131" stroke="rgba(61,111,166,0.35)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Step 3 - Output doc */}
      <rect x="270" y="60" width="122" height="130" rx="10" fill="white" stroke="rgba(61,111,166,0.25)" strokeWidth="1" />
      <rect x="284" y="82" width="94" height="8" rx="2" fill="rgba(61,111,166,0.3)" />
      <rect x="284" y="98" width="78" height="7" rx="2" fill="rgba(61,111,166,0.18)" />
      <rect x="284" y="112" width="88" height="7" rx="2" fill="rgba(61,111,166,0.22)" />
      <rect x="284" y="126" width="64" height="7" rx="2" fill="rgba(61,111,166,0.15)" />
      <rect x="284" y="140" width="82" height="7" rx="2" fill="rgba(61,111,166,0.18)" />
      <rect x="284" y="154" width="70" height="7" rx="2" fill="rgba(61,111,166,0.12)" />
      {/* Bullet dots */}
      <circle cx="276" cy="86" r="3" fill="#3D6FA6" opacity="0.5" />
      <circle cx="276" cy="102" r="3" fill="#3D6FA6" opacity="0.4" />
      <circle cx="276" cy="116" r="3" fill="#3D6FA6" opacity="0.5" />
      <circle cx="276" cy="130" r="3" fill="#3D6FA6" opacity="0.35" />
      <text x="331" y="215" textAnchor="middle" fontSize="10.5" fontFamily="'Noto Sans KR', sans-serif" fill="#3D6FA6">소명서 완성</text>
      <circle cx="258" cy="90" r="10" fill="#3D6FA6" />
      <text x="258" y="94" textAnchor="middle" fontSize="9" fontFamily="'Noto Sans KR', sans-serif" fill="white" fontWeight="600">3</text>
    </svg>
  )
}

function SlideIllustration3() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 420 280" fill="none" style={{ display: "block" }}>
      {/* Back folder */}
      <rect x="90" y="130" width="240" height="120" rx="12" fill="rgba(61,111,166,0.18)" />
      <rect x="90" y="118" width="90" height="18" rx="6" fill="rgba(61,111,166,0.18)" />
      {/* Document 1 */}
      <rect x="80" y="68" width="110" height="140" rx="10" fill="white" stroke="rgba(16,35,63,0.1)" strokeWidth="1" />
      <rect x="94" y="88" width="82" height="7" rx="2" fill="rgba(16,35,63,0.1)" />
      <rect x="94" y="102" width="66" height="7" rx="2" fill="rgba(16,35,63,0.07)" />
      <rect x="94" y="116" width="76" height="7" rx="2" fill="rgba(16,35,63,0.09)" />
      <circle cx="162" cy="76" r="14" fill="rgba(61,111,166,0.15)" />
      <path d="M156 76L160 80L168 72" stroke="#3D6FA6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {/* Document 2 */}
      <rect x="198" y="56" width="110" height="140" rx="10" fill="white" stroke="rgba(61,111,166,0.2)" strokeWidth="1" />
      <rect x="212" y="76" width="82" height="7" rx="2" fill="rgba(61,111,166,0.2)" />
      <rect x="212" y="90" width="66" height="7" rx="2" fill="rgba(61,111,166,0.14)" />
      <rect x="212" y="104" width="76" height="7" rx="2" fill="rgba(61,111,166,0.18)" />
      <rect x="212" y="118" width="60" height="7" rx="2" fill="rgba(61,111,166,0.12)" />
      <rect x="212" y="132" width="72" height="7" rx="2" fill="rgba(61,111,166,0.16)" />
      <circle cx="280" cy="64" r="14" fill="#3D6FA6" />
      <path d="M274 64L278 68L286 60" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {/* AI badge */}
      <rect x="134" y="214" width="152" height="28" rx="14" fill="white" stroke="rgba(61,111,166,0.3)" strokeWidth="0.5" />
      <circle cx="151" cy="228" r="8" fill="#3D6FA6" />
      <text x="151" y="232" textAnchor="middle" fontSize="8" fontFamily="'Noto Sans KR', sans-serif" fill="white" fontWeight="700">AI</text>
      <text x="220" y="232" textAnchor="middle" fontSize="11" fontFamily="'Noto Sans KR', sans-serif" fill="#10233F" fontWeight="500">분석 근거 포함 완료</text>
    </svg>
  )
}

const SLIDE_ILLUSTRATIONS = [SlideIllustration1, SlideIllustration2, SlideIllustration3]

function OnboardingModal({ onClose }: { onClose: () => void }) {
  const [slide, setSlide] = useState(0)
  const total = MODAL_SLIDES.length
  const isLast = slide === total - 1
  const current = MODAL_SLIDES[slide]
  const Illustration = SLIDE_ILLUSTRATIONS[slide]

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(20,28,38,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px 16px",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 20,
          width: "100%",
          maxWidth: 780,
          overflow: "hidden",
          position: "relative",
          boxShadow: "0 24px 64px rgba(20,28,38,0.18)",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 20, right: 20,
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(16,35,63,0.35)", fontSize: 18, lineHeight: 1,
            zIndex: 10, padding: 4,
          }}
        >
          ×
        </button>

        {/* Content */}
        <div style={{ display: "flex", minHeight: 480 }}>
          {/* Left text */}
          <div
            style={{
              flex: "0 0 42%",
              padding: "52px 40px 36px",
              display: "flex", flexDirection: "column", justifyContent: "center",
            }}
          >
            <div
              style={{
                fontSize: 11.5, fontWeight: 600, color: "#3D6FA6",
                fontFamily: "'Noto Sans KR', sans-serif",
                letterSpacing: "0.02em", marginBottom: 16,
              }}
            >
              {current.tag}
            </div>
            <div
              className="font-serif-kr"
              style={{
                fontSize: 30, fontWeight: 700, color: "#10233F",
                lineHeight: 1.3, letterSpacing: "-0.02em",
                marginBottom: 20, whiteSpace: "pre-line",
              }}
            >
              {current.headline}
            </div>
            <div
              className="font-sans-kr"
              style={{
                fontSize: 14, color: "rgba(16,35,63,0.55)",
                lineHeight: 1.85, whiteSpace: "pre-line",
              }}
            >
              {current.body}
            </div>
          </div>

          {/* Right illustration */}
          <div
            style={{
              flex: 1,
              background: "rgba(16,35,63,0.03)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "36px 28px",
              borderLeft: "0.5px solid rgba(16,35,63,0.07)",
            }}
          >
            <div style={{ width: "100%", height: 280 }}>
              <Illustration />
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            padding: "20px 36px",
            borderTop: "0.5px solid rgba(16,35,63,0.08)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          {/* Dots */}
          <div style={{ display: "flex", gap: 6 }}>
            {Array.from({ length: total }).map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                style={{
                  width: i === slide ? 22 : 8, height: 8,
                  borderRadius: 4,
                  background: i === slide ? "#3D6FA6" : "rgba(16,35,63,0.15)",
                  border: "none", cursor: "pointer",
                  transition: "all 0.2s ease",
                  padding: 0,
                }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {!isLast && (
              <button
                onClick={onClose}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 13.5, color: "rgba(16,35,63,0.4)",
                  fontFamily: "'Noto Sans KR', sans-serif", padding: "8px 4px",
                }}
              >
                건너뛰기
              </button>
            )}
            {!isLast && (
              <button
                className="btn-primary"
                onClick={() => setSlide(s => s + 1)}
                style={{ fontSize: 13.5, padding: "10px 24px" }}
              >
                다음 →
              </button>
            )}
            {isLast && (
              <button
                className="btn-primary"
                onClick={onClose}
                style={{ fontSize: 13.5, padding: "10px 28px" }}
              >
                시작하기 →
              </button>
            )}
            {isLast && (
              <button
                onClick={() => setSlide(s => s - 1)}
                style={{
                  background: "none", border: "0.5px solid rgba(16,35,63,0.2)", cursor: "pointer",
                  fontSize: 13.5, color: "rgba(16,35,63,0.5)",
                  fontFamily: "'Noto Sans KR', sans-serif", padding: "10px 20px",
                  borderRadius: 8, order: -1,
                }}
              >
                ← 이전
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── App ─────────────────────────────────────────────────────
export default function App() {
  const [step, setStep] = useState(0)
  const [showModal, setShowModal] = useState(true)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [dday, setDday] = useState<number | null>(null)

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF9", display: "flex", flexDirection: "row-reverse" }}>
      {showModal && <OnboardingModal onClose={() => setShowModal(false)} />}
      <Sidebar step={step} onStepClick={setStep} dday={dday} />
      <main style={{ flex: 1, overflowY: "auto", minHeight: "100vh" }}>
        {step === 0 && <Landing onStart={() => setStep(1)} />}
        {step === 1 && (
          <DiagnosisQuestionnaire
            onNext={() => setStep(2)}
            onDdayChange={setDday}
            onAnswersChange={setAnswers}
          />
        )}
        {step === 2 && <DataUpload answers={answers} onNext={() => setStep(3)} />}
        {step === 3 && <AnalysisResult onNext={() => setStep(4)} />}
        {step === 4 && <DocumentEditor onNext={() => setStep(5)} />}
        {step === 5 && <SubmissionSupport />}
      </main>
    </div>
  )
}
