import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Presentation,
  Download,
  ExternalLink,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import {
  createAlbum,
  deleteAlbum,
  deleteEvent,
  deleteMedia,
  getEvent,
  listMedia,
  updateEvent,
  uploadMedia,
} from '../lib/api'
import type { AlbumItem, EventItem, MediaItem } from '../lib/types'
import { MediaDropzone } from '../components/media/MediaDropzone'
import { MediaGallery } from '../components/media/MediaGrid'
import { EventQRPanel } from '../components/qr/EventQRPanel'
import { AddAlbumForm, AlbumChips } from '../components/events/AlbumChips'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { FadeIn, PageShell } from '../components/ui/motion'
import { uk } from '../lib/i18n/uk'

const LEGACY_DEFAULT_ALBUMS = new Set(['Усі фото', 'Церемонія', 'Банкет'])

export function EventDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState<EventItem | null>(null)
  const [albums, setAlbums] = useState<AlbumItem[]>([])
  const [media, setMedia] = useState<MediaItem[]>([])
  const [albumId, setAlbumId] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [mediaLoading, setMediaLoading] = useState(true)
  const [albumName, setAlbumName] = useState('')
  const [zipping, setZipping] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDate, setEditDate] = useState('')
  const [saving, setSaving] = useState(false)

  const visibleAlbums = useMemo(
    () => albums.filter((a) => !LEGACY_DEFAULT_ALBUMS.has(a.name)),
    [albums],
  )

  const loadEvent = useCallback(async () => {
    if (!id) return
    const res = await getEvent(id)
    setEvent(res.event)
    setAlbums(res.albums)
    setEditName(res.event.name)
    setEditDate(res.event.eventDate ? String(res.event.eventDate).slice(0, 10) : '')
  }, [id])

  const loadMedia = useCallback(async () => {
    if (!id) return
    setMediaLoading(true)
    try {
      const res = await listMedia({ eventId: id, albumId })
      setMedia(res.media)
    } finally {
      setMediaLoading(false)
    }
  }, [id, albumId])

  useEffect(() => {
    setLoading(true)
    loadEvent()
      .catch(() => setError(uk.errors.generic))
      .finally(() => setLoading(false))
  }, [loadEvent])

  useEffect(() => {
    loadMedia().catch(() => setMedia([]))
  }, [loadMedia])

  const guestUrl = useMemo(
    () => (event ? `${window.location.origin}/e/${event.code}` : ''),
    [event],
  )

  const handleUpload = async (files: File[]) => {
    if (!event) return
    setError('')
    for (const file of files) {
      try {
        const res = await uploadMedia({
          file,
          eventId: event.id,
          eventCode: event.code,
          albumId: albumId || null,
        })
        setMedia((prev) => [res.media, ...prev])
      } catch (err) {
        const key = err instanceof Error ? err.message : 'generic'
        setError(uk.errors[key as keyof typeof uk.errors] || uk.errors.generic)
      }
    }
    await loadEvent()
  }

  const handleZip = async () => {
    if (!media.length) return
    setZipping(true)
    try {
      const zip = new JSZip()
      for (const item of media) {
        const response = await fetch(item.url)
        const blob = await response.blob()
        zip.file(item.fileName, blob)
      }
      const content = await zip.generateAsync({ type: 'blob' })
      saveAs(content, `${event?.code || 'eventoly'}.zip`)
    } catch {
      setError(uk.errors.generic)
    } finally {
      setZipping(false)
    }
  }

  const handleSave = async () => {
    if (!event || !editName.trim()) return
    setSaving(true)
    try {
      const res = await updateEvent({
        id: event.id,
        name: editName.trim(),
        eventDate: editDate || null,
      })
      setEvent({ ...event, ...res.event })
      setEditing(false)
    } catch {
      setError(uk.errors.generic)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50dvh]">
        <div className="w-8 h-8 border-2 border-rose border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!event) {
    return (
      <PageShell>
        <p className="text-red-500">{error || uk.errors.generic}</p>
        <Link to="/dashboard" className="text-rose text-sm mt-4 inline-block">
          {uk.event.back}
        </Link>
      </PageShell>
    )
  }

  const dateLabel = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString('uk-UA', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : uk.event.noDate

  return (
    <PageShell className="pb-28 lg:pb-8">
      <FadeIn>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-espresso/55 hover:text-rose mb-5 transition-colors min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          {uk.event.back}
        </Link>
      </FadeIn>

      <div className="flex flex-col xl:flex-row gap-6 xl:gap-8">
        <div className="flex-1 space-y-5 sm:space-y-6 min-w-0">
          <FadeIn delay={0.05} className="space-y-3">
            {editing ? (
              <div className="bg-white/90 rounded-3xl border border-champagne/70 p-4 space-y-3">
                <Input
                  label={uk.event.nameLabel}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                <Input
                  label={uk.event.dateLabel}
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button fullWidth loading={saving} onClick={handleSave}>
                    <Check className="w-4 h-4" />
                    {uk.event.save}
                  </Button>
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => {
                      setEditing(false)
                      setEditName(event.name)
                      setEditDate(
                        event.eventDate ? String(event.eventDate).slice(0, 10) : '',
                      )
                    }}
                  >
                    <X className="w-4 h-4" />
                    {uk.event.cancel}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1
                    className="text-2xl sm:text-3xl font-semibold text-espresso tracking-tight text-balance"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {event.name}
                  </h1>
                  <p className="text-sm text-espresso/45 mt-1.5">{dateLabel}</p>
                  <p className="text-sm text-espresso/45 mt-1 font-mono tracking-wider">
                    {event.code}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="shrink-0 min-h-[44px] min-w-[44px] rounded-2xl bg-white border border-champagne flex items-center justify-center text-espresso/60 hover:text-rose"
                  aria-label={uk.event.edit}
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            )}
          </FadeIn>

          <FadeIn delay={0.1} className="flex flex-wrap gap-2">
            <a
              href={guestUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-none min-w-[140px]"
            >
              <Button variant="secondary" fullWidth className="sm:w-auto">
                <ExternalLink className="w-4 h-4" />
                {uk.event.openGallery}
              </Button>
            </a>
            <Link to={`/e/${event.code}/live`} className="flex-1 sm:flex-none min-w-[140px]">
              <Button variant="secondary" fullWidth className="sm:w-auto">
                <Presentation className="w-4 h-4" />
                {uk.event.liveShow}
              </Button>
            </Link>
            <div className="w-full sm:w-auto">
              <Button
                variant="dark"
                onClick={handleZip}
                loading={zipping}
                disabled={!media.length}
                fullWidth
                className="sm:w-auto"
              >
                <Download className="w-4 h-4" />
                {uk.event.downloadAll}
              </Button>
            </div>
          </FadeIn>

          <FadeIn delay={0.12} className="space-y-3">
            <p className="text-sm font-medium text-espresso">{uk.event.albums}</p>
            <AlbumChips
              albums={visibleAlbums}
              albumId={albumId}
              onSelect={setAlbumId}
              showHint
              canManage
              onDelete={async (aid) => {
                if (!confirm(uk.event.deleteAlbumConfirm)) return
                await deleteAlbum(aid)
                setAlbums((prev) => prev.filter((a) => a.id !== aid))
                if (albumId === aid) setAlbumId(undefined)
              }}
            />
            <AddAlbumForm
              value={albumName}
              onChange={setAlbumName}
              onSubmit={async () => {
                if (!albumName.trim()) return
                const res = await createAlbum(event.id, albumName.trim())
                setAlbums((prev) => [...prev, res.album])
                setAlbumName('')
                setAlbumId(res.album.id)
              }}
            />
          </FadeIn>

          <FadeIn delay={0.18}>
            <MediaDropzone onFiles={handleUpload} />
            {error && <p className="text-sm text-red-500 mt-3 text-center">{error}</p>}
          </FadeIn>

          <FadeIn delay={0.22}>
            <MediaGallery
              items={media}
              canDelete
              loading={mediaLoading}
              onDelete={async (mediaId) => {
                await deleteMedia(mediaId)
                setMedia((prev) => prev.filter((m) => m.id !== mediaId))
              }}
            />
          </FadeIn>

          <FadeIn delay={0.25}>
            <button
              type="button"
              onClick={async () => {
                if (!confirm(uk.event.deleteEventConfirm)) return
                await deleteEvent(event.id)
                navigate('/dashboard', { replace: true })
              }}
              className="w-full min-h-[48px] rounded-2xl bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors inline-flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {uk.event.deleteEvent}
            </button>
          </FadeIn>
        </div>

        <FadeIn delay={0.2} className="w-full xl:w-[20.5rem] shrink-0">
          <div className="xl:sticky xl:top-6">
            <EventQRPanel code={event.code} eventName={event.name} />
          </div>
        </FadeIn>
      </div>
    </PageShell>
  )
}
