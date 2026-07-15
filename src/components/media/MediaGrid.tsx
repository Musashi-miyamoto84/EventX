import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Clapperboard, Download, ImageIcon, Play, Trash2, X } from 'lucide-react'
import type { MediaItem } from '../../lib/types'
import { uk } from '../../lib/i18n/uk'

export type MediaFilter = 'all' | 'photos' | 'videos'

function isVideoItem(item: MediaItem) {
  return item.isVideo || item.mimeType.startsWith('video/')
}

interface Props {
  items: MediaItem[]
  canDownload?: boolean
  canDelete?: boolean
  loading?: boolean
  onDelete?: (id: string) => void
}

function FilterTabs({
  filter,
  onChange,
  counts,
}: {
  filter: MediaFilter
  onChange: (f: MediaFilter) => void
  counts: { all: number; photos: number; videos: number }
}) {
  const tabs: { id: MediaFilter; label: string; count: number }[] = [
    { id: 'all', label: uk.media.filterAll, count: counts.all },
    { id: 'photos', label: uk.media.filterPhotos, count: counts.photos },
    { id: 'videos', label: uk.media.filterVideos, count: counts.videos },
  ]

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-0.5 px-0.5 scrollbar-none">
      {tabs.map((tab) => {
        const active = filter === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`
              shrink-0 inline-flex items-center gap-1.5 min-h-[40px] px-3.5 sm:px-4 rounded-full
              text-sm font-medium transition-all
              ${
                active
                  ? 'bg-espresso text-white shadow-sm'
                  : 'bg-white/90 text-espresso/65 border border-champagne/70 hover:border-rose/30'
              }
            `}
          >
            {tab.id === 'photos' && <ImageIcon className="w-3.5 h-3.5 opacity-70" />}
            {tab.id === 'videos' && <Clapperboard className="w-3.5 h-3.5 opacity-70" />}
            {tab.label}
            <span
              className={`text-xs tabular-nums ${active ? 'text-white/75' : 'text-espresso/40'}`}
            >
              {tab.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function SectionTitle({ icon: Icon, title, count }: { icon: typeof ImageIcon; title: string; count: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-8 h-8 rounded-xl bg-rose-light/60 flex items-center justify-center">
        <Icon className="w-4 h-4 text-rose" />
      </div>
      <h3 className="text-sm sm:text-base font-semibold text-espresso">{title}</h3>
      <span className="text-xs text-espresso/40 font-medium tabular-nums">{count}</span>
    </div>
  )
}

function VideoThumbnail({
  item,
  index,
  onOpen,
  layout = 'grid',
}: {
  item: MediaItem
  index: number
  onOpen: () => void
  layout?: 'grid' | 'horizontal'
}) {
  const horizontal = layout === 'horizontal'
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.25), duration: 0.35 }}
      whileTap={{ scale: 0.98 }}
      onClick={onOpen}
      className={`
        rounded-2xl overflow-hidden bg-espresso relative
        border border-champagne/40 shadow-sm
        ${horizontal ? 'shrink-0 w-[72vw] max-w-[280px] snap-start' : 'w-full'}
      `}
    >
      <div className="aspect-video relative">
        <video
          src={`${item.url}#t=0.2`}
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center">
            <Play className="w-6 h-6 sm:w-7 sm:h-7 text-white fill-white/90 ml-0.5" />
          </div>
        </div>
        <p className="absolute bottom-2.5 left-3 right-3 text-[11px] sm:text-xs text-white/85 truncate text-left">
          {item.fileName}
        </p>
      </div>
    </motion.button>
  )
}

function PhotoGrid({
  items,
  onOpen,
}: {
  items: MediaItem[]
  onOpen: (item: MediaItem) => void
}) {
  return (
    <div className="columns-2 md:columns-3 gap-2.5 sm:gap-3 space-y-2.5 sm:space-y-3">
      {items.map((item, index) => (
        <motion.button
          key={item.id}
          type="button"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.35 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onOpen(item)}
          className="break-inside-avoid block w-full rounded-2xl overflow-hidden bg-pearl relative"
        >
          <img
            src={item.url}
            alt={item.fileName}
            className="w-full object-cover"
            loading="lazy"
          />
        </motion.button>
      ))}
    </div>
  )
}

function VideoGrid({
  items,
  onOpen,
  horizontal = false,
}: {
  items: MediaItem[]
  onOpen: (item: MediaItem) => void
  horizontal?: boolean
}) {
  if (horizontal) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory -mx-1 px-1 scrollbar-none">
        {items.map((item, index) => (
          <VideoThumbnail
            key={item.id}
            item={item}
            index={index}
            onOpen={() => onOpen(item)}
            layout="horizontal"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {items.map((item, index) => (
        <VideoThumbnail
          key={item.id}
          item={item}
          index={index}
          onOpen={() => onOpen(item)}
          layout="grid"
        />
      ))}
    </div>
  )
}

function Lightbox({
  active,
  onClose,
  canDownload,
  canDelete,
  onDelete,
}: {
  active: MediaItem
  onClose: () => void
  canDownload: boolean
  canDelete: boolean
  onDelete?: (id: string) => void
}) {
  const video = isVideoItem(active)

  return (
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
              className="p-2.5 rounded-xl hover:bg-white/10 flex items-center justify-center min-w-[44px] min-h-[44px]"
              aria-label={uk.guest.download}
            >
              <Download className="w-5 h-5" />
            </a>
          )}
          {canDelete && onDelete && (
            <button
              type="button"
              className="p-2.5 rounded-xl hover:bg-white/10 flex items-center justify-center min-w-[44px] min-h-[44px]"
              onClick={() => {
                onDelete(active.id)
                onClose()
              }}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button
            type="button"
            className="p-2.5 rounded-xl hover:bg-white/10 flex items-center justify-center min-w-[44px] min-h-[44px]"
            onClick={onClose}
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
        {video ? (
          <video
            src={active.url}
            controls
            playsInline
            className="max-h-full max-w-full rounded-xl w-full sm:w-auto"
          />
        ) : (
          <img
            src={active.url}
            alt={active.fileName}
            className="max-h-full max-w-full object-contain"
          />
        )}
      </motion.div>
    </motion.div>
  )
}

export function MediaGallery({
  items,
  canDownload = true,
  canDelete = false,
  loading = false,
  onDelete,
}: Props) {
  const [filter, setFilter] = useState<MediaFilter>('all')
  const [active, setActive] = useState<MediaItem | null>(null)

  const photos = useMemo(() => items.filter((i) => !isVideoItem(i)), [items])
  const videos = useMemo(() => items.filter((i) => isVideoItem(i)), [items])

  const counts = { all: items.length, photos: photos.length, videos: videos.length }

  const filteredPhotos = filter === 'videos' ? [] : photos
  const filteredVideos = filter === 'photos' ? [] : videos

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-24 rounded-full bg-pearl animate-pulse" />
          ))}
        </div>
        <div className="columns-2 md:columns-3 gap-3 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="break-inside-avoid rounded-2xl bg-pearl/90 animate-pulse"
              style={{ height: `${140 + (i % 3) * 36}px` }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="rounded-3xl border border-dashed border-champagne bg-white/40 py-14 text-center px-4">
        <p className="text-sm text-espresso/45">{uk.media.emptyAll}</p>
      </div>
    )
  }

  const showPhotos = filteredPhotos.length > 0
  const showVideos = filteredVideos.length > 0
  const showSplit = filter === 'all' && showPhotos && showVideos

  return (
    <>
      <div className="space-y-5 sm:space-y-6">
        {(photos.length > 0 || videos.length > 0) && (
          <FilterTabs filter={filter} onChange={setFilter} counts={counts} />
        )}

        {!showPhotos && !showVideos && (
          <div className="rounded-3xl border border-dashed border-champagne bg-white/40 py-12 text-center px-4">
            <p className="text-sm text-espresso/45">
              {filter === 'photos' ? uk.media.emptyPhotos : uk.media.emptyVideos}
            </p>
          </div>
        )}

        {showPhotos && (
          <section>
            {showSplit && (
              <SectionTitle icon={ImageIcon} title={uk.media.photosSection} count={photos.length} />
            )}
            <PhotoGrid items={filteredPhotos} onOpen={setActive} />
          </section>
        )}

        {showVideos && (
          <section className={showSplit ? 'pt-1' : ''}>
            {showSplit && (
              <SectionTitle icon={Clapperboard} title={uk.media.videosSection} count={videos.length} />
            )}
            <VideoGrid
              items={filteredVideos}
              onOpen={setActive}
              horizontal={showSplit}
            />
          </section>
        )}
      </div>

      <AnimatePresence>
        {active && (
          <Lightbox
            active={active}
            onClose={() => setActive(null)}
            canDownload={canDownload}
            canDelete={canDelete}
            onDelete={onDelete}
          />
        )}
      </AnimatePresence>
    </>
  )
}

/** @deprecated Use MediaGallery */
export const MediaGrid = MediaGallery
