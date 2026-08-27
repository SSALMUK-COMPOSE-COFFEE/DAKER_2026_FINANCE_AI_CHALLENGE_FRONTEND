import { useState } from "react"
import { MODAL_SLIDES } from "@/data/onboarding"
import { SlideIllustration1, SlideIllustration2, SlideIllustration3 } from "./OnboardingIllustrations"

const SLIDE_ILLUSTRATIONS = [SlideIllustration1, SlideIllustration2, SlideIllustration3]

export function OnboardingModal({ onClose }: { onClose: () => void }) {
  const [slide, setSlide] = useState(0)
  const total = MODAL_SLIDES.length
  const isLast = slide === total - 1
  const current = MODAL_SLIDES[slide]
  const Illustration = SLIDE_ILLUSTRATIONS[slide]

  return (
    <div
      className="fixed inset-0 z-[1000] bg-[rgba(20,28,38,0.55)] flex items-center justify-center py-6 px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-[20px] w-full max-w-[780px] overflow-hidden relative shadow-[0_24px_64px_rgba(20,28,38,0.18)]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 bg-transparent border-none cursor-pointer text-navy/[35%] text-lg leading-none z-10 p-1"
        >
          ×
        </button>

        {/* Content */}
        <div className="flex min-h-[480px]">
          {/* Left text */}
          <div className="flex-[0_0_42%] pt-[52px] px-10 pb-9 flex flex-col justify-center">
            <div className="text-[11.5px] font-semibold text-blue tracking-[0.02em] mb-4">
              {current.tag}
            </div>
            <div className="font-serif-kr text-[30px] font-bold text-navy leading-[1.3] tracking-[-0.02em] mb-5 whitespace-pre-line">
              {current.headline}
            </div>
            <div className="font-sans-kr text-sm text-navy/[55%] leading-[1.85] whitespace-pre-line">
              {current.body}
            </div>
          </div>

          {/* Right illustration */}
          <div className="flex-1 bg-navy/[3%] flex items-center justify-center py-9 px-7 border-l-[0.5px] border-navy/[7%]">
            <div className="w-full h-[280px]">
              <Illustration />
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-5 px-9 border-t-[0.5px] border-navy/[8%] flex items-center justify-between">
          {/* Dots */}
          <div className="flex gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                className={`h-2 rounded border-none cursor-pointer transition-all duration-200 ease-in-out p-0 ${i === slide ? "w-[22px] bg-blue" : "w-2 bg-navy/[15%]"}`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-2.5 items-center">
            {!isLast && (
              <button
                onClick={onClose}
                className="bg-transparent border-none cursor-pointer text-[13.5px] text-navy/[40%] py-2 px-1"
              >
                건너뛰기
              </button>
            )}
            {!isLast && (
              <button
                className="btn-primary text-[13.5px] py-2.5 px-6"
                onClick={() => setSlide(s => s + 1)}
              >
                다음 →
              </button>
            )}
            {isLast && (
              <button
                className="btn-primary text-[13.5px] py-2.5 px-7"
                onClick={onClose}
              >
                시작하기 →
              </button>
            )}
            {isLast && (
              <button
                onClick={() => setSlide(s => s - 1)}
                className="order-first bg-transparent border-[0.5px] border-navy/[20%] cursor-pointer text-[13.5px] text-navy/[50%] py-2.5 px-5 rounded-lg"
              >
                ← 이전
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
