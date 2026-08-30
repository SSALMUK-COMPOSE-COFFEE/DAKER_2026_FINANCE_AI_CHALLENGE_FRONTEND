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
    <div className="min-h-screen bg-page flex flex-row-reverse">
      {showModal && <OnboardingModal onClose={() => setShowModal(false)} />}
      <Sidebar step={step} onStepClick={setStep} dday={dday} />
      <main className="flex-1 overflow-y-auto min-h-screen">
        {step === 0 && <Landing onStart={() => setStep(1)} />}
        {step === 1 && (
          <DiagnosisQuestionnaire
            onNext={() => setStep(2)}
            onDdayChange={setDday}
            onAnswersChange={setAnswers}
          />
        )}
        {step === 2 && <DataUpload answers={answers} onNext={() => setStep(3)} />}
        {step === 3 && <AnalysisResult answers={answers} onNext={() => setStep(4)} />}
        {step === 4 && <DocumentEditor answers={answers} onNext={() => setStep(5)} />}
        {step === 5 && <SubmissionSupport />}
      </main>
    </div>
  )
}
