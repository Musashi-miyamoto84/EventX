import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '../components/ui/Logo'
import { uk } from '../lib/i18n/uk'

export function LegalPage() {
  const { type } = useParams()
  const isPrivacy = type !== 'terms'
  const title = isPrivacy ? uk.legal.privacyTitle : uk.legal.termsTitle
  const body = isPrivacy ? uk.legal.privacyBody : uk.legal.termsBody

  return (
    <div className="min-h-dvh ambient-bg">
      <header className="page-pad py-4 safe-pt max-w-2xl mx-auto flex items-center justify-between">
        <Logo size="sm" />
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-espresso/60 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          {uk.legal.back}
        </Link>
      </header>
      <main className="page-pad pb-16 max-w-2xl mx-auto">
        <h1
          className="text-3xl font-semibold text-espresso mb-6"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {title}
        </h1>
        <p className="text-espresso/70 leading-relaxed whitespace-pre-line">{body}</p>
      </main>
    </div>
  )
}
