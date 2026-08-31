import { useState } from 'react';
import { Check } from 'lucide-react';
import { BANKS } from '@/data/bankRequirements';

const CHECKLIST = [
  { id: 'doc', label: '소명서 (풀림 AI 작성본)' },
  { id: 'tx', label: '거래 내역서 (최소 3개월치)' },
  { id: 'tax', label: '세금계산서 또는 입금 근거 자료' },
  { id: 'biz', label: '사업자등록증 또는 신분증 사본' },
  { id: 'etc', label: '기타 거래 계약서 또는 용역 확인서' },
];

const STATUS_STAGES = [
  { id: 'filed', label: '이의제기 접수됨', desc: '냈다' },
  {
    id: 'accepted',
    label: '이의제기 수용됨',
    desc: '은행이 받아들였다 — 아직 해제는 아니다',
  },
  {
    id: 'released',
    label: '은행 지급정지 해제됨',
    desc: '그 은행 계좌가 풀렸다',
  },
  {
    id: 'fss',
    label: '금감원 전자금융거래제한 해제됨',
    desc: '전 금융권 제한이 풀렸다 — 은행 해제와 열흘 넘게 차이 날 수 있다',
  },
];

export function SubmissionSupport() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [agreed, setAgreed] = useState(false);
  const doneCount = Object.values(checked).filter(Boolean).length;

  return (
    <div className="step-section max-w-175 mx-auto pt-14 px-12 pb-20">
      <div className="mb-2">
        <span className="text-[11px] text-blue font-semibold tracking-widest">
          STEP 5
        </span>
      </div>
      <h1 className="font-serif-kr text-[28px] font-bold text-navy mb-2 tracking-[-0.01em]">
        제출 지원
      </h1>
      <p className="font-sans-kr text-sm text-navy/55 mb-9 leading-[1.7]">
        아래 체크리스트를 확인하고, 계좌를 관리하는 은행 영업점에 신분증과 함께
        소명서·첨부 자료를 제출하세요.
      </p>

      {/* Agreement gate */}
      <label
        onClick={() => setAgreed((v) => !v)}
        className="flex items-start gap-3 bg-navy/3 border-[0.5px] border-navy/12 rounded-xl py-3.5 px-4 mb-6 cursor-pointer"
      >
        <div
          className={`w-4.5 h-4.5 rounded shrink-0 mt-px cursor-pointer flex items-center justify-center ${
            agreed ? 'bg-blue' : 'border-[1.5px] border-navy/25'
          }`}
        >
          {agreed && (
            <Check size={12} color="white" strokeWidth={2.5} />
          )}
        </div>
        <span className="text-[12.5px] text-navy/70 leading-[1.6]">
          위 소명서에 기재한 내용이 모두 사실임을 확인하며, 허위 이의제기 시 3년
          이하의 징역 또는 3천만원 이하의 벌금(법 제16조)에 처해질 수 있음에
          동의합니다.
        </span>
      </label>

      {/* Download bar */}
      <div className="bg-blue/7 border-[0.5px] border-blue/30 rounded-[10px] py-4 px-5 flex items-center justify-between mb-7">
        <div>
          <div className="text-[13.5px] font-semibold text-navy mb-0.5">
            소명서 — 홍길동_20260824.pdf
          </div>
          <div className="text-[11.5px] text-blue">
            AI 분석 근거 포함 · A4 3쪽 분량
          </div>
        </div>
        <button
          className="btn-primary text-[13px] disabled:opacity-35"
          disabled={!agreed}
        >
          PDF 다운로드
        </button>
      </div>

      {/* Checklist */}
      <div className="card py-2 px-0 mb-7">
        <div className="pt-3.5 px-5 pb-2.5 border-b-[0.5px] border-navy/7 flex justify-between">
          <span className="text-[12.5px] font-semibold text-navy">
            제출 체크리스트
          </span>
          <span className="text-[11.5px] text-blue">
            {doneCount}/{CHECKLIST.length} 완료
          </span>
        </div>
        {CHECKLIST.map((c) => (
          <label
            key={c.id}
            onClick={() =>
              setChecked((prev) => ({ ...prev, [c.id]: !prev[c.id] }))
            }
            className="flex items-center gap-3 py-2.75 px-5 border-b-[0.5px] border-navy/5 cursor-pointer"
          >
            <div
              className={`w-4.5 h-4.5 rounded shrink-0 flex items-center justify-center cursor-pointer ${
                checked[c.id] ? 'bg-blue' : 'border-[1.5px] border-navy/25'
              }`}
            >
              {checked[c.id] && (
                <Check size={12} color="white" strokeWidth={2.5} />
              )}
            </div>
            <span
              className={`text-[13px] transition-all duration-150 ${
                checked[c.id] ? 'text-navy/35 line-through' : 'text-navy'
              }`}
            >
              {c.label}
            </span>
          </label>
        ))}
      </div>

      {/* Multi-bank guidance */}
      <div className="bg-navy/4 rounded-lg py-3.5 px-4 mb-6 text-[11.5px] text-navy/65 leading-[1.75]">
        <b className="text-navy">최초로 정지를 신청한 은행부터 확인하세요.</b>{' '}
        여러 계좌가 묶였다면 처음 지급정지를 요청한 은행이 풀어줘야 하는 경우가
        많습니다.
        <b className="text-navy">
          {' '}
          여러 계좌면 순차가 아니라 동시에 접수하세요
        </b>{' '}
        — 은행에 따라 심사 기간이 5일에서 28일까지 차이 나므로, 한 곳씩 기다리면
        기한을 넘길 수 있습니다.
        <b className="text-navy"> 창구에서 반려당하면</b> 서면 답변을 요구하고
        금감원 1332를 함께 활용하세요.{' '}
        <b className="text-navy">돈을 임의로 돌려주지 마세요</b> — 직접 반환은
        자금세탁 가담 위험이 있으니 반드시 은행을 통해 기록을 남기며 반환하세요.
      </div>

      {/* Bank contacts */}
      <div className="mb-6">
        <div className="text-[12.5px] font-semibold text-navy mb-3">
          주요 은행 이의제기 접수처
        </div>
        <div className="grid grid-cols-2 gap-2">
          {BANKS.map((b) => (
            <div key={b.name} className="card py-3.5 px-4">
              <div className="text-[13px] font-semibold text-navy mb-0.75">
                {b.name}
              </div>
              <div className="text-[11px] text-navy/45 mb-1.25">{b.dept}</div>
              <div className="text-[12.5px] text-blue font-semibold">
                {b.tel}
              </div>
              <div className="text-[10.5px] text-navy/35 mt-0.5">{b.days}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Status stages */}
      <div className="mb-6">
        <div className="text-[12.5px] font-semibold text-navy mb-1">
          "풀렸다"는 한 가지가 아닙니다
        </div>
        <div className="text-[11.5px] text-navy/50 leading-[1.6] mb-3">
          정지는 자동으로 번지지만 해제는 번지지 않습니다. 계좌별로 아래 네
          단계를 따로 확인하세요.
        </div>
        <div className="card py-1 px-0">
          {STATUS_STAGES.map((s, i) => (
            <div
              key={s.id}
              className={`flex items-center gap-3 py-3 px-5 ${
                i < STATUS_STAGES.length - 1
                  ? 'border-b-[0.5px] border-navy/7'
                  : ''
              }`}
            >
              <span className="text-[9.5px] font-bold text-navy/50 bg-navy/6 py-0.5 px-1.75 rounded-[10px] whitespace-nowrap">
                {i + 1}
              </span>
              <div>
                <div className="text-[13px] font-semibold text-navy">
                  {s.label}
                </div>
                <div className="text-[11px] text-navy/45">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legal note */}
      <div className="bg-warm/6 border-[0.5px] border-warm/25 rounded-lg py-3 px-4 mb-6">
        <div className="text-[11px] text-warm font-semibold mb-0.75">
          유의사항
        </div>
        <div className="text-[11.5px] text-navy/55 leading-[1.65]">
          본 소명서는 AI가 제안한 초안이며, 법적 효력을 보장하지 않습니다.
          은행의 최종 판단에 따라 결과가 달라질 수 있으며, 복잡한 사안은 법률
          전문가의 검토를 권고드립니다. 이의제기가 반려되면 소송으로 다투기
          어려울 수 있어 첫 제출이 가장 중요합니다 — 반려되면 보완해서 다시
          내고, 그래도 안 되면 금감원 민원(1332)으로 가세요.
        </div>
      </div>

      <div className="bg-blue/6 border-[0.5px] border-blue/20 rounded-xl py-4 px-5 text-[12.5px] text-navy/70 leading-[1.7]">
        여기까지가 풀림이 도와드릴 수 있는 범위입니다. 실제 제출은 은행 영업점
        또는 은행 앱에서 진행해 주세요. 진행 상황은 접수하신 은행의 안내에 따라
        확인하시면 됩니다.
      </div>
    </div>
  );
}
