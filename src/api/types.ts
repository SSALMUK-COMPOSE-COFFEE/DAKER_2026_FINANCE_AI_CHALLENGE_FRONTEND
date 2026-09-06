import type { Answers, EvidenceCategory, EvidenceItem } from "@/types"

export type FindingVerdict = "정상" | "주의" | "확인필요"
export type TxKind = "transfer" | "spend" | "unknown"
export type ParsedFileKind = "transactions" | "image" | "document" | "unknown"

export interface Transaction {
  occurred_at: string
  amount: number
  direction: "in" | "out"
  counterparty: string
  memo: string
  kind: TxKind
}

export type ImageCategory =
  | "chat"
  | "notification"
  | "txhistory"
  | "receipt"
  | "tracking"
  | "police"
  | "other"

export interface ImageExtract {
  file: string
  category: ImageCategory
  summary: string
  depositor: string
  amount: string
  occurred_at: string
  counterparty: string
  quotes: string[]
}

export interface ParsedFile {
  name: string
  size: number
  kind: ParsedFileKind
  transaction_count: number
  error: string | null
  extracted: ImageExtract | null
}

export interface UploadParseResponse {
  files: ParsedFile[]
  transactions: Transaction[]
}

export interface IntakeResponse {
  answers: Answers
  summary: string
  generated_by: "llm" | "rules"
}

export interface EvidenceChecklistResponse {
  items: EvidenceItem[]
  must_count: number
}

export interface BankInfo {
  name: string
  dept: string
  tel: string
  days: string
  requirements: string[] | null
}

export interface BanksResponse {
  banks: BankInfo[]
  disclosure_note: string
}

export interface LetterTemplate {
  purpose: string
  recipient: string
  subject: string
  body: string
}

export interface Citation {
  key: string
  kind: "statute" | "precedent"
  title: string
  summary: string
  caution: string
}

export interface SubmissionItem {
  id: string
  label: string
  desc: string
}

export interface SubmissionGuide {
  checklist: SubmissionItem[]
  stages: SubmissionItem[]
  contacts: BankInfo[]
}

export interface Metrics {
  pass_through_ratio: number | null
  dwell_days: number | null
  fan_out: number
  spend_ratio: number | null
  night_ratio: number | null
  account_span_days: number | null
  recurring_months: number
  deposit_count: number
  withdrawal_count: number
}

export interface Fact {
  label: string
  value: string
}

export interface Signal {
  key: string
  title: string
  body: string
  level: "info" | "warn"
}

export interface EvidenceFinding {
  category: EvidenceCategory
  label: string
  detail: string
  verdict: FindingVerdict
}

export type GraphNodeType = "origin" | "suspect" | "self" | "normal" | "other"

export interface GraphNode {
  id: string
  label: string
  type: GraphNodeType
  hint: string
}

export interface GraphEdge {
  source: string
  target: string
  amount: number | null
  suspicious: boolean
  highlighted: boolean
}

export interface TransactionGraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface AnalysisResponse {
  account_normality: Fact[]
  facts: Fact[]
  findings: EvidenceFinding[]
  signals: Signal[]
  metrics: Metrics
  graph: TransactionGraphData
  notes: string[]
}

export interface Applicant {
  name: string
  birth: string
  address: string
  phone: string
  email: string
  bank: string
  branch: string
  account_type: string
  account_no: string
}

export type DocKey = "application" | "incident" | "evidence"

export interface DocumentDraftResponse {
  application: string
  incident: string
  evidence_index: string
  citations: Citation[]
  generated_by: "llm" | "template"
}

export interface DocumentRewriteResponse {
  content: string
  generated_by: "llm"
}

export interface SampleFile {
  name: string
  url: string
}

export interface Persona {
  id: string
  title: string
  summary: string
  story: string
  expected_basis: Fact[]
  answers: Answers
  transactions: Transaction[]
}
