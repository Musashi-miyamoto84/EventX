import { motion } from 'framer-motion'
import { Camera, Home, Image, Settings } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getUserInitial } from '../../lib/auth'
import { uk } from '../../lib/i18n/uk'

const navItems = [
  { to: '/dashboard', icon: Home, label: uk.dashboard.home, end: true },
  { to: '/dashboard/album', icon: Image, label: uk.dashboard.album, end: false },
  { to: '/dashboard/settings', icon: Settings, label: uk.dashboard.settings, end: false },
]

export function MobileLayout() {
  const { user } = useAuth()

  return (
    <div className="min-h-dvh bg-ivory flex flex-col md:flex-row">
      <aside className="hidden md:flex flex-col w-[4.75rem] lg:w-24 bg-espresso min-h-dvh py-6 items-center shrink-0">
        <div className="mb-8">
          <Camera className="w-7 h-7 text-rose-light" strokeWidth={1.5} />
        </div>

        <nav className="flex-1 flex flex-col items-center gap-1.5">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'bg-rose-light/20 text-rose-light'
                    : 'text-white/45 hover:text-white/80'
                }`
              }
            >
              <Icon className="w-5 h-5" strokeWidth={1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="w-9 h-9 rounded-full bg-rose flex items-center justify-center text-white text-sm font-semibold">
          {getUserInitial(user)}
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-dvh pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0">
        <Outlet />
      </main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-espresso/95 backdrop-blur-lg border-t border-white/10 safe-pb">
        <div className="flex items-center justify-around px-2 pt-1.5 pb-1">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl min-w-[72px] min-h-[52px] justify-center"
            >
              {({ isActive }) => (
                <>
                  <motion.div
                    animate={isActive ? { scale: 1.12, y: -1 } : { scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                    className={isActive ? 'text-rose-light' : 'text-white/45'}
                  >
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2 : 1.5} />
                  </motion.div>
                  <span
                    className={`text-[10px] font-medium ${
                      isActive ? 'text-rose-light' : 'text-white/45'
                    }`}
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
