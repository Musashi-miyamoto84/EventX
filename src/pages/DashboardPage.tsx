import { motion } from 'framer-motion'
import { Camera, Plus } from 'lucide-react'
import { uk } from '../lib/i18n/uk'

export function DashboardPage() {
  return (
    <div className="flex-1 px-5 py-6 md:px-10 md:py-8">
      <h1
        className="text-2xl md:text-3xl font-bold text-espresso mb-8"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {uk.dashboard.welcome}
      </h1>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-col items-center justify-center text-center py-12 md:py-20"
      >
        <div className="w-20 h-20 bg-rose-light rounded-full flex items-center justify-center mb-6">
          <Camera className="w-9 h-9 text-rose" strokeWidth={1.5} />
        </div>

        <h2 className="text-xl md:text-2xl font-bold text-espresso mb-3 max-w-xs">
          {uk.dashboard.emptyTitle}
        </h2>

        <p className="text-espresso/60 text-sm md:text-base max-w-sm mb-8 leading-relaxed">
          {uk.dashboard.emptyDescription}
        </p>

        <button
          type="button"
          className="
            inline-flex items-center justify-center gap-2
            min-h-[52px] px-8 py-3 rounded-full
            bg-espresso text-white text-sm font-semibold
            hover:bg-charcoal active:scale-[0.98] transition-all
            shadow-lg shadow-espresso/20
            w-full max-w-xs
          "
        >
          <Plus className="w-5 h-5" />
          {uk.dashboard.createEvent}
        </button>
      </motion.div>
    </div>
  )
}
