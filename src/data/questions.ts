import type { Question } from "@/types"
import { BANKS } from "@/data/bankRequirements"

/**
 * Q1 뒤로는 "은행" 트랙일 때만 이어집니다. 경찰/경보/민사는 Q1에서
 * 바로 전용 안내 화면으로 분기하고 나머지 문항을 묻지 않습니다.
 */
export const QUESTIONS: Question[] = [
  {
    id: "q1",
    tag: "Q1 · 지금 상황",
    question: "지금 어떤 연락을 받으셨나요?",
    note: "가장 가까운 것을 골라주세요. 여기서 어떤 절차로 안내해 드릴지 정해집니다.",
    type: "single",
    options: [
      { value: "은행", label: "은행에서 계좌가 정지됐다고 연락이 왔습니다" },
      { value: "경찰", label: "경찰에서 조사받으러 오라고 연락이 왔습니다" },
      { value: "경보", label: "아직 연락은 없는데 이상한 게 보입니다" },
      { value: "민사", label: "소송 서류나 내용증명이 왔습니다" },
      { value: "모름", label: "잘 모르겠습니다" },
    ],
  },
  {
    id: "q2",
    tag: "Q2 · 자금 출처",
    question: "그 돈이 왜 들어왔다고 생각하셨나요?",
    type: "single",
    options: [
      { value: "판매대금", label: "물건이나 서비스를 팔고 받은 대금입니다" },
      { value: "채무변제", label: "빌려준 돈을 돌려받은 것입니다" },
      { value: "이유모름", label: "이유를 모르는 돈이 들어왔습니다" },
      {
        value: "환전대리송금",
        label: "환전이나 대리 송금을 해주고 받은 것입니다",
      },
    ],
  },
  {
    id: "q3",
    tag: "Q3 · 무엇을 넘겼나",
    question: "무엇을 넘기셨나요?",
    note: "이 답변에 따라 어디서 어떤 증거를 받을 수 있는지가 정해집니다.",
    type: "single",
    options: [
      { value: "실물중고", label: "실물 중고물품 (휴대폰·노트북·자전거 등)" },
      { value: "상품권", label: "상품권·기프티콘" },
      { value: "게임재화", label: "게임 재화·계정" },
      { value: "팬덤굿즈", label: "팬덤 굿즈 (앨범·포토카드·티켓)" },
      { value: "금귀금속외화", label: "금·귀금속·외화 현금" },
      { value: "암호화폐", label: "암호화폐" },
      { value: "용역", label: "용역·서비스" },
      { value: "없음", label: "아무것도 넘기지 않았습니다" },
    ],
  },
  {
    id: "q4",
    tag: "Q4 · 전달 방식",
    question: "어떻게 전달하셨나요?",
    type: "single",
    options: [
      { value: "택배", label: "택배 발송" },
      { value: "직접", label: "직접 만나서" },
      { value: "온라인전송", label: "온라인으로 전송 (핀번호·계정·아이템)" },
      { value: "미전달", label: "아직 전달하지 않음" },
    ],
    warnings: {
      직접: "가게 CCTV는 보통 30일이면 지워집니다. 지금 바로 거래 장소와 시각을 적어두시고, 대화 기록·이동 기록(지도 앱, 교통카드)부터 저장하세요.",
    },
  },
  {
    id: "q5",
    tag: "Q5 · 금액 일치 여부",
    question: "들어온 금액이 약속한 금액과 같았나요?",
    note: "가장 강력한 단일 신호입니다.",
    type: "single",
    options: [
      { value: "같음", label: "같았습니다" },
      { value: "더받음", label: "더 들어왔습니다" },
      { value: "덜받음", label: "덜 들어왔습니다" },
      { value: "모름", label: "기억나지 않습니다" },
    ],
  },
  {
    id: "q6",
    tag: "Q6 · 입금자명 확인",
    question: "입금자 이름이 대화 상대와 같았나요?",
    note: "달랐다고 해서 불리한 게 아닙니다 — 3자사기의 구조적 증거가 됩니다.",
    type: "single",
    options: [
      { value: "같음", label: "같았음" },
      { value: "다름", label: "달랐음" },
      { value: "모름", label: "기억나지 않음" },
    ],
  },
  {
    id: "q7",
    tag: "Q7 · 입금 건 특정",
    question: "문제가 된 입금 건을 특정할 수 있나요?",
    note: "은행이 알려줬으면 그대로, 아니면 거래내역에서 찾아 입력해 주세요.",
    type: "caseDetails",
  },
  {
    id: "q8",
    tag: "Q8 · 확인 사항",
    question: "다음 중 해당하는 것이 있나요?",
    note: "하나라도 해당하면 자동 소명서 생성을 도와드리기 어렵습니다. 해당 없으면 계속 진행해 주세요.",
    type: "multi",
    options: [
      {
        value: "접근매체양도",
        label: "통장·카드·OTP·비밀번호를 다른 사람에게 넘김",
      },
      { value: "도박환전", label: "도박·토토 사이트 환전" },
      { value: "환치기", label: "환치기·개인 간 외환 거래" },
      { value: "대리인출송금", label: "남의 돈을 대신 인출하거나 송금해 줌" },
      { value: "해당없음", label: "해당 없음" },
    ],
  },
  {
    id: "q9",
    tag: "Q9 · 기한 확인",
    question: "계좌가 정지된 날짜가 언제인가요?",
    note: "통보 문자 또는 앱 알림에 표시된 날짜입니다.",
    type: "date",
  },
  {
    id: "q10",
    tag: "Q10 · 공고 통지",
    question: "채권소멸절차 개시 공고 통지를 받으셨나요?",
    note: "지급정지 통보와는 별개로 오는 통지입니다. 아직 안 왔어도 이의제기는 지금 바로 내실 수 있어요.",
    type: "single",
    options: [
      { value: "받음", label: "받았습니다" },
      { value: "안받음", label: "아직 못 받았습니다" },
      { value: "모름", label: "잘 모르겠습니다" },
    ],
  },
  {
    id: "q11",
    tag: "Q11 · 정지된 은행",
    question: "어느 은행(들)의 계좌가 막혔나요?",
    note: "여러 곳이면 모두 선택해 주세요. 목록에 없으면 '기타'를 선택하세요.",
    type: "multi",
    options: [
      ...BANKS.map((b) => ({ value: b.name, label: b.name })),
      { value: "기타", label: "기타" },
    ],
  },
  {
    id: "q12",
    tag: "Q12 · 이전 이력",
    question: "과거에 지급정지를 당한 적이 있나요?",
    note: "있다면 소액 간소화 트랙이 별도 검토 없이 자동으로 적용되지 않을 수 있어 미리 알려드립니다.",
    type: "single",
    options: [
      { value: "있음", label: "있습니다" },
      { value: "없음", label: "없습니다" },
    ],
  },
  {
    id: "q13",
    tag: "Q13 · 사전 조치",
    question: "이미 취하신 조치가 있다면 모두 선택해 주세요.",
    note: "아직 아무것도 못하셨어도 괜찮습니다. 지금부터 함께 준비할 수 있어요.",
    type: "multi",
    options: [
      { value: "은행전화", label: "은행에 전화해 봄" },
      { value: "경찰신고", label: "경찰에 신고함" },
      { value: "더치트", label: "더치트(The Cheat) 조회함" },
      { value: "없음", label: "아직 아무것도 못함" },
    ],
  },
]
