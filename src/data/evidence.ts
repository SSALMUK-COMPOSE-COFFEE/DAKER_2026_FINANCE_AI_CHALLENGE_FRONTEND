import type { Answers, EvidenceItem } from "@/types"

export const CAT_LABELS: Record<string, { title: string; desc: string }> = {
  A: { title: "A. 거래 실재", desc: "거래가 실제로 있었음을 증명" },
  B: { title: "B. 물품 인도", desc: "물건을 실제로 전달했음을 증명" },
  C: { title: "C. 계좌 정상성", desc: "계좌가 정상적으로 운용됐음을 증명" },
  D: { title: "D. 절차 메타", desc: "이의제기 절차에 필요한 공식 서류" },
}

export function getEvidenceChecklist(answers: Answers): EvidenceItem[] {
  const items: EvidenceItem[] = [
    {
      id: "notif",
      category: "D",
      priority: "필수",
      label: "지급정지 통보 캡처",
      description: "문자·앱 알림 스크린샷",
    },
    {
      id: "chat",
      category: "A",
      priority: "필수",
      label: "거래 대화 전체 스크린샷",
      description: "협의~입금 요청까지 전 과정",
    },
    {
      id: "txhistory",
      category: "C",
      priority: "필수",
      label: "거래내역 CSV (수개월치 권장)",
      description: "은행 앱·영업점에서 발급",
    },
    {
      id: "id",
      category: "D",
      priority: "필수",
      label: "신분증 사본",
      description: "주민등록증 또는 운전면허증",
    },
  ]
  const q3 = answers.q3 as string // 무엇을 넘겼나 (목적물)
  const q4 = answers.q4 as string // 어떻게 전달했나
  const q6 = answers.q6 as string // 입금자명 일치 여부
  const q13 = (answers.q13 ?? []) as string[] // 이미 취한 조치

  // 목적물별 — 증거를 어디서 받는지가 여기서 갈린다
  if (q3 === "상품권") {
    items.push({
      id: "voucher-usage",
      category: "A",
      priority: "필수",
      label: "상품권 발행사 사용이력 조회 결과",
      description: "언제·어디서 사용됐는지 발행사에 요청",
    })
    items.push({
      id: "voucher-pin",
      category: "B",
      priority: "권장",
      label: "핀번호·바코드 전송 화면",
      description: "상대에게 전달한 캡처",
    })
  } else if (q3 === "게임재화") {
    items.push({
      id: "game-log",
      category: "A",
      priority: "필수",
      label: "게임사 고객센터 거래 로그 회신",
      description: "아이템·재화 이동 기록 요청 결과",
    })
    items.push({
      id: "game-chat",
      category: "B",
      priority: "권장",
      label: "게임 내 거래·우편 전송 캡처",
      description: "인수인계 시점 확인",
    })
  } else if (q3 === "팬덤굿즈") {
    items.push({
      id: "goods-tracking",
      category: "B",
      priority: "권장",
      label: "택배 송장·배송조회",
      description: "발송 및 배송완료 확인",
    })
    items.push({
      id: "goods-agent",
      category: "B",
      priority: "권장",
      label: "배송대행지(배대지) 이용 내역",
      description: "대행지 회원번호·이용 기록",
    })
  } else if (q3 === "금귀금속외화") {
    items.push({
      id: "bullion-receipt",
      category: "A",
      priority: "필수",
      label: "매입 영수증 또는 시세 확인 자료",
      description: "물품 취득 경로 증빙",
    })
    items.push({
      id: "bullion-cctv",
      category: "B",
      priority: "권장",
      label: "구청 CCTV 열람 신청 접수증",
      description: "거래 장소 관할 구청에 신청",
    })
  } else if (q3 === "암호화폐") {
    items.push({
      id: "crypto-tx",
      category: "A",
      priority: "필수",
      label: "블록체인 전송 기록 (트랜잭션 해시)",
      description: "지갑 주소·전송 시각이 담긴 기록 — 가장 강력한 증거",
    })
  } else if (q3 === "용역") {
    items.push({
      id: "service-contract",
      category: "A",
      priority: "필수",
      label: "계약서 또는 업무 의뢰 확인 자료",
      description: "용역 내용·기간 명시",
    })
    items.push({
      id: "service-output",
      category: "B",
      priority: "권장",
      label: "작업물·정산 내역",
      description: "실제 수행 및 정산 증빙",
    })
  } else if (q3 === "실물중고") {
    if (q4 === "택배") {
      items.push({
        id: "tracking",
        category: "B",
        priority: "권장",
        label: "운송장·배송조회 완료 캡처",
        description: "배송완료 상태 확인 가능한 것",
      })
      items.push({
        id: "receipt",
        category: "B",
        priority: "권장",
        label: "편의점 택배 영수증",
        description: "발송 사실 추가 증명",
      })
    } else if (q4 === "직접") {
      items.push({
        id: "meetup",
        category: "B",
        priority: "권장",
        label: "만남 약속 대화 캡처",
        description: "시각·장소 특정 가능한 것",
      })
      items.push({
        id: "movement",
        category: "B",
        priority: "권장",
        label: "이동 기록 (지도 앱·교통카드)",
        description: "정황 증거로 인도 시점 특정",
      })
    }
  }

  if (q4 === "온라인전송") {
    items.push({
      id: "online-transfer",
      category: "B",
      priority: "필수",
      label: "핀번호·계정·아이템 전송 화면",
      description: "상대에게 전달한 캡처",
    })
  }

  if (q6 === "다름") {
    items.push({
      id: "mismatch",
      category: "A",
      priority: "권장",
      label: "입금내역 + 대화 병치 캡처",
      description: "불일치를 전면에 해명하는 핵심 증거",
    })
  }

  // 계좌 정상성(C) — "소득 증명"이 아니라 "생계 연관성 증명"으로 넓힌다.
  // 재직자가 아니어도(학생·무직자) 소명할 수 있도록 건강보험자격득실확인서를 기본값으로 둔다.
  items.push({
    id: "livelihood-cert",
    category: "C",
    priority: "권장",
    label: "건강보험자격득실확인서 (또는 재직증명서, 택1)",
    description: "온라인 즉시 발급 가능 — 회사에 알리지 않고도 뗄 수 있음",
  })
  items.push({
    id: "autopay",
    category: "C",
    priority: "가점",
    label: "자동이체 등록내역 (통신비·공과금·카드대금 등)",
    description:
      "어카운트인포에서 즉시 발급 — 장기 반복 패턴은 대포통장에 없음",
  })
  items.push({
    id: "livelihood-etc",
    category: "C",
    priority: "가점",
    label: "생활비·등록금 송금 또는 재학·연금 증명",
    description: "부모님 정기 송금, 재학증명서, 국민연금 가입증명 등 (해당 시)",
  })

  if (q13.includes("경찰신고")) {
    items.push({
      id: "police",
      category: "D",
      priority: "가점",
      label: "경찰 신고 접수증·사건사고사실확인원",
      description: '"본인도 피해자" 절차 기록',
    })
  }
  if (q13.includes("더치트")) {
    items.push({
      id: "thecheat",
      category: "D",
      priority: "가점",
      label: "더치트 조회 결과 캡처",
      description: "사기범 정보 기록",
    })
  }
  return items
}
