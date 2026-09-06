import { useEffect, useRef, useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { OnboardingModal } from '@/components/OnboardingModal';
import { Wordmark } from '@/components/Wordmark';
import { Landing } from '@/screens/Landing';
import { DiagnosisQuestionnaire } from '@/screens/DiagnosisQuestionnaire';
import { DataUpload } from '@/screens/DataUpload';
import { AnalysisResult } from '@/screens/AnalysisResult';
import { DocumentEditor } from '@/screens/DocumentEditor';
import { SubmissionSupport } from '@/screens/SubmissionSupport';
import type { Answers } from '@/types';
import type { AnalysisResponse, Applicant, DocKey, ImageExtract, Transaction } from '@/api';
import { EMPTY_APPLICANT } from '@/api';

export default function App() {
  const [step, setStep] = useState(0);
  const [showModal, setShowModal] = useState(true);
  const [answers, setAnswers] = useState<Answers>({});
  const [sampleMode, setSampleMode] = useState(false);
  const [dday, setDday] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [imageNotes, setImageNotes] = useState<ImageExtract[]>([]);
  const [checkedEvidence, setCheckedEvidence] = useState<string[]>([]);
  const [memo, setMemo] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [docs, setDocs] = useState<Record<DocKey, string> | null>(null);
  const [applicant, setApplicant] = useState<Applicant>(EMPTY_APPLICANT);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [step]);

  return (
    <div className="h-screen overflow-hidden bg-page flex flex-col md:flex-row-reverse">
      {showModal && <OnboardingModal onClose={() => setShowModal(false)} />}
      <Sidebar
        step={step}
        onStepClick={setStep}
        dday={dday}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />
      <div className="md:hidden shrink-0 flex items-center justify-between px-4 py-3 border-b-[0.5px] border-navy/10 bg-white">
        <Wordmark size="sm" />
        <button
          onClick={() => setMobileNavOpen(true)}
          className="p-1.5 -mr-1.5 bg-transparent border-none cursor-pointer text-navy"
          aria-label="메뉴 열기"
        >
          <Menu size={22} />
        </button>
      </div>
      <main
        ref={mainRef}
        className={`flex-1 ${
          mobileNavOpen
            ? 'overflow-hidden md:overflow-y-auto'
            : 'overflow-y-auto'
        }`}
      >
        {step === 0 && <Landing onStart={() => setStep(1)} />}
        {step === 1 && (
          <DiagnosisQuestionnaire
            onBack={() => setStep(0)}
            onNext={() => setStep(2)}
            onDdayChange={setDday}
            onAnswersChange={setAnswers}
            onSampleMode={setSampleMode}
          />
        )}
        {step === 2 && (
          <DataUpload
            answers={answers}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
            autoSample={sampleMode}
            onAnswersChange={setAnswers}
            onTransactionsChange={setTransactions}
            onImageNotesChange={setImageNotes}
            onCheckedEvidenceChange={setCheckedEvidence}
            onMemoChange={setMemo}
            onAnalysisReady={setAnalysis}
          />
        )}
        {step === 3 && (
          <AnalysisResult
            answers={answers}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}
        {step === 4 && (
          <DocumentEditor
            answers={answers}
            analysis={analysis}
            checkedEvidence={checkedEvidence}
            memo={memo}
            imageNotes={imageNotes}
            applicant={applicant}
            onApplicantChange={setApplicant}
            onDocsChange={setDocs}
            onBack={() => setStep(3)}
            onNext={() => setStep(5)}
          />
        )}
        {step === 5 && (
          <SubmissionSupport
            docs={docs}
            applicant={applicant}
            onBack={() => setStep(4)}
          />
        )}
      </main>
    </div>
  );
}
