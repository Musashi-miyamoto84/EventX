import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { listEvents } from '../lib/api'
import type { EventItem } from '../lib/types'
import { FadeIn, PageShell } from '../components/ui/motion'
import { uk } from '../lib/i18n/uk'

export function AlbumPage() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listEvents()
      .then((res) => setEvents(res.events))
      .finally(() => setLoading(false))
  }, [])

  return (
    <PageShell>
      <FadeIn>
        <h1
          className="text-2xl sm:text-3xl font-semibold text-espresso mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {uk.dashboard.album}
        </h1>
        <p className="text-sm text-espresso/50 mb-6">
          {uk.dashboard.albumsSubtitle}
        </p>
      </FadeIn>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-pearl animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-champagne bg-white/50 p-10 text-center">
          <p className="text-espresso/50 text-sm mb-4">{uk.dashboard.emptyDescription}</p>
          <Link to="/dashboard" className="text-rose font-medium text-sm">
            {uk.dashboard.createEvent}
          </Link>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
          className="space-y-3"
        >
          {events.map((event) => (
            <motion.div
              key={event.id}
              variants={{
                hidden: { opacity: 0, y: 10 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <Link
                to={`/dashboard/events/${event.id}`}
                className="
                  flex items-center justify-between bg-white/90 rounded-2xl
                  border border-champagne/60 p-4 min-h-[72px]
                  active:scale-[0.99] transition-transform
                "
              >
                <div className="min-w-0">
                  <p className="font-medium text-espresso truncate">{event.name}</p>
                  <p className="text-xs text-espresso/45 mt-1">
                    {event.mediaCount ?? 0} {uk.dashboard.photos}
                    {event.eventDate
                      ? ` · ${new Date(event.eventDate).toLocaleDateString('uk-UA')}`
                      : ''}
                  </p>
                </div>
                <span className="font-mono text-xs text-rose shrink-0 ml-3 tracking-wider">
                  {event.code}
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </PageShell>
  )
}
