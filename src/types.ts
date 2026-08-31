export interface UploadedFile {
  name: string
  size: string
  status: "done" | "loading"
}

export interface QOption {
  value: string
  label: string
}

export interface Question {
  id: string
  tag: string
  question: string
  note?: string
  type: "single" | "multi" | "date" | "caseDetails"
  options?: QOption[]
  /** Inline, non-blocking warning shown under the options when this value is selected. */
  warnings?: Record<string, string>
}

export type Track = "bank" | "police" | "warning" | "civil"

export type Purpose = "실물중고" | "상품권" | "게임재화" | "팬덤굿즈" | "금귀금속외화" | "암호화폐" | "용역" | "없음"

export type EvidenceCategory = "A" | "B" | "C" | "D"
export type EvidencePriority = "필수" | "권장" | "가점"

export interface EvidenceItem {
  id: string
  category: EvidenceCategory
  priority: EvidencePriority
  label: string
  description: string
}

export type Answers = Record<string, string | string[]>
