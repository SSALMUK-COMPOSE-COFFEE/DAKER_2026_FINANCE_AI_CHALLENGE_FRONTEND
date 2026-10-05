import { useEffect, useState } from 'react';
import { Loader2, Send, Sparkles } from 'lucide-react';
import {
  APPLICATION_REASON_DOC,
  INCIDENT_REPORT_DOC,
  EVIDENCE_INDEX_DOC,
} from '@/data/document';
import { getEvidenceChecklist } from '@/data/evidence';
import { ApiError, api, applicantFromAnswers } from '@/api';
import type {
  AnalysisResponse,
  Applicant,
  Citation,
  DocKey,
  ImageExtract,
} from '@/api';
import { ApplicantForm } from '@/components/ApplicantForm';
import type { Answers } from '@/types';

const TABS: { key: DocKey; label: string; sub: string }[] = [
  { key: 'application', label: '신청서 사유란', sub: '별지 제4호서식' },
  { key: 'incident', label: '경위서', sub: '육하원칙 6단락' },
  { key: 'evidence', label: '증거 인덱스', sub: '주장 ↔ 증거 대응' },
];

const FALLBACK_DOCS: Record<DocKey, string> = {
  application: APPLICATION_REASON_DOC,
  incident: INCIDENT_REPORT_DOC,
  evidence: EVIDENCE_INDEX_DOC,
};

const DRAFT_STAGES = [
  '문진 답변을 정리하고 있어요',
  '증거 자료를 문서에 연결하고 있어요',
  '경위를 시간 순서로 구성하고 있어요',
  '문장을 다듬고 있어요',
];

// 배경에 깔리는 문서 모양 줄 너비(%)
const GHOST_LINES = [
  40, 0, 96, 100, 88, 72, 0, 100, 94, 98, 60, 0, 92, 100, 80,
];

function DraftSkeleton() {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setStage((s) => (s + 1) % DRAFT_STAGES.length),
      2400,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="relative min-h-140 overflow-hidden rounded-xl"
      aria-busy="true"
      aria-live="polite"
    >
      {/* 흐릿한 문서 실루엣 */}
      <div className="absolute inset-0 px-1 pt-2 space-y-3.5 opacity-60">
        {GHOST_LINES.map((w, i) =>
          w === 0 ? (
            <div key={i} className="h-3" />
          ) : (
            <div
              key={i}
              className={`skeleton-line ${i === 0 ? 'h-5 mx-auto mb-6' : 'h-2.5'}`}
              style={{ width: `${w}%`, animationDelay: `${i * 0.07}s` }}
            />
          ),
        )}
      </div>

      {/* 은은한 오로라 + 페이드 */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-120 h-120 rounded-full bg-blue/10 blur-3xl animate-pulse-ring" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,white_0%,rgb(255_255_255/0.85)_35%,rgb(255_255_255/0)_75%)]" />

      {/* 중앙 카드 */}
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="flex flex-col items-center text-center animate-fade-in-up">
          <div className="relative mb-5 flex h-14 w-14 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-blue/20 animate-ping [animation-duration:2.4s]" />
            <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-blue to-[#7c5cff] shadow-[0_8px_24px_rgba(37,99,235,0.35)]">
              <Sparkles size={22} className="text-white animate-sparkle" />
            </span>
          </div>

          <div className="text-[16px] font-bold text-navy tracking-[-0.01em]">
            AI가 소명서 초안을 작성하고 있어요
          </div>
          <div
            key={stage}
            className="mt-1.5 h-5 text-[12.5px] text-navy/50 animate-fade-in-up"
          >
            {DRAFT_STAGES[stage]}
          </div>

          <div className="mt-5 flex gap-1.5">
            {DRAFT_STAGES.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === stage ? 'w-6 bg-blue' : 'w-1.5 bg-blue/20'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DocumentEditor({
  answers,
  analysis,
  checkedEvidence,
  memo,
  imageNotes,
  applicant,
  onApplicantChange,
  onDocsChange,
  onBack,
  onNext,
}: {
  answers: Answers;
  analysis: AnalysisResponse | null;
  checkedEvidence: string[];
  memo: string;
  imageNotes: ImageExtract[];
  applicant: Applicant;
  onApplicantChange: (next: Applicant) => void;
  onDocsChange: (docs: Record<DocKey, string>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [docs, setDocs] = useState<Record<DocKey, string>>(FALLBACK_DOCS);
  const [activeTab, setActiveTab] = useState<DocKey>('application');
  const [citations, setCitations] = useState<Citation[]>([]);
  const [source, setSource] = useState<'llm' | 'template' | 'local'>('local');
  const [drafting, setDrafting] = useState(true);
  const [draftError, setDraftError] = useState<string | null>(null);

  const [instruction, setInstruction] = useState('');
  const [rewriting, setRewriting] = useState(false);
  const [rewriteError, setRewriteError] = useState<string | null>(null);

  const checklist = getEvidenceChecklist(answers);
  useEffect(() => {
    onDocsChange(docs);
  }, [docs, onDocsChange]);

  const runDraft = async (ap: Applicant) => {
    setDrafting(true);
    setDraftError(null);
    try {
      const res = await api.draftDocuments({
        answers,
        analysis,
        checked_evidence: checkedEvidence,
        memo,
        applicant: ap,
        image_notes: imageNotes,
      });
      setDocs({
        application: res.application,
        incident: res.incident,
        evidence: res.evidence_index,
      });
      setCitations(res.citations);
      setSource(res.generated_by);
    } catch (err) {
      setDraftError(
        err instanceof Error ? err.message : '초안 생성에 실패했습니다.',
      );
      setSource('local');
    } finally {
      setDrafting(false);
    }
  };

  useEffect(() => {
    const seeded = {
      ...applicant,
      bank: applicant.bank || applicantFromAnswers(answers).bank,
    };
    if (seeded.bank !== applicant.bank) onApplicantChange(seeded);
    void runDraft(seeded);
  }, []);

  const runRewrite = async () => {
    const trimmed = instruction.trim();
    if (!trimmed || rewriting) return;
    setRewriting(true);
    setRewriteError(null);
    try {
      const res = await api.rewriteDocument({
        doc_key: activeTab,
        content: docs[activeTab],
        instruction: trimmed,
        answers,
      });
      setDocs((prev) => ({ ...prev, [activeTab]: res.content }));
      setInstruction('');
    } catch (err) {
      setRewriteError(
        err instanceof ApiError && err.status === 503
          ? 'AI 재작성을 지금은 쓸 수 없습니다. 문서를 직접 수정해 주세요.'
          : err instanceof Error
            ? err.message
            : '재작성에 실패했습니다.',
      );
    } finally {
      setRewriting(false);
    }
  };

  const badge = drafting
    ? '초안 생성 중…'
    : source === 'llm'
      ? `AI 생성 · 증거 ${checklist.length}종 반영`
      : source === 'template'
        ? `표준 서식 기반 · 증거 ${checklist.length}종 반영`
        : `오프라인 초안 · 증거 ${checklist.length}종`;

  return (
    <div className="step-section pt-6 md:pt-14 h-full">
      <div className="px-5 md:px-12 mb-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[11px] text-blue font-semibold tracking-widest">
            STEP 4
          </span>
          <span className="text-[11px] text-blue bg-blue/10 py-0.5 px-2 rounded-full font-semibold">
            {badge}
          </span>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="font-serif-kr text-[28px] font-bold text-navy tracking-[-0.01em]">
            소명서 초안 편집
          </h1>
          <div className="flex gap-2">
            <button
              className="btn-primary text-[13px]"
              onClick={onNext}
              disabled={drafting}
            >
              완성 — 제출 지원으로
            </button>
          </div>
        </div>
        <p className="font-sans-kr text-[13.5px] text-navy/50 mt-1.5">
          이의제기신청서 사유란·경위서·증거 인덱스 3종이 함께 준비됩니다. 문서를
          직접 검토하고 필요한 부분을 고쳐 쓰세요.
        </p>

        <div className="mt-3">
          <ApplicantForm
            value={applicant}
            onChange={onApplicantChange}
            onRedraft={() => void runDraft(applicant)}
            redrafting={drafting}
          />
        </div>

        {draftError && (
          <div className="mt-3 bg-warm/6 border-[0.5px] border-warm/25 rounded-lg py-2.5 px-3.5 text-[11.5px] text-navy/65 leading-[1.6]">
            초안 서버에 연결하지 못했습니다 ({draftError}). 표준 서식 초안을
            대신 띄웠습니다.
          </div>
        )}
      </div>

      <div className="px-5 md:px-12 mb-2 flex gap-1.5 overflow-x-auto">
        {TABS.map((t) => {
          const active = t.key === activeTab;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`text-left py-2 px-3.5 rounded-t-lg border-[0.5px] border-b-0 shrink-0 ${
                active
                  ? 'bg-white border-navy/10'
                  : 'bg-navy/3 border-transparent'
              }`}
            >
              <div
                className={`text-[12.5px] font-semibold ${
                  active ? 'text-blue' : 'text-navy/55'
                }`}
              >
                {t.label}
              </div>
              <div className="text-[10px] text-navy/38">{t.sub}</div>
            </button>
          );
        })}
      </div>

      <div className="border-t-[0.5px] border-navy/10 pt-5 px-5 pb-5 md:pt-7 md:px-12 md:pb-7 overflow-y-auto bg-white">
        <div className="max-w-190 mx-auto">
          <div className="bg-white rounded shadow-[0_1px_4px_rgba(16,35,63,0.06)] py-6 px-5 md:py-13 md:px-14 min-h-150 relative">
            {drafting ? (
              <DraftSkeleton />
            ) : (
              <textarea
                value={docs[activeTab]}
                onChange={(e) =>
                  setDocs((prev) => ({ ...prev, [activeTab]: e.target.value }))
                }
                className="w-full min-h-140 border-none outline-none resize-none text-[13.5px] leading-loose text-navy bg-transparent"
              />
            )}
          </div>

          <div className="mt-4 card py-3.5 px-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles size={13} className="text-blue" />
              <span className="text-[11.5px] font-semibold text-navy">
                AI에게 고쳐 달라고 하기
              </span>
              <span className="text-[10.5px] text-navy/40">
                현재 탭: {TABS.find((t) => t.key === activeTab)?.label}
              </span>
            </div>
            <div className="flex gap-2">
              <input
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    void runRewrite();
                  }
                }}
                placeholder="예: 입금자명이 다른 이유를 더 자세히 설명해 주세요"
                disabled={rewriting || drafting}
                className="flex-1 min-w-0 py-2.5 px-3.5 border-[0.5px] border-border rounded-lg text-[13px] text-navy bg-white outline-none focus:border-blue/50"
              />
              <button
                className="btn-primary text-[13px] flex items-center gap-1.5 shrink-0"
                onClick={() => void runRewrite()}
                disabled={rewriting || drafting || !instruction.trim()}
              >
                {rewriting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                {rewriting ? '고치는 중' : '요청'}
              </button>
            </div>
            {rewriteError && (
              <div className="mt-2 text-[11.5px] text-warm leading-[1.6]">
                {rewriteError}
              </div>
            )}
          </div>

          {citations.length > 0 && (
            <div className="mt-3 card py-3.5 px-4">
              <div className="text-[11.5px] font-semibold text-navy mb-2">
                이 초안이 근거로 삼은 법령·판례
              </div>
              <div className="flex flex-col gap-2.5">
                {citations.map((c) => (
                  <div key={c.key}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9.5px] font-bold text-blue bg-blue/10 py-px px-1.75 rounded-[10px]">
                        {c.kind === 'statute' ? '법령' : '판례'}
                      </span>
                      <span className="text-[12px] font-semibold text-navy">
                        {c.title}
                      </span>
                    </div>
                    <div className="text-[11.5px] text-navy/55 leading-[1.6] mt-0.5">
                      {c.summary}
                    </div>
                    {c.caution && (
                      <div className="text-[11px] text-warm leading-[1.6] mt-0.5">
                        {c.caution}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 flex gap-2.5">
            <button className="btn-secondary" onClick={onBack}>
              ← 이전
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
