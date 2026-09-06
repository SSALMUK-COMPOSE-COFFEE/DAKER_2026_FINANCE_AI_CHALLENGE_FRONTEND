import type { Answers } from "@/types"
import type {
  AnalysisResponse,
  Applicant,
  ImageExtract,
  BanksResponse,
  Citation,
  DocKey,
  DocumentDraftResponse,
  DocumentRewriteResponse,
  EvidenceChecklistResponse,
  IntakeResponse,
  LetterTemplate,
  Persona,
  SampleFile,
  SubmissionGuide,
  Transaction,
  UploadParseResponse,
} from "./types"

export const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(
  /\/$/,
  "",
)

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

async function toError(res: Response): Promise<ApiError> {
  let detail = `${res.status} ${res.statusText}`
  try {
    const body = await res.json()
    if (typeof body?.detail === "string") detail = body.detail
  } catch {}
  return new ApiError(res.status, detail)
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, init)
  if (!res.ok) throw await toError(res)
  return (await res.json()) as T
}

function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

export const api = {
  health: () => request<Record<string, string>>("/health"),

  parseIntake: (text: string) =>
    post<IntakeResponse>("/intake/parse", { text }),

  evidenceChecklist: (answers: Answers) =>
    post<EvidenceChecklistResponse>("/evidence/checklist", { answers }),

  parseUploads: (files: File[]) => {
    const form = new FormData()
    for (const file of files) form.append("files", file)
    return request<UploadParseResponse>("/uploads/parse", {
      method: "POST",
      body: form,
    })
  },

  analyze: (answers: Answers, transactions: Transaction[]) =>
    post<AnalysisResponse>("/analysis", { answers, transactions }),

  draftDocuments: (payload: {
    answers: Answers
    analysis: AnalysisResponse | null
    checked_evidence: string[]
    memo: string
    applicant: Partial<Applicant>
    image_notes: ImageExtract[]
  }) => post<DocumentDraftResponse>("/documents/draft", payload),

  rewriteDocument: (payload: {
    doc_key: DocKey
    content: string
    instruction: string
    answers: Answers
  }) => post<DocumentRewriteResponse>("/documents/rewrite", payload),

  exportPdf: async (payload: {
    application: string
    incident: string
    evidence_index: string
    applicant: Partial<Applicant>
  }): Promise<Blob> => {
    const res = await fetch(`${API_BASE}/api/documents/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw await toError(res)
    return res.blob()
  },

  banks: () => request<BanksResponse>("/reference/banks"),
  letters: () => request<LetterTemplate[]>("/reference/letters"),
  letter: (purpose: string) =>
    request<LetterTemplate>(
      `/reference/letters/${encodeURIComponent(purpose)}`,
    ),
  citations: () => request<Citation[]>("/reference/citations"),
  submission: () => request<SubmissionGuide>("/reference/submission"),

  personas: () => request<Persona[]>("/personas"),
  persona: (id: string) => request<Persona>(`/personas/${encodeURIComponent(id)}`),
  personaSamples: (id: string) =>
    request<SampleFile[]>(`/personas/${encodeURIComponent(id)}/samples`),
  sampleFile: async (sample: SampleFile): Promise<File> => {
    const res = await fetch(`${API_BASE}${sample.url}`)
    if (!res.ok) throw await toError(res)
    return new File([await res.blob()], sample.name, {
      type: res.headers.get("content-type") ?? "application/octet-stream",
    })
  },
  personaAnalysis: (id: string) =>
    request<AnalysisResponse>(`/personas/${encodeURIComponent(id)}/analysis`),
}
