import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Logo } from '../components/ui/Logo'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { uk } from '../lib/i18n/uk'

export function JoinEventPage() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const normalized = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (normalized.length < 4) {
      setError(uk.guest.notFound)
      return
    }
    navigate(`/e/${normalized}`)
  }

  return (
    <div className="min-h-dvh ambient-bg flex flex-col items-center justify-center page-pad py-10 safe-pt safe-pb">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-sm"
      >
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>
        <h1
          className="text-2xl font-semibold text-center text-espresso mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {uk.guest.joinTitle}
        </h1>
        <p className="text-center text-sm text-espresso/55 mb-6">{uk.guest.joinSubtitle}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={uk.guest.codeLabel}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={uk.guest.codePlaceholder}
            autoCapitalize="characters"
            className="font-mono tracking-[0.25em] text-center text-lg"
          />
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <Button type="submit" fullWidth>
            {uk.guest.enter}
          </Button>
        </form>

        <p className="text-center mt-8">
          <Link to="/" className="text-sm text-espresso/50 hover:text-rose transition-colors">
            {uk.guest.backHome}
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
