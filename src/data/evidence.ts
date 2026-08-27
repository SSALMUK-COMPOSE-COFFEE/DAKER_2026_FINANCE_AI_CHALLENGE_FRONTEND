import type { Answers, EvidenceItem } from "@/types"

export const CAT_LABELS: Record<string, { title: string; desc: string }> = {
  A: { title: "A. 거래 실재",    desc: "거래가 실제로 있었음을 증명" },
  B: { title: "B. 물품 인도",    desc: "물건을 실제로 전달했음을 증명" },
  C: { title: "C. 계좌 정상성",  desc: "계좌가 정상적으로 운용됐음을 증명" },
  D: { title: "D. 절차 메타",    desc: "이의제기 절차에 필요한 공식 서류" },
}

export function getEvidenceChecklist(answers: Answers): EvidenceItem[] {
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
