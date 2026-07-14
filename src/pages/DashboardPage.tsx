import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Camera, Plus, QrCode, Images } from 'lucide-react'
import { listEvents } from '../lib/api'
import type { EventItem } from '../lib/types'
import { CreateEventModal } from '../components/events/CreateEventModal'
import { EventQRPanel } from '../components/qr/EventQRPanel'
import { Button } from '../components/ui/Button'
import { FadeIn, PageShell } from '../components/ui/motion'
import { uk } from '../lib/i18n/uk'

export function DashboardPage() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [created, setCreated] = useState<EventItem | null>(null)

  useEffect(() => {
    listEvents()
      .then((res) => setEvents(res.events))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <PageShell className="ambient-bg md:bg-none">
      <FadeIn className="flex items-center justify-between gap-3 mb-6 sm:mb-8">
        <h1
          className="text-[1.65rem] sm:text-2xl md:text-3xl font-semibold text-espresso tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {events.length ? uk.dashboard.yourEvents : uk.dashboard.welcome}
        </h1>
        <Button
          type="button"
          onClick={() => setModalOpen(true)}
          className="shrink-0 !min-h-[44px] !px-3.5 sm:!min-h-[48px] sm:!px-5"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{uk.dashboard.createEvent}</span>
        </Button>
      </FadeIn>

      {loading ? (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-36 sm:h-40 rounded-3xl bg-pearl/80 animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center justify-center text-center py-14 sm:py-20 px-2"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.45 }}
            className="w-[4.75rem] h-[4.75rem] sm:w-20 sm:h-20 bg-rose-light rounded-full flex items-center justify-center mb-6 shadow-inner"
          >
            <Camera className="w-9 h-9 text-rose" strokeWidth={1.5} />
          </motion.div>
          <h2 className="text-xl sm:text-2xl font-semibold text-espresso mb-3 max-w-xs text-balance">
            {uk.dashboard.emptyTitle}
          </h2>
          <p className="text-espresso/55 text-sm sm:text-base max-w-sm mb-8 leading-relaxed">
            {uk.dashboard.emptyDescription}
          </p>
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => setModalOpen(true)}
            className="
              inline-flex items-center justify-center gap-2
              min-h-[52px] px-8 py-3 rounded-full
              bg-espresso text-white text-sm font-semibold
              w-full max-w-xs shadow-lg shadow-espresso/20
            "
          >
            <Plus className="w-5 h-5" />
            {uk.dashboard.createEvent}
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.07 } },
          }}
          className="grid gap-3 sm:gap-4 sm:grid-cols-2"
        >
          {events.map((event) => (
            <motion.div
              key={event.id}
              variants={{
                hidden: { opacity: 0, y: 14 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                to={`/dashboard/events/${event.id}`}
                className="
                  block bg-white/90 rounded-3xl border border-champagne/70 p-5
                  shadow-[0_8px_30px_-18px_rgba(45,31,29,0.35)]
                  hover:shadow-[0_16px_40px_-20px_rgba(45,31,29,0.4)]
                  hover:-translate-y-0.5 active:translate-y-0
                  transition-all duration-300
                "
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-espresso text-lg truncate">
                      {event.name}
                    </h3>
                    <p className="text-xs text-espresso/45 mt-1 font-mono tracking-wider">
                      {event.code}
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-rose-light/80 flex items-center justify-center shrink-0">
                    <QrCode className="w-5 h-5 text-rose" />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-espresso/55">
                  <Images className="w-4 h-4" />
                  {event.mediaCount ?? 0} {uk.dashboard.photos}
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

      <CreateEventModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(event) => {
          setEvents((prev) => [event, ...prev])
          setModalOpen(false)
          setCreated(event)
        }}
      />

      {created && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/45"
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="w-full max-w-md bg-white rounded-t-[1.75rem] sm:rounded-3xl p-6 shadow-2xl space-y-4 safe-pb"
          >
            <h2
              className="text-xl font-semibold text-espresso text-center"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {created.name} {uk.event.readyTitle}
            </h2>
            <p className="text-sm text-espresso/55 text-center">{uk.event.readySubtitle}</p>
            <EventQRPanel code={created.code} eventName={created.name} />
            <Button
              fullWidth
              onClick={() => {
                const id = created.id
                setCreated(null)
                navigate(`/dashboard/events/${id}`)
              }}
            >
              {uk.dashboard.openEvent}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </PageShell>
  )
}
