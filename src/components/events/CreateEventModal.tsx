import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { createEvent } from '../../lib/api'
import type { EventItem } from '../../lib/types'
import { uk } from '../../lib/i18n/uk'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (event: EventItem) => void
}

export function CreateEventModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) {
      setError(uk.errors.invalid_name)
      return
    }

    setLoading(true)
    try {
      const { event } = await createEvent({
        name: name.trim(),
        eventDate: eventDate || null,
      })
      setName('')
      setEventDate('')
      onCreated(event)
    } catch (err) {
      const key = err instanceof Error ? err.message : 'generic'
      setError(uk.errors[key as keyof typeof uk.errors] || uk.errors.generic)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/45"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 48, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-t-[1.75rem] sm:rounded-3xl p-6 shadow-2xl safe-pb"
          >
            <div className="mx-auto w-10 h-1 rounded-full bg-champagne mb-5 sm:hidden" />
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2
                  className="text-xl font-semibold text-espresso"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {uk.event.createTitle}
                </h2>
                <p className="text-sm text-espresso/55 mt-1">{uk.event.createSubtitle}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2.5 rounded-xl hover:bg-pearl touch-target flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label={uk.event.nameLabel}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={uk.event.namePlaceholder}
                maxLength={80}
              />
              <Input
                label={uk.event.dateLabel}
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}
              <Button type="submit" fullWidth loading={loading}>
                {uk.event.create}
              </Button>
              <Button type="button" variant="ghost" fullWidth onClick={onClose}>
                {uk.event.cancel}
              </Button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
