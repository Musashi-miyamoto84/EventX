import { uk } from '../lib/i18n/uk'

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex-1 px-5 py-6 md:px-10 md:py-8">
      <h1
        className="text-2xl md:text-3xl font-bold text-espresso mb-4"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h1>
      <p className="text-espresso/60 text-sm">Скоро буде доступно...</p>
    </div>
  )
}

export function TemplatesPage() {
  return <PlaceholderPage title={uk.dashboard.templates} />
}

export function AlbumPage() {
  return <PlaceholderPage title={uk.dashboard.album} />
}
