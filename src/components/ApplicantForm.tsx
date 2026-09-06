import { useState } from "react"
import { ChevronDown, ShieldCheck } from "lucide-react"
import type { Applicant } from "@/api"

const FIELDS: {
  key: keyof Applicant
  label: string
  placeholder: string
  type?: string
  wide?: boolean
}[] = [
  { key: "name", label: "성명", placeholder: "홍길동" },
  { key: "birth", label: "생년월일", placeholder: "1990. 01. 01." },
  { key: "phone", label: "전화번호", placeholder: "010-0000-0000", type: "tel" },
  { key: "email", label: "전자우편주소", placeholder: "hong@example.com", type: "email" },
  { key: "address", label: "주소", placeholder: "서울특별시 ○○구 ○○로 00", wide: true },
  { key: "bank", label: "금융회사", placeholder: "○○은행" },
  { key: "branch", label: "개설점포", placeholder: "○○지점" },
  { key: "account_type", label: "예금종별", placeholder: "입출금통장" },
  { key: "account_no", label: "계좌번호", placeholder: "123-456-789012" },
]

const INPUT =
  "w-full py-2.5 px-3 border-[0.5px] border-border rounded-[10px] text-[13px] text-navy outline-none bg-white box-border focus:border-blue/50"

export function ApplicantForm({
  value,
  onChange,
  onRedraft,
  redrafting,
}: {
  value: Applicant
  onChange: (next: Applicant) => void
  onRedraft: () => void
  redrafting: boolean
}) {
  const [open, setOpen] = useState(true)
  const filled = Object.entries(value).filter(
    ([k, v]) => k !== "account_type" && v.trim(),
  ).length

  return (
    <div className="card py-3.5 px-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 text-left"
      >
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-blue" />
          <span className="text-[11.5px] font-semibold text-navy">
            신청인 정보 (선택)
          </span>
          <span className="text-[10.5px] text-navy/40">
            {filled ? `${filled}개 입력` : "입력하지 않아도 됩니다"}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`text-navy/40 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-3">
          <p className="text-[11.5px] text-navy/55 leading-[1.6] mb-3">
            입력하지 않으면 이의제기신청서 서식의 해당 칸이 비워지고, 출력 후
            직접 적으시면 됩니다. 입력값은 서버에 저장되지 않고 초안 문장과 PDF
            생성에만 쓰입니다.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {FIELDS.map((f) => (
              <label
                key={f.key}
                className={`block ${f.wide ? "sm:col-span-2" : ""}`}
              >
                <span className="block text-[10.5px] text-navy/50 mb-1">
                  {f.label}
                </span>
                <input
                  type={f.type ?? "text"}
                  value={value[f.key]}
                  placeholder={f.placeholder}
                  autoComplete="off"
                  onChange={(e) =>
                    onChange({ ...value, [f.key]: e.target.value })
                  }
                  className={INPUT}
                />
              </label>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10.5px] text-navy/40">
              PDF에는 항상 현재 입력값이 들어갑니다. 초안 문장의 이름·계좌
              자리까지 바꾸려면 다시 생성하세요 (직접 고친 내용은 사라집니다).
            </span>
            <button
              type="button"
              className="btn-secondary text-[12px]"
              onClick={onRedraft}
              disabled={redrafting}
            >
              {redrafting ? "생성 중…" : "이 정보로 초안 다시 생성"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
