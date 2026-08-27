import type { Question } from "@/types"

export const QUESTIONS: Question[] = [
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
