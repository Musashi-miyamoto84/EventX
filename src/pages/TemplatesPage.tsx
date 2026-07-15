import { useState } from 'react'
import { motion } from 'framer-motion'
import { Logo } from '../components/ui/Logo'
import { FadeIn, PageShell } from '../components/ui/motion'
import {
  FlipCarousel,
  TemplatePreviewModal,
} from '../components/templates/TemplatePreview'
import {
  miniCardTemplates,
  tableTemplates,
  type MiniCardTemplate,
  type TableTemplate,
  type TemplateCategory,
} from '../lib/templates'
import { uk } from '../lib/i18n/uk'

type PreviewState =
  | { kind: 'table'; item: TableTemplate }
  | { kind: 'mini'; item: MiniCardTemplate }
  | null

export function TemplatesPage() {
  const [category, setCategory] = useState<TemplateCategory>('minicards')
  const [preview, setPreview] = useState<PreviewState>(null)

  return (
    <PageShell className="ambient-bg md:bg-none max-w-6xl mx-auto w-full">
      <FadeIn className="mb-6 sm:mb-8 md:mb-10">
        <div className="mb-4 md:hidden">
          <Logo size="sm" />
        </div>
        <h1
          className="
            text-[1.7rem] leading-[1.15] sm:text-3xl md:text-[2.15rem]
            font-semibold text-espresso mb-2.5 sm:mb-3
          "
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {uk.templates.title}
        </h1>
        <p className="text-[15px] sm:text-base md:text-lg text-espresso/55 max-w-2xl leading-relaxed">
          {uk.templates.subtitle}
        </p>
      </FadeIn>

      <FadeIn delay={0.04} className="mb-6 sm:mb-8">
        <div
          className="
            flex w-full sm:w-auto sm:inline-flex gap-2 p-1.5 rounded-2xl
            bg-white/90 border border-champagne/70 shadow-sm
          "
        >
          {(
            [
              { id: 'minicards' as const, label: uk.templates.minicards },
              { id: 'table' as const, label: uk.templates.tableSigns },
            ] as const
          ).map((tab) => {
            const active = category === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategory(tab.id)}
                className={`
                  flex-1 sm:flex-none min-h-[46px] px-4 sm:px-6 rounded-xl
                  text-sm sm:text-[15px] font-semibold transition-all
                  ${
                    active
                      ? 'bg-rose text-white shadow-sm shadow-rose/25'
                      : 'bg-transparent text-rose hover:bg-rose-light/40'
                  }
                `}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </FadeIn>

      {category === 'minicards' ? (
        <motion.div
          key="minicards"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5"
        >
          {miniCardTemplates.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.35 }}
            >
              <FlipCarousel
                front={item.front}
                back={item.back}
                alt={item.title}
                onOpen={() => setPreview({ kind: 'mini', item })}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          key="table"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6"
        >
          {tableTemplates.map((item, i) => (
            <motion.button
              key={item.id}
              type="button"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.35 }}
              onClick={() => setPreview({ kind: 'table', item })}
              className="
                group text-left rounded-2xl md:rounded-3xl overflow-hidden bg-white
                border border-champagne/60
                shadow-[0_10px_36px_-28px_rgba(45,31,29,0.45)]
                hover:border-rose/30 hover:shadow-[0_16px_40px_-24px_rgba(240,98,146,0.35)]
                transition-all active:scale-[0.99]
              "
            >
              <div className="aspect-[4/3] bg-gradient-to-b from-pearl/40 to-white p-5 sm:p-6 md:p-7 flex items-center justify-center">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>
              <div className="px-5 py-3.5 sm:py-4 border-t border-champagne/45">
                <p
                  className="text-base sm:text-lg font-semibold text-espresso group-hover:text-rose transition-colors"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {item.title}
                </p>
              </div>
            </motion.button>
          ))}
        </motion.div>
      )}

      <TemplatePreviewModal
        open={!!preview}
        title={preview?.item.title ?? ''}
        canvaUrl={preview?.item.canvaUrl ?? '#'}
        image={preview?.kind === 'table' ? preview.item.image : undefined}
        front={preview?.kind === 'mini' ? preview.item.front : undefined}
        back={preview?.kind === 'mini' ? preview.item.back : undefined}
        onClose={() => setPreview(null)}
      />
    </PageShell>
  )
}
