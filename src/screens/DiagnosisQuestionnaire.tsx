import { useEffect, useState } from 'react';
import {
  Check,
  CircleAlert,
  ArrowRight,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { QUESTIONS } from '@/data/questions';
import { getEvidenceChecklist, CAT_LABELS } from '@/data/evidence';
import { api } from '@/api';
import type { Answers } from '@/types';

type Screen =
  | 'intro'
  | number
  | 'oos'
  | 'exit'
  | 'police'
  | 'warningStage'
  | 'civil'
  | 'moneyMismatch'
  | 'selfIncrimination'
  | 'result';

// Values that pause the flow to show an inline follow-up instead of auto-advancing.
const PAUSE_VALUES: Record<string, string[]> = {
  q1: ['모름'],
  q2: ['이유모름'],
  q10: ['받음'],
};

const SELF_INCRIMINATION_VALUES = ['도박환전', '환치기', '대리인출송금'];

const REFERENCE_TODAY = new Date();
REFERENCE_TODAY.setHours(0, 0, 0, 0);
const TODAY_ISO = [
  REFERENCE_TODAY.getFullYear(),
  String(REFERENCE_TODAY.getMonth() + 1).padStart(2, '0'),
  String(REFERENCE_TODAY.getDate()).padStart(2, '0'),
].join('-');

export function DiagnosisQuestionnaire({
  onBack,
  onNext,
  onDdayChange,
  onAnswersChange,
}: {
  onBack: () => void;
  onNext: () => void;
  onDdayChange: (d: number | null) => void;
  onAnswersChange: (a: Answers) => void;
}) {
  const [screen, setScreen] = useState<Screen>('intro');
  const [returnTo, setReturnTo] = useState<Screen>('intro');
  const [freeText, setFreeText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [intakeSummary, setIntakeSummary] = useState<string | null>(null);
  const [intakeError, setIntakeError] = useState<string | null>(null);
  const [ans, setAns] = useState<Answers>({});

  useEffect(() => {
    document.querySelector('main')?.scrollTo(0, 0);
  }, [screen]);

  const set = (key: string, val: string | string[]) =>
    setAns((prev) => ({ ...prev, [key]: val }));

  const submitIntake = async () => {
    const text = freeText.trim();
    if (!text) {
      setScreen(0);
      return;
    }
    setParsing(true);
    setIntakeError(null);
    try {
      const res = await api.parseIntake(text);
      setAns((prev) => ({ ...res.answers, ...prev }));
      setIntakeSummary(res.summary);
    } catch (err) {
      setIntakeError(
        err instanceof Error ? err.message : '자동 채움에 실패했습니다.',
      );
    } finally {
      setParsing(false);
      setScreen(0);
    }
  };

  const branch = (to: Screen) => {
    setReturnTo(screen);
    setScreen(to);
  };

  const advance = (qIdx: number, value?: string) => {
    const q = QUESTIONS[qIdx];
    if (q.id === 'q1') {
      if (value === '경찰') {
        branch('police');
        return;
      }
      if (value === '경보') {
        branch('warningStage');
        return;
      }
      if (value === '민사') {
        branch('civil');
        return;
      }
    }
    if (q.id === 'q5' && value === '더받음') {
      branch('moneyMismatch');
      return;
    }
    if (qIdx === QUESTIONS.length - 1) {
      finish();
      return;
    }
    setScreen(qIdx + 1);
  };

  const finish = () => {
    const noticeDate =
      ans.q10 === '받음' ? (ans.q10_date as string | undefined) : undefined;
    if (noticeDate) {
      const deadline = new Date(noticeDate);
      deadline.setMonth(deadline.getMonth() + 2);
      onDdayChange(
        Math.ceil((deadline.getTime() - REFERENCE_TODAY.getTime()) / 86400000),
      );
    } else {
      onDdayChange(null); // 공고 전(또는 날짜 미상) — 마감일 미확정
    }
    onAnswersChange(ans);
    setScreen('result');
  };

  const handleQ8Next = (qIdx: number) => {
    const selected = (ans.q8 as string[]) ?? [];
    if (selected.includes('접근매체양도')) {
      branch('exit');
      return;
    }
    if (selected.some((v) => SELF_INCRIMINATION_VALUES.includes(v))) {
      branch('selfIncrimination');
      return;
    }
    advance(qIdx);
  };

  const q = typeof screen === 'number' ? QUESTIONS[screen] : null;

  const dateOrderError = (id: 'q9' | 'q10_date'): string | null => {
    const deposit = ans.q7_date as string | undefined;
    const freeze = ans.q9 as string | undefined;
    const notice = ans.q10_date as string | undefined;
    if (id === 'q9' && freeze && deposit && freeze < deposit)
      return '계좌 정지일이 입금일보다 앞설 수 없습니다.';
    if (id === 'q10_date' && notice && freeze && notice < freeze)
      return '공고 통지일이 계좌 정지일보다 앞설 수 없습니다.';
    if (id === 'q10_date' && notice && deposit && notice < deposit)
      return '공고 통지일이 입금일보다 앞설 수 없습니다.';
    return null;
  };

  const canAdvance = () => {
    if (!q) return false;
    if (q.type === 'date') {
      if (q.id === 'q10') return true;
      return !!(ans[q.id] as string) && !dateOrderError('q9');
    }
    if (q.type === 'caseDetails') {
      return (
        !!ans.q7_date &&
        !!ans.q7_amount &&
        !!ans.q7_dealAmount &&
        !!ans.q7_noticeAmount &&
        !!ans.q7_balance
      );
    }
    if (q.type === 'multi')
      return Array.isArray(ans[q.id]) && (ans[q.id] as string[]).length > 0;
    if (q.type === 'single') {
      const val = ans[q.id] as string;
      if (!val) return false;
      // "모름"/"이유모름" 같은 pause 값은 별도 인라인 안내로만 진행되므로
      // 메인 "다음" 버튼은 계속 비활성 상태로 둔다.
      return !PAUSE_VALUES[q.id]?.includes(val);
    }
    return !!ans[q.id];
  };

  // ── INTRO: 자유 서술 ──────────────────────────────────────────────────────
  if (screen === 'intro')
    return (
      <div className="step-section max-w-150 mx-auto pt-8 px-5 pb-14 md:pt-14 md:px-12 md:pb-20">
        <div className="text-[11px] text-blue font-semibold tracking-widest mb-2">
          STEP 1 · 상황 진단
        </div>
        <h2 className="font-serif-kr text-2xl font-bold text-navy leading-[1.35] tracking-[-0.01em] mb-2.5">
          무슨 일이 있었는지 편하게 적어주세요.
        </h2>
        <p className="font-sans-kr text-[13px] text-navy/52 leading-[1.75] mb-6">
          법률 용어를 쓰실 필요 없습니다. 언제 무엇을 팔았고, 어떤 연락을
          받았는지 아는 대로만 적어주세요. 건너뛰고 질문에 바로 답하셔도 됩니다.
        </p>
        <textarea
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          placeholder="예: 당근에서 아이폰 팔았는데 어제 은행에서 계좌 정지됐다고 문자가 왔어요..."
          className="w-full h-40 py-3.5 px-4 border-[0.5px] border-border rounded-[10px] text-[13.5px] text-navy bg-white outline-none resize-none leading-[1.7] box-border focus:border-blue/50 mb-6"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn-secondary" onClick={onBack} disabled={parsing}>
            ← 이전
          </button>
          <button
            className="btn-primary flex items-center gap-1.5"
            onClick={() => void submitIntake()}
            disabled={parsing}
          >
            {parsing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                읽는 중…
              </>
            ) : (
              <>
                {freeText.trim() ? <Sparkles size={14} /> : null}
                다음 →
              </>
            )}
          </button>
          <button
            className="text-[13px] text-navy/45 bg-transparent border-none cursor-pointer"
            onClick={() => setScreen(0)}
            disabled={parsing}
          >
            건너뛰기
          </button>
        </div>
        {freeText.trim() && !parsing && (
          <p className="font-sans-kr text-[11.5px] text-navy/40 leading-[1.6] mt-2.5">
            적어주신 내용을 먼저 읽고, 알아낼 수 있는 답변은 미리 채워둡니다.
            채워진 답은 다음 화면에서 직접 고칠 수 있습니다.
          </p>
        )}
      </div>
    );

  // ── 경찰 길 ────────────────────────────────────────────────────────────────
  if (screen === 'police')
    return (
      <div className="step-section max-w-140 mx-auto py-10 px-5 md:py-20 md:px-12">
        <div className="font-serif-kr text-[22px] font-bold text-navy mb-2.5">
          지금 필요한 건 이의제기신청서가 아닙니다
        </div>
        <p className="font-sans-kr text-sm text-navy/55 leading-[1.8] mb-6">
          계좌가 정지되지 않았다면 이의제기신청서는 필요하지 않습니다. 지금
          필요한 것은 <b>진술서</b>입니다.
          <br />
          <br />
          반대편에서 돈을 보낸 사람도 "물건을 산다"고 믿고 보냈다면, 법이 말하는
          보이스피싱이 아니라 일반 사기입니다. 그래서 계좌는 묶이지 않고 사건이
          경찰로 갑니다.
          <br />
          <br />
          참고인 조사라고 해도 거래내역 전체를 확인받는 경우가 많습니다. 대화
          기록·거래내역·물건을 넘긴 증거를 미리 정리해 가세요.
        </p>
        <div className="bg-warm/6 border-[0.5px] border-warm/25 rounded-xl py-4 px-5 mb-6">
          <div className="text-[11px] text-warm font-semibold mb-1">참고</div>
          <div className="text-[11.5px] text-navy/60 leading-[1.6]">
            참고인 조사에서 학력·동거인·재산·직업·통장 거래내역까지 전수
            조사당한 사례가 있습니다. 미리 준비해 가야 합니다.
          </div>
        </div>
        <button className="btn-secondary" onClick={() => setScreen(returnTo)}>
          ← 이전
        </button>
      </div>
    );

  // ── 경보 단계 ──────────────────────────────────────────────────────────────
  if (screen === 'warningStage')
    return (
      <div className="step-section max-w-140 mx-auto py-10 px-5 md:py-20 md:px-12">
        <div className="font-serif-kr text-[22px] font-bold text-navy mb-2.5">
          아직 계좌가 묶이지 않았습니다
        </div>
        <p className="font-sans-kr text-sm text-navy/55 leading-[1.8] mb-6">
          지금이 가장 중요한 시점입니다. 대면으로 물건을 넘기셨다면 증거는
          시간이 지나면 복구할 수 없습니다. 지금 당장 아래를 저장해 두세요.
        </p>
        <div className="card py-4 px-4.5 mb-6">
          {[
            '거래 대화 전체 스크린샷 (일부만 말고 처음부터 끝까지)',
            '상대방 프로필 화면 (닉네임·아이디·평점)',
            '거래 장소와 시각을 적어둔 메모',
            '이동 기록 — 지도 앱 타임라인, 교통카드 내역',
            '거래 장소 주변 CCTV가 있다면 오늘 안에 보존 요청 (보통 30일이면 지워집니다)',
            '물건 사진, 원래 구매했던 영수증',
          ].map((t, i) => (
            <div
              key={i}
              className={`text-[13px] text-navy/70 py-2 leading-[1.6] ${
                i < 5 ? 'border-b-[0.5px] border-navy/7' : ''
              }`}
            >
              {t}
            </div>
          ))}
        </div>
        <p className="text-[12.5px] text-navy/50 leading-[1.7] mb-6">
          계좌가 실제로 묶이면 그때 다시 오세요. 저장해 두신 자료로 바로
          소명서를 만들 수 있습니다.
        </p>
        <button className="btn-secondary" onClick={() => setScreen(returnTo)}>
          ← 이전
        </button>
      </div>
    );

  // ── 민사 ──────────────────────────────────────────────────────────────────
  if (screen === 'civil')
    return (
      <div className="step-section max-w-140 mx-auto py-10 px-5 md:py-20 md:px-12">
        <div className="font-serif-kr text-[22px] font-bold text-navy mb-2.5">
          소송 서류를 받으셨군요
        </div>
        <p className="font-sans-kr text-sm text-navy/55 leading-[1.8] mb-6">
          소송 서류나 내용증명은 은행 이의제기와는 다른 절차입니다. 풀림은
          이의제기 소명서 작성을 돕는 서비스라 민사 소송 대응까지 지원해
          드리기는 어렵습니다.
          <br />
          <br />
          답변서 제출 기한이 정해져 있는 경우가 많으니, 서류에 적힌 기한을 먼저
          확인하시고 법률구조공단(132) 또는 변호사 상담을 받아보시길 권합니다.
        </p>
        <button className="btn-secondary" onClick={() => setScreen(returnTo)}>
          ← 이전
        </button>
      </div>
    );

  // ── 금액 초과입금 즉시 경고 ──────────────────────────────────────────────────
  if (screen === 'moneyMismatch')
    return (
      <div className="step-section max-w-140 mx-auto py-10 px-5 md:py-20 md:px-12">
        <div className="w-11 h-11 rounded-xl bg-warm/10 border-[0.5px] border-warm/30 flex items-center justify-center mb-4">
          <CircleAlert size={20} color="#C77B4E" strokeWidth={1.5} />
        </div>
        <div className="font-serif-kr text-[22px] font-bold text-navy mb-2.5">
          차액을 돌려달라고 하면, 절대 돌려주지 마세요
        </div>
        <p className="font-sans-kr text-sm text-navy/55 leading-[1.8] mb-6">
          약속한 금액보다 더 들어온 것은 "물건 없이 계좌만 거쳐가는" 구조일
          가능성이 있습니다.
          <br />
          <br />
          지금 돌려주시면 자금세탁의 중간 통로가 되어, 본인이 형사 책임을 지게
          될 수 있습니다. 돈은 그대로 두시고 <b>은행을 통해서만</b> 반환 절차를
          밟으세요. 은행 기록이 남아야 합니다.
        </p>
        <div className="bg-navy/4 rounded-lg py-3 px-4 mb-6 text-[11.5px] text-navy/55 leading-[1.7]">
          실제 사례에서 "외국인이라 환율 오류가 났다"며 대행인 계좌로 환불을
          요구하는 수법이 반복 확인됐습니다. 문화상품권 13.5만원을 넣고 14만원을
          환불받았다가 5천원 초과 하나로 이의제기가 통째로 거부된 사례도
          있습니다.
        </div>
        <div className="flex gap-2.5">
          <button className="btn-secondary" onClick={() => setScreen(4)}>
            ← 이전 질문으로
          </button>
          <button className="btn-primary" onClick={() => setScreen(5)}>
            이해했습니다, 계속 진행 →
          </button>
        </div>
      </div>
    );

  // ── 자기부죄 종료 화면 ────────────────────────────────────────────────────
  if (screen === 'selfIncrimination')
    return (
      <div className="step-section max-w-140 mx-auto py-10 px-5 md:py-20 md:px-12">
        <div className="w-11 h-11 rounded-xl bg-warm/10 border-[0.5px] border-warm/30 flex items-center justify-center mb-4">
          <CircleAlert size={20} color="#C77B4E" strokeWidth={1.5} />
        </div>
        <div className="font-serif-kr text-[22px] font-bold text-navy mb-2.5">
          자동 소명서 생성을 도와드리기 어렵습니다
        </div>
        <p className="font-sans-kr text-sm text-navy/55 leading-[1.8] mb-6">
          도박·환전, 환치기, 대리 인출·송금과 관련된 거래는 소명하려는 과정에서
          본인이 다른 위법(도박·외국환거래법 위반 등)을 스스로 진술하게 될 수
          있습니다. 이런 경우 AI가 문장을 대신 만들어 드리는 것이 오히려 위험할
          수 있어, 이번 버전에서는 자동 생성을 도와드리지 않습니다.
          <br />
          <br />
          법률구조공단(132) 또는 변호사와 먼저 상담해 어떤 사실관계를 어떻게
          소명할지 정하신 뒤 진행하시길 권합니다.
        </p>
        <button className="btn-secondary" onClick={() => setScreen(returnTo)}>
          ← 이전
        </button>
      </div>
    );

  // ── OUT-OF-SCOPE (통장협박·통장묶기) ────────────────────────────────────────
  if (screen === 'oos')
    return (
      <div className="step-section max-w-140 mx-auto py-10 px-5 md:py-20 md:px-12">
        <div className="mb-5">
          <div className="w-11 h-11 rounded-xl bg-warm/10 border-[0.5px] border-warm/30 flex items-center justify-center mb-4">
            <CircleAlert size={20} color="#C77B4E" strokeWidth={1.5} />
          </div>
          <div className="font-serif-kr text-[22px] font-bold text-navy mb-2.5">
            이번 버전에서는 아직 도와드리지 못합니다
          </div>
          <p className="font-sans-kr text-sm text-navy/55 leading-[1.8] mb-6">
            통장협박·통장묶기 유형은 서비스 대상이 아닌 것이 아니라, 다음 순서로
            준비 중입니다.
            <br />
            <br />
            <b>계좌를 푸는 것은 은행 이의제기입니다.</b> 경찰 확인서는 그
            소명자료로 쓰입니다. 신고만으로는 해제되지 않으니 기한 안에 은행에
            반드시 접수하세요.
            <br />
            <br />
            통장협박은 통신사기피해환급법 제7조 제1항 <b>제3호</b>로 다투는
            유형이고, 2024년 8월 개정으로 피해금과 무관한 부분은 신속하게
            해제받을 수 있습니다. 은행 창구에서 이 조항을 말씀하세요.
          </p>
          <div className="card py-4 px-4.5 mb-5">
            <div className="text-xs font-semibold text-navy mb-2">
              실제 확인된 순서
            </div>
            <div className="text-[13px] text-navy/60 py-1 border-b-[0.5px] border-navy/7">
              ① 경찰 신고 → "범죄 가담 혐의 정황 없음" 확인서 발급
            </div>
            <div className="text-[13px] text-navy/60 py-1 border-b-[0.5px] border-navy/7">
              ② 그 확인서를 소명자료로 첨부
            </div>
            <div className="text-[13px] text-navy/60 py-1">
              ③ 은행에 이의제기 접수 — 여기서 풀립니다
            </div>
          </div>
          <div className="bg-warm/6 border-[0.5px] border-warm/25 rounded-xl py-4 px-5 mb-5">
            <div className="text-[11px] text-warm font-semibold mb-1">
              ⚠️ 합의금을 주지 마세요
            </div>
            <div className="text-[11.5px] text-navy/60 leading-[1.6]">
              사기범에게는 애초에 해제 권한이 없어, 돈만 잃고 계좌는 그대로인
              사례가 확인됐습니다.
            </div>
          </div>
          <div className="card py-4 px-4.5 mb-5">
            <div className="text-xs font-semibold text-navy mb-2">
              지금 상담받을 수 있는 곳
            </div>
            {[
              '금융감독원 민원센터 1332 (평일 09:00–18:00)',
              '법률구조공단 공익 법률 서비스 132',
              '경찰청 사이버범죄 신고 시스템 (ecrm.police.go.kr)',
            ].map((t, i) => (
              <div
                key={i}
                className={`text-[13px] text-navy/60 py-1 ${
                  i < 2 ? 'border-b-[0.5px] border-navy/7' : ''
                }`}
              >
                {t}
              </div>
            ))}
          </div>
          <button className="btn-secondary" onClick={() => setScreen(returnTo)}>
            ← 이전
          </button>
        </div>
      </div>
    );

  // ── EXIT (접근매체 양도) ────────────────────────────────────────────────────
  if (screen === 'exit')
    return (
      <div className="step-section max-w-140 mx-auto py-10 px-5 md:py-20 md:px-12">
        <div className="w-11 h-11 rounded-xl bg-warm/10 border-[0.5px] border-warm/30 flex items-center justify-center mb-4">
          <ArrowRight size={20} color="#C77B4E" strokeWidth={1.5} />
        </div>
        <div className="font-serif-kr text-[22px] font-bold text-navy mb-2.5">
          풀림이 도움드리기 어렵습니다
        </div>
        <p className="font-sans-kr text-sm text-navy/55 leading-[1.8] mb-6">
          통장·카드 등 접근매체를 타인에게 제공한 경우는 전자금융거래법상 그
          자체로 피의자 신분이 되어 서비스 대상에서 제외됩니다.
          <br />
          <br />이 상황은 법률 전문가의 개인 상담이 필요합니다.
          법률구조공단(132)에서 무료 상담을 받으실 수 있습니다.
        </p>
        <button className="btn-secondary" onClick={() => setScreen(returnTo)}>
          ← 이전
        </button>
      </div>
    );

  // ── RESULT (은행 길) ────────────────────────────────────────────────────────
  if (screen === 'result') {
    const freeze = (ans.q9 ?? '') as string;
    const noticeDate =
      ans.q10 === '받음' ? (ans.q10_date as string | undefined) : undefined;
    let ddayLabel = '';
    let urgent = false;
    let noDeadlineYet = false;
    if (noticeDate) {
      const deadline = new Date(noticeDate);
      deadline.setMonth(deadline.getMonth() + 2);
      const dday = Math.ceil(
        (deadline.getTime() - REFERENCE_TODAY.getTime()) / 86400000,
      );
      ddayLabel = dday <= 0 ? '기한 도과' : `D-${dday}`;
      urgent = dday <= 14;
    } else if (freeze) {
      const freezeDate = new Date(freeze);
      const daysSince = Math.floor(
        (REFERENCE_TODAY.getTime() - freezeDate.getTime()) / 86400000,
      );
      ddayLabel = `${daysSince}일 경과`;
      noDeadlineYet = true;
    }

    const dealAmount = Number(ans.q7_dealAmount ?? 0);
    const noticeAmount = Number(ans.q7_noticeAmount ?? 0);
    const amountsMismatch =
      dealAmount > 0 && noticeAmount > 0 && dealAmount !== noticeAmount;

    const checklist = getEvidenceChecklist(ans);
    const mustItems = checklist.filter((c) => c.priority === '필수');
    const purposeLabel: Record<string, string> = {
      실물중고: '중고거래 사기에 연루된 단순 경유 계좌로 추정',
      상품권: '상품권 대금 관련 3자사기 의심',
      게임재화: '게임 재화 거래 관련 3자사기 의심',
      팬덤굿즈: '팬덤 굿즈 거래 관련 3자사기 의심',
      금귀금속외화: '금·귀금속·외화 거래 관련 3자사기 의심',
      암호화폐: '암호화폐 거래 관련 3자사기 의심',
      용역: '용역 대금 관련 3자사기 의심',
      없음: '계좌 정상성 위주로 소명 필요',
    };

    return (
      <div className="step-section max-w-160 mx-auto pt-8 px-5 pb-14 md:pt-14 md:px-12 md:pb-20">
        <div className="text-[11px] text-blue font-semibold tracking-widest mb-2">
          STEP 1 · 진단 완료
        </div>
        <h1 className="font-serif-kr text-[28px] font-bold text-navy mb-6 tracking-[-0.01em]">
          상황 진단이 완료되었습니다
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-7">
          <div className="card py-4.5 px-5">
            <div className="text-[11px] font-semibold text-navy/40 mb-1.5">
              추정 유형
            </div>
            <div className="font-serif-kr text-[18px] font-bold text-blue mb-1">
              은행 길 · 이의제기
            </div>
            <div className="text-[11.5px] text-navy/50 leading-normal">
              {purposeLabel[ans.q3 as string] ?? '3자사기 의심'}
            </div>
            <div className="text-[10px] text-navy/35 mt-2 pt-2 border-t-[0.5px] border-navy/7">
              통신사기피해환급법 제7조 관련 사기이용계좌 해당 여부 확인 대상
            </div>
          </div>
          <div className="card py-4.5 px-5">
            <div className="text-[11px] font-semibold text-navy/40 mb-1.5">
              이의제기 기한
            </div>
            <div
              className={`font-serif-kr text-[22px] font-bold mb-1 ${
                urgent ? 'text-warm' : 'text-blue'
              }`}
            >
              {ddayLabel || '—'}
            </div>
            <div
              className={`text-[11.5px] leading-normal ${
                urgent ? 'text-warm' : 'text-navy/50'
              }`}
            >
              {noDeadlineYet
                ? '공고 전이라 마감 미확정 — 지금 바로 제출 가능'
                : ddayLabel === '기한 도과'
                  ? '기한 도과 — 금감원 상담 필요'
                  : urgent
                    ? '임박 — 서두르세요'
                    : '충분한 여유가 있습니다'}
            </div>
          </div>
        </div>

        <div className="bg-blue/6 border-[0.5px] border-blue/20 rounded-xl py-4 px-5 mb-6">
          <div className="text-[11px] text-blue font-semibold mb-1">
            기한 관련 참고
          </div>
          <div className="text-[11.5px] text-navy/60 leading-[1.6]">
            이의제기 기한은 지급정지일이 아니라{' '}
            <b>채권소멸절차 개시 공고일로부터 2개월</b>입니다. 공고를 기다리실
            필요 없이 지금 바로 낼 수 있고, 객관적 자료로 충분히 소명되면
            2개월을 다 기다리지 않고도 해제될 수 있습니다(법 제8조②2호 단서).
            소명서 초안에 이 조항을 반영해 두었습니다.
          </div>
        </div>

        {amountsMismatch && (
          <div className="bg-warm/6 border-[0.5px] border-warm/25 rounded-xl py-4 px-5 mb-6">
            <div className="text-[11px] text-warm font-semibold mb-1">
              금액 불일치 확인됨
            </div>
            <div className="text-[11.5px] text-navy/60 leading-[1.6]">
              거래금액({dealAmount.toLocaleString()}원)과 공고금액(
              {noticeAmount.toLocaleString()}원)이 다릅니다. 환급 청구의 상한은
              "받은 돈"이 아니라 "공고되어 소멸된 채권액"이므로, 청구액을
              공고금액 이하로 맞춰야 초과분 기각을 피할 수 있습니다.
            </div>
          </div>
        )}

        <div className="card py-4.5 px-5 mb-6">
          <div className="text-xs font-semibold text-navy mb-3">
            다음 단계에서 준비하실 자료 — {checklist.length}종
          </div>
          {mustItems.map((item, i) => (
            <div
              key={item.id}
              className={`flex items-center gap-2.5 py-1.75 ${
                i < mustItems.length - 1 ? 'border-b-[0.5px] border-navy/7' : ''
              }`}
            >
              <span className="text-[9.5px] font-bold text-blue bg-blue/10 py-0.5 px-1.75 rounded-[10px] whitespace-nowrap">
                필수
              </span>
              <span className="text-[13px] text-navy">{item.label}</span>
              <span className="text-[11px] text-navy/38 ml-auto">
                {CAT_LABELS[item.category].title.split('.')[0]}
              </span>
            </div>
          ))}
          {checklist.filter((c) => c.priority !== '필수').length > 0 && (
            <div className="text-xs text-navy/40 mt-2 pt-2 border-t-[0.5px] border-navy/7">
              + 권장·가점 자료{' '}
              {checklist.filter((c) => c.priority !== '필수').length}종은 다음
              단계에서 안내됩니다
            </div>
          )}
        </div>

        <div className="flex gap-2.5">
          <button
            className="btn-secondary"
            onClick={() => setScreen(QUESTIONS.length - 1)}
          >
            ← 이전
          </button>
          <button className="btn-primary text-sm py-3.25 px-8" onClick={onNext}>
            증거 준비로 진행 →
          </button>
        </div>
      </div>
    );
  }

  // ── QUESTION screen ────────────────────────────────────────────────────────
  if (!q) return null;
  const qNum = screen as number;

  const toggleMulti = (val: string) => {
    const prev = (ans[q.id] as string[] | undefined) ?? [];
    const exclusive =
      q.id === 'q13' ? '없음' : q.id === 'q8' ? '해당없음' : undefined;
    if (!exclusive) {
      set(
        q.id,
        prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val],
      );
      return;
    }
    if (val === exclusive) {
      set(q.id, prev.includes(exclusive) ? [] : [exclusive]);
      return;
    }
    const withoutExclusive = prev.filter((v) => v !== exclusive);
    set(
      q.id,
      withoutExclusive.includes(val)
        ? withoutExclusive.filter((v) => v !== val)
        : [...withoutExclusive, val],
    );
  };

  return (
    <div className="step-section max-w-150 mx-auto pt-8 px-5 pb-14 md:pt-14 md:px-12 md:pb-20">
      <div className="text-[11px] text-blue font-semibold tracking-widest mb-1">
        STEP 1 · 상황 진단
      </div>

      <div className="flex items-center gap-2 mb-8">
        <div className="flex-1 h-0.75 rounded-[2px] bg-navy/8 overflow-hidden">
          <div
            className="h-full bg-blue rounded-[2px] transition-[width] duration-300 ease-in-out"
            style={{ width: `${((qNum + 1) / QUESTIONS.length) * 100}%` }}
          />
        </div>
        <span className="text-[11px] font-semibold text-navy/45 whitespace-nowrap">
          Q{qNum + 1} / {QUESTIONS.length}
        </span>
      </div>

      {intakeSummary && (
        <div className="bg-blue/5 border-[0.5px] border-blue/20 rounded-xl py-3.5 px-4 mb-6">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles size={12} className="text-blue" />
            <span className="text-[11px] text-blue font-semibold">
              적어주신 내용에서 읽어낸 것
            </span>
            <button
              onClick={() => setIntakeSummary(null)}
              aria-label="닫기"
              className="ml-auto bg-transparent border-none cursor-pointer text-navy/30 text-base leading-none"
            >
              ×
            </button>
          </div>
          <div className="text-[11.5px] text-navy/60 leading-[1.6]">
            {intakeSummary} 아래 답변이 미리 채워져 있다면 확인만 해주세요.
            다르면 다시 고르시면 됩니다.
          </div>
        </div>
      )}

      {intakeError && (
        <div className="bg-warm/6 border-[0.5px] border-warm/25 rounded-xl py-3 px-4 mb-6 text-[11.5px] text-navy/60 leading-[1.6]">
          자동 채움을 쓰지 못했습니다 ({intakeError}). 질문에 직접 답해주세요.
        </div>
      )}

      <div className="text-[11.5px] font-semibold text-blue mb-2">{q.tag}</div>
      <h2
        className={`font-serif-kr text-2xl font-bold text-navy leading-[1.35] tracking-[-0.01em] ${
          q.note ? 'mb-2.5' : 'mb-6'
        }`}
      >
        {q.question}
      </h2>
      {q.note && (
        <p className="font-sans-kr text-[13px] text-navy/52 leading-[1.75] mb-6">
          {q.note}
        </p>
      )}

      {/* Single-select */}
      {q.type === 'single' && (
        <div className="flex flex-col gap-2 mb-6">
          {q.options!.map((opt) => {
            const sel = ans[q.id] === opt.value;
            return (
              <div key={opt.value}>
                <button
                  onClick={() => set(q.id, opt.value)}
                  className={`w-full text-left py-3.5 px-4.5 rounded-[10px] cursor-pointer transition-all duration-[120ms] flex items-center gap-3 ${
                    sel
                      ? 'bg-blue/6 border border-blue/45'
                      : 'bg-white border border-border'
                  }`}
                >
                  <div
                    className={`w-4.5 h-4.5 rounded-full shrink-0 flex items-center justify-center ${
                      sel ? 'bg-blue' : 'border-[1.5px] border-navy/20'
                    }`}
                  >
                    {sel && <Check size={11} color="white" strokeWidth={2.5} />}
                  </div>
                  <span
                    className={`text-[13.5px] ${
                      sel ? 'font-semibold text-blue' : 'font-normal text-navy'
                    }`}
                  >
                    {opt.label}
                  </span>
                </button>
                {sel && q.warnings?.[opt.value] && (
                  <div className="mt-2 bg-warm/6 border-[0.5px] border-warm/25 rounded-lg py-3 px-4 text-[12px] text-navy/65 leading-[1.6]">
                    {q.warnings[opt.value]}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Q1 "잘 모르겠습니다" 인라인 도움말 */}
      {q.id === 'q1' && ans.q1 === '모름' && (
        <div className="bg-navy/4 rounded-lg py-3.5 px-4 mb-6 text-[12.5px] text-navy/65 leading-[1.75]">
          은행이면 계좌가 묶인 것이고, 경찰이면 안 묶였을 가능성이 큽니다. 아직
          아무 연락이 없다면 "이상한 게 보입니다"를, 법원·내용증명이라면 "소송
          서류"를 골라주세요. 위 선택지 중 하나를 다시 골라주시면 진행됩니다.
        </div>
      )}

      {/* Q2 "이유를 모르는 돈" 인라인 서브질문 */}
      {q.id === 'q2' && ans.q2 === '이유모름' && (
        <div className="bg-navy/4 rounded-lg py-3.5 px-4 mb-6">
          <div className="text-[12.5px] font-semibold text-navy mb-2">
            혹시 협박 메시지를 받았거나, 예금주명이 이상한 소액이 입금된 적
            있나요?
          </div>
          <div className="flex gap-2">
            <button
              className="btn-secondary text-[13px]"
              onClick={() => branch('oos')}
            >
              예, 그런 신호가 있었습니다
            </button>
            <button
              className="btn-primary text-[13px]"
              onClick={() => advance(qNum)}
            >
              아니요, 그런 건 없었습니다
            </button>
          </div>
        </div>
      )}

      {q.type === 'single' && (
        <div className="flex gap-2.5 mb-6">
          <button
            className="btn-secondary"
            onClick={() => setScreen(qNum > 0 ? qNum - 1 : 'intro')}
          >
            ← 이전
          </button>
          {/* pause 값(모름/이유모름/받음 등)이 선택된 동안은 전용 인라인 UI가
              진행을 대신하므로, 똑같은 "다음 →" 라벨이 중복 노출되지 않게 숨긴다. */}
          {!PAUSE_VALUES[q.id]?.includes(ans[q.id] as string) && (
            <button
              className="btn-primary"
              onClick={() => advance(qNum, ans[q.id] as string)}
              disabled={!canAdvance()}
            >
              다음 →
            </button>
          )}
        </div>
      )}

      {/* Q10 "공고 통지 받음" 인라인 날짜 입력 */}
      {q.id === 'q10' && ans.q10 === '받음' && (
        <div className="bg-navy/4 rounded-lg py-3.5 px-4 mb-6">
          <div className="text-[12.5px] font-semibold text-navy mb-2">
            공고를 받으신 날짜가 언제인가요?
          </div>
          <input
            type="date"
            value={(ans.q10_date as string) ?? ''}
            onChange={(e) => set('q10_date', e.target.value)}
            min={((ans.q9 ?? ans.q7_date) as string) || undefined}
            max={TODAY_ISO}
            className="w-full py-3 px-3.5 border-[0.5px] border-border rounded-[10px] text-[13.5px] text-navy outline-none bg-white box-border focus:border-blue/50 mb-3"
          />
          {dateOrderError('q10_date') && (
            <div className="text-[11.5px] text-warm mb-3">
              {dateOrderError('q10_date')}
            </div>
          )}
          <button
            className="btn-primary text-[13px]"
            onClick={() => advance(qNum)}
            disabled={!ans.q10_date || !!dateOrderError('q10_date')}
          >
            다음 →
          </button>
        </div>
      )}

      {/* Multi-select */}
      {q.type === 'multi' && (
        <>
          <div className="flex flex-col gap-2 mb-7">
            {q.options!.map((opt) => {
              const sel = ((ans[q.id] as string[]) ?? []).includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleMulti(opt.value)}
                  className={`text-left py-3.25 px-4.5 rounded-[10px] cursor-pointer transition-all duration-[120ms] flex items-center gap-3 ${
                    sel
                      ? 'bg-blue/6 border border-blue/40'
                      : 'bg-white border border-border'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded shrink-0 flex items-center justify-center ${
                      sel ? 'bg-blue' : 'border-[1.5px] border-navy/20'
                    }`}
                  >
                    {sel && <Check size={11} color="white" strokeWidth={2.5} />}
                  </div>
                  <span
                    className={`text-[13.5px] ${
                      sel ? 'font-semibold text-blue' : 'font-normal text-navy'
                    }`}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex gap-2.5">
            {qNum > 0 && (
              <button
                className="btn-secondary"
                onClick={() => setScreen(qNum - 1)}
              >
                ← 이전
              </button>
            )}
            <button
              className="btn-primary"
              onClick={() =>
                q.id === 'q8' ? handleQ8Next(qNum) : advance(qNum)
              }
              disabled={!canAdvance()}
            >
              다음 →
            </button>
          </div>
        </>
      )}

      {/* Date (Q9, Q10) */}
      {q.type === 'date' && (
        <>
          <div className="mb-4">
            <input
              type="date"
              value={(ans[q.id] as string) ?? ''}
              onChange={(e) => set(q.id, e.target.value)}
              min={q.id === 'q9' ? (ans.q7_date as string) || undefined : undefined}
              max={TODAY_ISO}
              className="py-3 px-3.5 border-[0.5px] border-border rounded-[10px] text-sm text-navy outline-none bg-white w-full box-border focus:border-blue/50"
            />
            {q.id === 'q9' && dateOrderError('q9') && (
              <div className="text-[11.5px] text-warm mt-2">
                {dateOrderError('q9')}
              </div>
            )}
          </div>
          <div className="flex gap-2.5">
            {qNum > 0 && (
              <button
                className="btn-secondary"
                onClick={() => setScreen(qNum - 1)}
              >
                ← 이전
              </button>
            )}
            <button
              className="btn-primary"
              onClick={() => advance(qNum)}
              disabled={!canAdvance()}
            >
              다음 →
            </button>
          </div>
        </>
      )}

      {/* Q7 caseDetails */}
      {q.type === 'caseDetails' && (
        <>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-4">
            <div>
              <div className="text-xs font-semibold text-navy/50 mb-2">
                날짜
              </div>
              <input
                type="date"
                value={(ans.q7_date as string) ?? ''}
                onChange={(e) => set('q7_date', e.target.value)}
                max={TODAY_ISO}
                className="w-full py-3 px-3.5 border-[0.5px] border-border rounded-[10px] text-[13.5px] text-navy outline-none bg-white box-border focus:border-blue/50"
              />
            </div>
            <div>
              <div className="text-xs font-semibold text-navy/50 mb-2">
                시각 (선택)
              </div>
              <input
                type="time"
                value={(ans.q7_time as string) ?? ''}
                onChange={(e) => set('q7_time', e.target.value)}
                className="w-full py-3 px-3.5 border-[0.5px] border-border rounded-[10px] text-[13.5px] text-navy outline-none bg-white box-border focus:border-blue/50"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-4">
            <div>
              <div className="text-xs font-semibold text-navy/50 mb-2">
                입금액 (원)
              </div>
              <input
                inputMode="numeric"
                placeholder="3500000"
                value={(ans.q7_amount as string) ?? ''}
                onChange={(e) =>
                  set('q7_amount', e.target.value.replace(/[^0-9]/g, ''))
                }
                className="w-full py-3 px-3.5 border-[0.5px] border-border rounded-[10px] text-[13.5px] text-navy outline-none bg-white box-border focus:border-blue/50"
              />
            </div>
            <div>
              <div className="text-xs font-semibold text-navy/50 mb-2">
                입금자명 (선택)
              </div>
              <input
                placeholder="예: 김○○"
                value={(ans.q7_depositor as string) ?? ''}
                onChange={(e) => set('q7_depositor', e.target.value)}
                className="w-full py-3 px-3.5 border-[0.5px] border-border rounded-[10px] text-[13.5px] text-navy outline-none bg-white box-border focus:border-blue/50"
              />
            </div>
          </div>

          <div className="text-xs font-semibold text-navy mb-2 mt-6">
            아래 세 금액을 각각 입력해 주세요
          </div>
          <p className="text-[11.5px] text-navy/50 leading-[1.6] mb-3">
            환급청구의 상한은 "내가 받은 돈"이 아니라 "공고되어 소멸된
            채권액"입니다. 세 값이 다르면 여기서 바로 알려드립니다.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
            <div>
              <div className="text-[11px] font-semibold text-navy/50 mb-2">
                거래금액
              </div>
              <input
                inputMode="numeric"
                placeholder="원"
                value={(ans.q7_dealAmount as string) ?? ''}
                onChange={(e) =>
                  set('q7_dealAmount', e.target.value.replace(/[^0-9]/g, ''))
                }
                className="w-full py-3 px-3 border-[0.5px] border-border rounded-[10px] text-[13px] text-navy outline-none bg-white box-border focus:border-blue/50"
              />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-navy/50 mb-2">
                공고금액
              </div>
              <input
                inputMode="numeric"
                placeholder="원"
                value={(ans.q7_noticeAmount as string) ?? ''}
                onChange={(e) =>
                  set('q7_noticeAmount', e.target.value.replace(/[^0-9]/g, ''))
                }
                className="w-full py-3 px-3 border-[0.5px] border-border rounded-[10px] text-[13px] text-navy outline-none bg-white box-border focus:border-blue/50"
              />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-navy/50 mb-2">
                계좌잔액
              </div>
              <input
                inputMode="numeric"
                placeholder="원"
                value={(ans.q7_balance as string) ?? ''}
                onChange={(e) =>
                  set('q7_balance', e.target.value.replace(/[^0-9]/g, ''))
                }
                className="w-full py-3 px-3 border-[0.5px] border-border rounded-[10px] text-[13px] text-navy outline-none bg-white box-border focus:border-blue/50"
              />
            </div>
          </div>

          {ans.q7_dealAmount &&
            ans.q7_noticeAmount &&
            ans.q7_dealAmount !== ans.q7_noticeAmount && (
              <div className="bg-warm/6 border-[0.5px] border-warm/25 rounded-lg py-3 px-4 mb-4 text-[12px] text-navy/65 leading-[1.6]">
                거래금액과 공고금액이 다릅니다. 청구액은 더 작은 쪽(공고금액)을
                기준으로 삼아야 초과분이 기각되는 것을 피할 수 있습니다.
              </div>
            )}

          <div className="flex gap-2.5 mt-2">
            {qNum > 0 && (
              <button
                className="btn-secondary"
                onClick={() => setScreen(qNum - 1)}
              >
                ← 이전
              </button>
            )}
            <button
              className="btn-primary"
              onClick={() => advance(qNum)}
              disabled={!canAdvance()}
            >
              다음 →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
