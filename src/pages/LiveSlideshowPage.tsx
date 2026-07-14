import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Maximize2, Pause, Play, X } from 'lucide-react'
import { listMedia } from '../lib/api'
import type { MediaItem } from '../lib/types'
import { uk } from '../lib/i18n/uk'

export function LiveSlideshowPage() {
  const { code = '' } = useParams()
  const [media, setMedia] = useState<MediaItem[]>([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [paused, setPaused] = useState(false)
  const [showUi, setShowUi] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await listMedia({ code })
        if (!cancelled) {
          const photos = res.media.filter(
            (m) => !m.isVideo && !m.mimeType.startsWith('video/'),
          )
          setMedia(photos)
          setLoading(false)
        }
      } catch {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    const poll = setInterval(load, 8000)
    return () => {
      cancelled = true
      clearInterval(poll)
    }
  }, [code])

  useEffect(() => {
    if (paused || media.length < 2) return
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % media.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [media.length, paused])

  useEffect(() => {
    if (!showUi) return
    const t = setTimeout(() => setShowUi(false), 3500)
    return () => clearTimeout(t)
  }, [showUi, index])

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen().catch(() => undefined)
    } else {
      await document.exitFullscreen().catch(() => undefined)
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-black flex items-center justify-center text-white/70">
        {uk.auth.loading}
      </div>
    )
  }

  if (!media.length) {
    return (
      <div className="min-h-dvh bg-black flex flex-col items-center justify-center text-white gap-4 px-5 text-center">
        <p>{uk.live.empty}</p>
        <Link to={`/e/${code}`} className="text-rose-light underline text-sm min-h-[44px] inline-flex items-center">
          {uk.event.openGallery}
        </Link>
      </div>
    )
  }

  const current = media[index % media.length]

  return (
    <div
      className="min-h-dvh bg-black relative overflow-hidden cursor-pointer"
      onClick={() => setShowUi(true)}
    >
      <AnimatePresence mode="wait">
        <motion.img
          key={current.id}
          src={current.url}
          alt={current.fileName}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 w-full h-full object-contain"
        />
      </AnimatePresence>

      <AnimatePresence>
        {showUi && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-0 bottom-0 p-4 sm:p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-w-xl mx-auto flex items-center justify-between gap-3 text-white">
              <p className="text-xs sm:text-sm text-white/60">
                {index + 1} / {media.length}
              </p>
              <div className="flex items-center gap-2">
                <ControlButton
                  onClick={() => setPaused((p) => !p)}
                  label={paused ? uk.live.play : uk.live.pause}
                >
                  {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </ControlButton>
                <ControlButton onClick={toggleFullscreen} label={uk.live.fullscreen}>
                  <Maximize2 className="w-4 h-4" />
                </ControlButton>
                <Link
                  to={`/e/${code}`}
                  className="min-h-[44px] min-w-[44px] rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center"
                  aria-label={uk.live.exit}
                >
                  <X className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ControlButton({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="min-h-[44px] min-w-[44px] rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center"
    >
      {children}
    </button>
  )
}
