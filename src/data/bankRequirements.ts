export interface BankInfo {
  name: string
  dept: string
  tel: string
  days: string
  /** null = 이 은행은 이의제기 요구서류를 공개하지 않음 (조사 결과 20곳 중 16곳이 여기 해당) */
  requirements: string[] | null
}

/**
 * 시연용 대표 샘플입니다. 실제 "금융회사 20곳 요구서류 조사" 코퍼스는
 * 별도 RAG 작업으로 연결될 예정이며, 지금은 기능(은행 선택 → 맞춤 안내)만
 * 보여주기 위한 예시 데이터입니다.
 */
export const BANKS: BankInfo[] = [
  {
    name: "카카오뱅크",
    dept: "고객센터",
    tel: "1599-3333",
    days: "평일 09:00–18:00",
    requirements: [
      "신분증 사본",
      "거래 상대방과의 대화 내역",
      "거래 관련 증빙자료(계약서·영수증 등)",
      "이의제기신청서",
    ],
  },
  {
    name: "국민은행",
    dept: "여신거래지원팀",
    tel: "1588-9999",
    days: "평일 09:00–18:00",
    requirements: null,
  },
  {
    name: "신한은행",
    dept: "고객서비스팀",
    tel: "1544-8000",
    days: "평일 09:00–18:00",
    requirements: ["신분증 사본", "거래사실 확인서류"],
  },
  {
    name: "우리은행",
    dept: "고객행복센터",
    tel: "1588-5000",
    days: "평일 09:00–18:00",
    requirements: null,
  },
  {
    name: "하나은행",
    dept: "고객상담팀",
    tel: "1599-1111",
    days: "평일 09:00–18:00",
    requirements: null,
  },
]

export const BANK_DISCLOSURE_NOTE =
  "금융회사 20곳을 조사한 결과, 이의제기 요구서류를 한 항목이라도 공개한 곳은 4곳(20%)뿐이었고, 유형별로 안내하는 곳은 한 곳도 없었습니다."
