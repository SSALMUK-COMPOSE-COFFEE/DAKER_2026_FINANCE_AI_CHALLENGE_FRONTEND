import { useState } from "react"
import { Sidebar } from "@/components/Sidebar"
import { OnboardingModal } from "@/components/OnboardingModal"
import { Landing } from "@/screens/Landing"
import { DiagnosisQuestionnaire } from "@/screens/DiagnosisQuestionnaire"
import { DataUpload } from "@/screens/DataUpload"
import { AnalysisResult } from "@/screens/AnalysisResult"
import { DocumentEditor } from "@/screens/DocumentEditor"
import { SubmissionSupport } from "@/screens/SubmissionSupport"
import type { Answers } from "@/types"

export default function App() {
  const [step, setStep] = useState(0)
  const [showModal, setShowModal] = useState(true)
  const [answers, setAnswers] = useState<Answers>({})
  const [dday, setDday] = useState<number | null>(null)

  return (
    <div className="h-screen overflow-hidden bg-page flex flex-row-reverse">
      {showModal && <OnboardingModal onClose={() => setShowModal(false)} />}
      <Sidebar step={step} onStepClick={setStep} dday={dday} />
      <main className="flex-1 h-screen overflow-y-auto">
        {step === 0 && <Landing onStart={() => setStep(1)} />}
        {step === 1 && (
          <DiagnosisQuestionnaire
            onBack={() => setStep(0)}
            onNext={() => setStep(2)}
            onDdayChange={setDday}
            onAnswersChange={setAnswers}
          />
        )}
        {step === 2 && (
          <DataUpload
            answers={answers}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
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
            onBack={() => setStep(3)}
            onNext={() => setStep(5)}
          />
        )}
        {step === 5 && <SubmissionSupport onBack={() => setStep(4)} />}
      </main>
    </div>
  )
}
