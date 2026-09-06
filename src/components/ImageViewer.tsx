import { useEffect } from "react"
import { X } from "lucide-react"

export function ImageViewer({
  src,
  name,
  caption,
  onClose,
}: {
  src: string
  name: string
  caption?: string
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[1000] bg-[rgba(20,28,38,0.78)] flex items-center justify-center p-4 md:p-8"
      onClick={onClose}
      role="dialog"
      aria-label={name}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 border-none rounded-full p-2 cursor-pointer text-white"
      >
        <X size={18} />
      </button>
      <div
        className="max-w-full max-h-full flex flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={name}
          className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl bg-white"
        />
        <div className="max-w-150 text-center">
          <div className="text-[12.5px] font-medium text-white">{name}</div>
          {caption && (
            <div className="text-[11.5px] text-white/70 leading-[1.6] mt-1">
              {caption}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
