export interface ChatMsg {
  role: "user" | "ai"
  text: string
}

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
  type: "single" | "multi" | "combo" | "date"
  options?: QOption[]
  exitIf?: string
  outOfScope?: string[]
}

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
