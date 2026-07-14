import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Presentation, Upload, X } from 'lucide-react'
import { getEventByCode, listMedia, uploadMedia } from '../lib/api'
import type { AccessMode, AlbumItem, EventItem, MediaItem } from '../lib/types'
import { MediaDropzone } from '../components/media/MediaDropzone'
import { MediaGrid } from '../components/media/MediaGrid'
import { AlbumChips } from '../components/events/AlbumChips'
import { Logo } from '../components/ui/Logo'
import { Button } from '../components/ui/Button'
import { uk } from '../lib/i18n/uk'

const LEGACY_DEFAULT_ALBUMS = new Set(['Усі фото', 'Церемонія', 'Банкет'])

export function GuestGalleryPage() {
  const { code = '' } = useParams()
  const [event, setEvent] = useState<EventItem | null>(null)
  const [albums, setAlbums] = useState<AlbumItem[]>([])
  const [media, setMedia] = useState<MediaItem[]>([])
  const [albumId, setAlbumId] = useState<string | undefined>()
  const [accessMode, setAccessMode] = useState<AccessMode>('download')
  const [loading, setLoading] = useState(true)
  const [mediaLoading, setMediaLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [error, setError] = useState('')
  const [gateError, setGateError] = useState<'notFound' | 'hidden'>('notFound')

  const visibleAlbums = useMemo(
    () => albums.filter((a) => !LEGACY_DEFAULT_ALBUMS.has(a.name)),
    [albums],
  )

  const loadMedia = useCallback(async () => {
    if (!code) return
    setMediaLoading(true)
    try {
      const res = await listMedia({ code, albumId })
      setMedia(res.media)
      setAccessMode(res.accessMode)
    } finally {
      setMediaLoading(false)
    }
  }, [code, albumId])

  useEffect(() => {
    setLoading(true)
    getEventByCode(code)
      .then((res) => {
        setEvent(res.event)
        setAlbums(res.albums)
        setAccessMode(res.event.accessMode)
      })
      .catch((err) => {
        setEvent(null)
        const key = err instanceof Error ? err.message : ''
        setGateError(key === 'hidden' ? 'hidden' : 'notFound')
      })
      .finally(() => setLoading(false))
  }, [code])

  useEffect(() => {
    if (event) loadMedia().catch(() => setMedia([]))
  }, [event, loadMedia])

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center ambient-bg">
        <div className="w-8 h-8 border-2 border-rose border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center ambient-bg page-pad text-center">
        <p className="text-espresso mb-4">
          {gateError === 'hidden' ? uk.guest.hidden : uk.guest.notFound}
        </p>
        <Link to="/join" className="text-rose font-medium min-h-[44px] inline-flex items-center">
          {uk.guest.joinTitle}
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-dvh ambient-bg pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-40 glass border-b border-champagne/50 safe-pt">
        <div className="flex items-center justify-between gap-3 page-pad py-3.5 max-w-3xl mx-auto">
          <div className="min-w-0">
            <Logo size="sm" />
            <h1
              className="text-lg sm:text-xl font-semibold text-espresso mt-1 truncate"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {event.name}
            </h1>
          </div>
          <Link to={`/e/${event.code}/live`}>
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button variant="secondary" className="!min-h-[44px] !min-w-[44px] !px-3">
                <Presentation className="w-4 h-4" />
              </Button>
            </motion.div>
          </Link>
        </div>
      </header>

      <main className="page-pad py-5 max-w-3xl mx-auto space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <AlbumChips albums={visibleAlbums} albumId={albumId} onSelect={setAlbumId} />
        </motion.div>

        <AnimatePresence>
          {showUpload && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <MediaDropzone
                onFiles={async (files) => {
                  setError('')
                  for (const file of files) {
                    try {
                      const res = await uploadMedia({
                        file,
                        eventCode: event.code,
                        albumId: albumId || null,
                      })
                      setMedia((prev) => [res.media, ...prev])
                    } catch (err) {
                      const key = err instanceof Error ? err.message : 'generic'
                      setError(uk.errors[key as keyof typeof uk.errors] || uk.errors.generic)
                    }
                  }
                  setShowUpload(false)
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <MediaGrid
          items={media}
          canDownload={accessMode === 'download'}
          loading={mediaLoading}
        />
      </main>

      <div className="fixed bottom-0 inset-x-0 z-40 pointer-events-none">
        <div className="bg-gradient-to-t from-ivory via-ivory/95 to-transparent pt-8 page-pad safe-pb pointer-events-auto">
          <div className="max-w-3xl mx-auto">
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button fullWidth onClick={() => setShowUpload((v) => !v)}>
                {showUpload ? <X className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                {showUpload ? uk.event.cancel : uk.guest.upload}
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
