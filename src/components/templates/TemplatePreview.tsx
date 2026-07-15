import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { uk } from '../../lib/i18n/uk'

interface FlipCarouselProps {
  front: string
  back: string
  alt: string
  onOpen?: () => void
  className?: string
}

export function FlipCarousel({
  front,
  back,
  alt,
  onOpen,
  className = '',
}: FlipCarouselProps) {
  const slides = [front, back]
  const [index, setIndex] = useState(0)
  const [dir, setDir] = useState(1)
  const startX = useRef<number | null>(null)
  const dragged = useRef(false)

  const go = useCallback(
    (delta: number) => {
      setDir(delta)
      setIndex((i) => (i + delta + slides.length) % slides.length)
    },
    [slides.length],
  )

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    startX.current = e.clientX
    dragged.current = false
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (startX.current == null) return
    if (Math.abs(e.clientX - startX.current) > 8) dragged.current = true
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (startX.current == null) return
    const dx = e.clientX - startX.current
    startX.current = null
    if (Math.abs(dx) > 40) {
      go(dx < 0 ? 1 : -1)
      return
    }
    if (!dragged.current) onOpen?.()
  }

  const stopNavPointer = (e: ReactPointerEvent) => {
    e.stopPropagation()
    startX.current = null
    dragged.current = false
  }

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl md:rounded-3xl bg-white
        border border-champagne/60 shadow-[0_10px_36px_-28px_rgba(45,31,29,0.45)]
        ${className}
      `}
    >
      <div
        className="aspect-[5/3] sm:aspect-[16/10] relative select-none cursor-pointer touch-pan-y"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          startX.current = null
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onOpen?.()
          }
          if (e.key === 'ArrowLeft') go(-1)
          if (e.key === 'ArrowRight') go(1)
        }}
        role="button"
        tabIndex={0}
        aria-label={alt}
      >
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.img
            key={index}
            src={slides[index]}
            alt={`${alt} — ${index === 0 ? uk.templates.front : uk.templates.back}`}
            custom={dir}
            initial={{ x: dir * 36, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: dir * -36, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            draggable={false}
            className="absolute inset-0 w-full h-full object-contain p-4 sm:p-5 md:p-6 pointer-events-none"
          />
        </AnimatePresence>
      </div>

      <button
        type="button"
        aria-label={uk.templates.prev}
        onPointerDown={stopNavPointer}
        onPointerUp={stopNavPointer}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          go(-1)
        }}
        className="
          absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20
          w-9 h-9 sm:w-10 sm:h-10 rounded-full
          bg-white/90 text-espresso border border-champagne/80
          shadow-sm hover:bg-white hover:border-rose/40
          flex items-center justify-center transition-colors
        "
      >
        <ChevronLeft className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
      </button>
      <button
        type="button"
        aria-label={uk.templates.next}
        onPointerDown={stopNavPointer}
        onPointerUp={stopNavPointer}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          go(1)
        }}
        className="
          absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20
          w-9 h-9 sm:w-10 sm:h-10 rounded-full
          bg-white/90 text-espresso border border-champagne/80
          shadow-sm hover:bg-white hover:border-rose/40
          flex items-center justify-center transition-colors
        "
      >
        <ChevronRight className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
      </button>

      <div className="absolute bottom-2.5 sm:bottom-3 inset-x-0 flex justify-center gap-1.5 pointer-events-none">
        {slides.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? 'w-4 bg-rose' : 'w-1.5 bg-espresso/20'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

interface TemplatePreviewModalProps {
  open: boolean
  title: string
  canvaUrl: string
  onClose: () => void
  image?: string
  front?: string
  back?: string
}

export function TemplatePreviewModal({
  open,
  title,
  canvaUrl,
  onClose,
  image,
  front,
  back,
}: TemplatePreviewModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label={uk.templates.close}
            className="absolute inset-0 bg-espresso/50 backdrop-blur-[3px]"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="
              relative z-10 w-full sm:max-w-2xl lg:max-w-3xl
              bg-white rounded-t-[1.75rem] sm:rounded-3xl
              shadow-2xl border border-champagne/40
              max-h-[92dvh] flex flex-col safe-pb
            "
          >
            <div className="flex items-center justify-between gap-3 px-5 sm:px-7 pt-5 sm:pt-6 pb-3 shrink-0">
              <h2
                className="text-xl sm:text-2xl font-semibold text-espresso tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="
                  w-10 h-10 rounded-full flex items-center justify-center shrink-0
                  text-espresso/45 hover:text-espresso hover:bg-pearl transition-colors
                "
                aria-label={uk.templates.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 sm:px-7 pb-4">
              {image ? (
                <div className="rounded-2xl border border-champagne/50 bg-pearl/35 p-4 sm:p-6">
                  <img
                    src={image}
                    alt={title}
                    className="w-full h-auto max-h-[52vh] sm:max-h-[58vh] object-contain mx-auto"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div className="space-y-2">
                    <p className="text-[11px] sm:text-xs uppercase tracking-[0.08em] text-espresso/45 text-center font-medium">
                      {uk.templates.front}
                    </p>
                    <div className="rounded-2xl border border-champagne/50 bg-pearl/35 p-3 sm:p-4">
                      <img
                        src={front}
                        alt={`${title} — ${uk.templates.front}`}
                        className="w-full h-auto max-h-[34vh] sm:max-h-[42vh] object-contain mx-auto"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[11px] sm:text-xs uppercase tracking-[0.08em] text-espresso/45 text-center font-medium">
                      {uk.templates.back}
                    </p>
                    <div className="rounded-2xl border border-champagne/50 bg-pearl/35 p-3 sm:p-4">
                      <img
                        src={back}
                        alt={`${title} — ${uk.templates.back}`}
                        className="w-full h-auto max-h-[34vh] sm:max-h-[42vh] object-contain mx-auto"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 sm:px-7 pb-5 sm:pb-7 pt-1 shrink-0">
              <a
                href={canvaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  flex items-center justify-center w-full min-h-[50px] sm:min-h-[52px] px-6 rounded-2xl
                  bg-rose text-white font-semibold text-[15px]
                  shadow-md shadow-rose/25 hover:bg-rose-dark transition-colors
                "
              >
                {uk.templates.openInCanva}
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
