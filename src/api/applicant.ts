import type { Applicant } from "./types"
import type { Answers } from "@/types"

const first = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? (v[0] ?? "") : (v ?? "")

export const EMPTY_APPLICANT: Applicant = {
  name: "",
  birth: "",
  address: "",
  phone: "",
  email: "",
  bank: "",
  branch: "",
  account_type: "입출금통장",
  account_no: "",
}

export function applicantFromAnswers(answers: Answers): Applicant {
  const bank = first(answers.q11)
  return {
    ...EMPTY_APPLICANT,
    name: first(answers.applicant_name),
    bank: bank === "기타" ? "" : bank,
  }
}
