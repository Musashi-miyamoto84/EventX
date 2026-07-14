import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, FileText, HelpCircle, LogOut, Mail, Shield } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { FadeIn, PageShell } from '../components/ui/motion'
import { SUPPORT_EMAIL } from '../lib/config'
import { uk } from '../lib/i18n/uk'

const faqs = [
  { q: uk.settings.q1, a: uk.settings.a1 },
  { q: uk.settings.q2, a: uk.settings.a2 },
  { q: uk.settings.q3, a: uk.settings.a3 },
  { q: uk.settings.q4, a: uk.settings.a4 },
]

export function SettingsPage() {
  const { user, signOut } = useAuth()
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <PageShell>
      <FadeIn>
        <h1
          className="text-2xl sm:text-3xl font-semibold text-espresso mb-6"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {uk.dashboard.account}
        </h1>
      </FadeIn>

      <div className="space-y-4 max-w-lg">
        <FadeIn delay={0.05}>
          <div className="bg-white/90 rounded-3xl p-5 shadow-sm border border-champagne/60">
            <h2 className="font-semibold text-espresso mb-2">{uk.dashboard.loginDetails}</h2>
            <p className="text-sm text-espresso/70">
              {uk.dashboard.signedInAs}{' '}
              <span className="font-medium text-espresso">{user?.login}</span>
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="bg-white/90 rounded-3xl border border-champagne/60 overflow-hidden">
            <div className="flex items-center gap-3 p-4 border-b border-champagne/40">
              <div className="w-10 h-10 rounded-full bg-rose-light flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-rose" />
              </div>
              <div>
                <p className="font-medium text-espresso text-sm">{uk.settings.faq}</p>
                <p className="text-xs text-espresso/55">{uk.settings.faqSubtitle}</p>
              </div>
            </div>
            <div className="divide-y divide-champagne/40">
              {faqs.map((item, index) => {
                const open = openFaq === index
                return (
                  <div key={item.q}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : index)}
                      className="w-full flex items-center justify-between gap-3 p-4 text-left min-h-[52px]"
                    >
                      <span className="text-sm font-medium text-espresso">{item.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-espresso/40 transition-transform ${
                          open ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <p className="px-4 pb-4 text-sm text-espresso/65 leading-relaxed">
                            {item.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.15}>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Eventoly — підтримка')}`}
            className="
              w-full flex items-center gap-4 p-4
              bg-white/90 rounded-3xl shadow-sm border border-champagne/60
              hover:bg-pearl/50 transition-colors text-left
            "
          >
            <div className="w-10 h-10 rounded-full bg-rose-light flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-rose" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-espresso text-sm">{uk.settings.contact}</p>
              <p className="text-xs text-espresso/60 truncate">{SUPPORT_EMAIL}</p>
            </div>
          </a>
        </FadeIn>

        <FadeIn delay={0.18}>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/legal/privacy"
              className="flex items-center gap-3 p-4 bg-white/90 rounded-3xl border border-champagne/60 min-h-[64px]"
            >
              <Shield className="w-4 h-4 text-rose shrink-0" />
              <span className="text-sm font-medium text-espresso">{uk.settings.privacy}</span>
            </Link>
            <Link
              to="/legal/terms"
              className="flex items-center gap-3 p-4 bg-white/90 rounded-3xl border border-champagne/60 min-h-[64px]"
            >
              <FileText className="w-4 h-4 text-rose shrink-0" />
              <span className="text-sm font-medium text-espresso">{uk.settings.terms}</span>
            </Link>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <button
            type="button"
            onClick={signOut}
            className="
              w-full flex items-center justify-center gap-2
              min-h-[48px] px-5 py-3 rounded-2xl
              bg-red-50 text-red-600 font-medium text-sm
              hover:bg-red-100 transition-colors
            "
          >
            <LogOut className="w-4 h-4" />
            {uk.auth.logout}
          </button>
        </FadeIn>
      </div>
    </PageShell>
  )
}
