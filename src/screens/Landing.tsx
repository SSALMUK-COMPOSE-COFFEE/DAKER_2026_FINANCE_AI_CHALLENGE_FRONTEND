import { Wordmark } from '@/components/Wordmark';
import { TransactionGraph } from '@/components/TransactionGraph';

export function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div className="step-section max-w-180 mx-auto pt-8 px-5 pb-14 md:pt-16 md:px-12 md:pb-20">
      {/* Wordmark */}
      <div className="mb-8 md:mb-14 hidden md:block">
        <Wordmark size="lg" />
      </div>

      {/* Hero */}
      <div className="mb-8 md:mb-12">
        <div className="text-[28px] md:text-[42px] font-bold text-navy leading-tight tracking-[-0.02em] mb-4">
          묶인 계좌,
          <br />
          <span className="text-blue">근거로 풀립니다.</span>
        </div>
        <p className="font-sans-kr text-sm md:text-base text-navy/62 leading-[1.8] max-w-120">
          보이스피싱 피해 여파로 계좌가 부당하게 지급정지 되셨나요?
          <br className="hidden md:inline" />
          거래 내역을 업로드하면 AI가 정상 거래 근거를 분석하고,
          <br className="hidden md:inline" />
          은행에 제출할 소명서를 함께 작성해 드립니다.
        </p>
      </div>

      {/* Graph hero card */}
      <div className="card pt-6 px-5 pb-6 mb-8 md:pt-8 md:px-10 md:pb-7 md:mb-10 relative overflow-hidden">
        <div className="absolute top-4 right-4">
          <span className="text-[10px] text-navy/35 tracking-[0.08em]">
            거래 흐름 분석 예시
          </span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-5 md:gap-10">
          <TransactionGraph width={320} height={160} animated />
          <div className="min-w-0 md:min-w-40">
            <div className="mb-4.5">
              <div className="flex items-center gap-1.75 mb-1.5">
                <div className="w-2 h-2 rounded-full bg-blue" />
                <span className="text-[11px] text-navy font-medium">
                  내 계좌 (정상 판정)
                </span>
              </div>
              <div className="flex items-center gap-1.75 mb-1.5">
                <div className="w-2 h-2 rounded-full bg-warm/50" />
                <span className="text-[11px] text-navy/55">의심 경유 계좌</span>
              </div>
              <div className="flex items-center gap-1.75">
                <div className="w-4 h-px bg-navy/25" />
                <span className="text-[11px] text-navy/55">정상 거래</span>
              </div>
            </div>
            <div className="bg-blue/8 rounded-lg py-2.5 px-3 border-[0.5px] border-blue/20">
              <div className="text-[10px] text-blue font-semibold mb-0.75">
                AI 판정 결과
              </div>
              <div className="text-[11px] text-navy leading-normal">
                단순 경유 계좌
                <br />
                정상 거래 패턴 확인
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Process steps */}
      <div className="grid grid-cols-2 md:flex gap-3 mb-8 md:mb-11">
        {[
          '거래 내역 업로드',
          'AI 분석 3분',
          '소명서 초안 생성',
          '은행 제출',
        ].map((s, i) => (
          <div
            key={i}
            className="md:flex-1 bg-navy/4 rounded-lg py-3 px-3.5 border-[0.5px] border-navy/10"
          >
            <div className="text-[10px] text-blue font-semibold mb-1">
              {String(i + 1).padStart(2, '0')}
            </div>
            <div className="text-[11.5px] text-navy font-medium leading-[1.4]">
              {s}
            </div>
          </div>
        ))}
      </div>

      <button
        className="btn-primary w-full md:w-auto text-[15px] py-3.25 px-9"
        onClick={onStart}
      >
        소명서 작성 시작하기
      </button>
    </div>
  );
}
