import { ChevronRight, HelpCircle, LogOut, Mail, Star } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { uk } from '../lib/i18n/uk'

export function SettingsPage() {
  const { user, signOut } = useAuth()

  return (
    <div className="flex-1 px-5 py-6 md:px-10 md:py-8">
      <h1
        className="text-2xl md:text-3xl font-bold text-espresso mb-6"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {uk.dashboard.account}
      </h1>

      <div className="space-y-4 max-w-lg">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-espresso mb-2">
            {uk.dashboard.loginDetails}
          </h2>
          <p className="text-sm text-espresso/70">
            {uk.dashboard.signedInAs}{' '}
            <span className="font-medium text-espresso">{user?.email}</span>
          </p>
        </div>

        <SettingsItem
          icon={Star}
          title="Залишити відгук"
          subtitle="Поділіться досвідом використання Eventoly"
        />

        <SettingsItem
          icon={HelpCircle}
          title="Допомога та FAQ"
          subtitle="Часті запитання"
        />

        <SettingsItem
          icon={Mail}
          title="Зв'язатися з підтримкою"
          subtitle="support@eventoly.com"
        />

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
      </div>
    </div>
  )
}

function SettingsItem({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Star
  title: string
  subtitle: string
}) {
  return (
    <button
      type="button"
      className="
        w-full flex items-center gap-4 p-4
        bg-white rounded-2xl shadow-sm border border-gray-100
        hover:bg-pearl/50 transition-colors text-left
      "
    >
      <div className="w-10 h-10 rounded-full bg-rose-light flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-rose" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-espresso text-sm">{title}</p>
        <p className="text-xs text-espresso/60 truncate">{subtitle}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
    </button>
  )
}
