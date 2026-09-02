import { FileText, Clock, ListOrdered } from 'lucide-react';
import { Wordmark } from '@/components/Wordmark';

const FEATURES = [
  {
    icon: FileText,
    title: '문장마다 출처를 표기',
    desc: '사실은 [증거 1], 법적 근거는 [법 조항]으로 표기해 신뢰할 수 있는 초안을 제공합니다.',
  },
  {
    icon: Clock,
    title: '기한을 놓치지 않게',
    desc: '지급정지일로부터 2개월인 이의제기 기한을 D-day로 계산해 알려드립니다.',
  },
  {
    icon: ListOrdered,
    title: '여러 계좌, 처리 순서까지',
    desc: '은행마다 심사 기간이 최대 5배 차이 나요. 여러 계좌가 묶였다면 어디부터 제출할지 안내합니다.',
  },
];

const PERSONAS = [
  '중고거래 대금을 받은 뒤 계좌가 정지된 판매자',
  '소액 입금 한 건으로 전 금융거래가 마비된 분',
  '매출·급여 계좌가 갑자기 묶여 생계가 곤란해진 분',
];

export function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div className="step-section max-w-200 mx-auto pt-8 px-5 pb-14 md:pt-16 md:px-12 md:pb-20">
      {/* Wordmark (mobile은 상단 앱바에 이미 노출되므로 데스크탑에서만 표시) */}
      <div className="mb-4 md:mb-6 hidden md:block">
        <Wordmark size="sm" />
        <div className="font-sans-kr text-[12px] md:text-[13px] text-navy/50 font-medium mt-3 leading-normal">
          무고한 계좌 지급정지 피해자를 위한 AI 이의제기 소명 내비게이션
        </div>
      </div>

      {/* Hero */}
      <div className="mb-8 md:mb-12">
        <div className="text-[22px] md:text-[36px] font-bold text-navy leading-tight tracking-[-0.02em] mb-6">
          묶인 계좌,
          <br />
          <span className="text-blue">근거로 풀립니다.</span>
        </div>
        <p className="font-sans-kr text-[13px] md:text-sm text-navy/62 leading-[1.8] mb-5">
          보이스피싱 여파로 계좌가 묶인 무고한 분들을 위해,
          <br />
          풀림이 거래 근거를 정리하고 이의제기 소명서 초안을 함께 작성합니다.
        </p>

        <div className="bg-blue/6 border-[0.5px] border-blue/20 rounded-lg py-3 px-4 mb-6 text-[12.5px] text-navy/65 leading-[1.6]">
          보이스피싱 발생은 35.5% 줄었지만, 5대 은행 지급정지는 오히려 2배 이상
          늘었습니다. <br />
          <b className="text-navy">범죄는 줄고 동결만 늘어난 셈</b>— 부당 정지
          규모가 그만큼 크다는 뜻입니다.
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            className="btn-primary w-full sm:w-auto text-[15px] py-3.25 px-9"
            onClick={onStart}
          >
            소명서 작성 시작하기 →
          </button>
          <span className="text-[12.5px] text-navy/45">
            5단계 · 회원가입 없이 진행
          </span>
        </div>
      </div>

      {/* Feature cards */}
      <div className="border-[0.5px] border-navy/10 rounded-2xl grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-navy/10 mb-10 md:mb-14 overflow-hidden">
        {FEATURES.map((f, i) => (
          <div key={i} className="relative py-6 px-6 md:px-7">
            <span className="absolute top-3 right-4 text-[44px] md:text-[52px] font-bold text-navy/8 leading-none select-none">
              {String(i + 1).padStart(2, '0')}
            </span>
            <f.icon size={20} className="text-blue mb-4" strokeWidth={1.75} />
            <div className="text-[14px] font-semibold text-navy mb-1.5">
              {f.title}
            </div>
            <div className="text-[12px] text-navy/55 leading-[1.6] max-w-45">
              {f.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Personas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <div>
          <div className="text-[12px] text-navy/40 font-medium mb-2">대상</div>
          <div className="text-[18px] md:text-[22px] font-bold text-navy leading-[1.3] tracking-[-0.01em] mb-4">
            이런 분들을 위한
            <br />
            서비스입니다
          </div>
          <p className="text-[13px] text-navy/50 leading-[1.7] mb-7">
            다음 중 하나라도 해당된다면,
            <br />
            풀림이 도와드릴 수 있어요
          </p>
        </div>

        <div className="flex flex-col gap-3 mb-3">
          {PERSONAS.map((p, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-blue/5 border-[0.5px] border-blue/15 rounded-lg py-3.5 px-4"
            >
              <div className="w-5 h-5 rounded-full bg-blue/12 flex items-center justify-center shrink-0">
                <span className="text-[12px] font-bold text-blue">{i + 1}</span>
              </div>
              <span className="text-[13px] font-medium text-navy leading-normal">
                {p}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
