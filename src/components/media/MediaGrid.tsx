import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, Play, Trash2, X } from 'lucide-react'
import type { MediaItem } from '../../lib/types'
import { uk } from '../../lib/i18n/uk'

interface Props {
  items: MediaItem[]
  canDownload?: boolean
  canDelete?: boolean
  loading?: boolean
  onDelete?: (id: string) => void
}

export function MediaGrid({
  items,
  canDownload = true,
  canDelete = false,
  loading = false,
  onDelete,
}: Props) {
  const [active, setActive] = useState<MediaItem | null>(null)

  if (loading) {
    return (
      <div className="columns-2 md:columns-3 gap-2.5 sm:gap-3 space-y-2.5 sm:space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="break-inside-avoid rounded-2xl bg-pearl/90 animate-pulse"
            style={{ height: `${140 + (i % 3) * 36}px` }}
          />
        ))}
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="rounded-3xl border border-dashed border-champagne bg-white/40 py-14 text-center">
        <p className="text-sm text-espresso/45">{uk.event.emptyMedia}</p>
      </div>
    )
  }

  return (
    <>
      <div className="columns-2 md:columns-3 gap-2.5 sm:gap-3 space-y-2.5 sm:space-y-3">
        {items.map((item, index) => (
          <motion.button
            key={item.id}
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.35 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActive(item)}
            className="break-inside-avoid block w-full rounded-2xl overflow-hidden bg-pearl relative"
          >
            {item.isVideo || item.mimeType.startsWith('video/') ? (
              <div className="aspect-[3/4] flex items-center justify-center bg-espresso/90">
                <Play className="w-10 h-10 text-white/90" />
              </div>
            ) : (
              <img
                src={item.url}
                alt={item.fileName}
                className="w-full object-cover"
                loading="lazy"
              />
            )}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/92 flex flex-col"
          >
            <div className="flex items-center justify-between page-pad py-3 safe-pt text-white">
              <p className="text-sm truncate pr-4 opacity-80">{active.fileName}</p>
              <div className="flex items-center gap-1">
                {canDownload && (
                  <a
                    href={active.url}
                    download={active.fileName}
                    className="p-2.5 rounded-xl hover:bg-white/10 touch-target flex items-center justify-center"
                    aria-label={uk.guest.download}
                  >
                    <Download className="w-5 h-5" />
                  </a>
                )}
                {canDelete && onDelete && (
                  <button
                    type="button"
                    className="p-2.5 rounded-xl hover:bg-white/10 touch-target flex items-center justify-center"
                    onClick={() => {
                      onDelete(active.id)
                      setActive(null)
                    }}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                <button
                  type="button"
                  className="p-2.5 rounded-xl hover:bg-white/10 touch-target flex items-center justify-center"
                  onClick={() => setActive(null)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex items-center justify-center p-3 sm:p-6 min-h-0"
            >
              {active.isVideo || active.mimeType.startsWith('video/') ? (
                <video src={active.url} controls className="max-h-full max-w-full rounded-lg" />
              ) : (
                <img
                  src={active.url}
                  alt={active.fileName}
                  className="max-h-full max-w-full object-contain"
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
