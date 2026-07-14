import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, QrCode, Sparkles, Images } from 'lucide-react'
import { Logo } from '../components/ui/Logo'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { uk } from '../lib/i18n/uk'

export function LandingPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-dvh ambient-bg overflow-x-hidden">
      <header className="flex items-center justify-between page-pad py-4 safe-pt max-w-5xl mx-auto w-full">
        <Logo size="sm" />
        <div className="flex gap-2">
          {user ? (
            <Link to="/dashboard">
              <Button variant="dark" className="!min-h-[44px] !px-4">
                {uk.dashboard.home}
              </Button>
            </Link>
          ) : (
            <Link to="/login">
              <Button variant="secondary" className="!min-h-[44px] !px-4">
                {uk.auth.signIn}
              </Button>
            </Link>
          )}
        </div>
      </header>

      <main className="page-pad pt-8 sm:pt-14 pb-16 sm:pb-24 max-w-5xl mx-auto">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.45 }}
            className="inline-flex items-center gap-2 text-rose mb-5 sm:mb-6"
          >
            <Heart className="w-5 h-5 fill-rose" />
            <span className="text-sm font-medium tracking-[0.08em]">Eventoly</span>
          </motion.div>

          <h1
            className="text-[2.1rem] leading-[1.15] sm:text-4xl md:text-5xl font-semibold text-espresso mb-4 text-balance"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {uk.landing.headline}
          </h1>
          <p className="text-base sm:text-lg text-espresso/55 mb-8 sm:mb-10">
            {uk.landing.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={user ? '/dashboard' : '/register'} className="w-full sm:w-auto">
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button fullWidth className="sm:min-w-[210px]">
                  {uk.landing.createEvent}
                </Button>
              </motion.div>
            </Link>
            <Link to="/join" className="w-full sm:w-auto">
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button variant="secondary" fullWidth className="sm:min-w-[210px]">
                  {uk.landing.joinEvent}
                </Button>
              </motion.div>
            </Link>
          </div>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-40px' }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.1 } },
          }}
          className="mt-14 sm:mt-20 grid gap-3 sm:gap-4 sm:grid-cols-3 max-w-3xl mx-auto"
        >
          {[
            { icon: QrCode, text: uk.landing.feature1 },
            { icon: Images, text: uk.landing.feature2 },
            { icon: Sparkles, text: uk.landing.feature3 },
          ].map(({ icon: Icon, text }) => (
            <motion.div
              key={text}
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.45 }}
              className="bg-white/75 rounded-3xl p-5 sm:p-6 text-center border border-white/90 shadow-[0_12px_40px_-28px_rgba(45,31,29,0.5)]"
            >
              <div className="w-11 h-11 rounded-2xl bg-rose-light/70 flex items-center justify-center mx-auto mb-3">
                <Icon className="w-5 h-5 text-rose" />
              </div>
              <p className="text-sm text-espresso/75 leading-relaxed">{text}</p>
            </motion.div>
          ))}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-16 sm:mt-24 max-w-2xl mx-auto"
        >
          <h2
            className="text-2xl sm:text-3xl font-semibold text-espresso text-center mb-8"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {uk.landing.howTitle}
          </h2>
          <ol className="space-y-4">
            {[
              { title: uk.landing.step1Title, text: uk.landing.step1Text },
              { title: uk.landing.step2Title, text: uk.landing.step2Text },
              { title: uk.landing.step3Title, text: uk.landing.step3Text },
            ].map((step, i) => (
              <li
                key={step.title}
                className="flex gap-4 bg-white/70 rounded-3xl border border-white/80 p-5"
              >
                <span className="shrink-0 w-9 h-9 rounded-full bg-espresso text-white text-sm font-semibold flex items-center justify-center">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-espresso mb-1">{step.title}</p>
                  <p className="text-sm text-espresso/60 leading-relaxed">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </motion.section>

        <div className="mt-14 sm:mt-20 text-center">
          <Link to={user ? '/dashboard' : '/register'}>
            <Button className="min-w-[220px]">{uk.landing.createEvent}</Button>
          </Link>
          <div className="flex justify-center gap-4 mt-8 text-xs text-espresso/45">
            <Link to="/legal/privacy" className="hover:text-espresso/70">
              {uk.settings.privacy}
            </Link>
            <Link to="/legal/terms" className="hover:text-espresso/70">
              {uk.settings.terms}
            </Link>
          </div>
          <p className="text-xs text-espresso/40 mt-4">{uk.landing.footerNote}</p>
        </div>
      </main>
    </div>
  )
}
