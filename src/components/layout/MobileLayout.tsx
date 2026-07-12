import { motion } from 'framer-motion'
import {
  Camera,
  Home,
  Image,
  LayoutTemplate,
  Settings,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getUserInitial } from '../../lib/auth'
import { uk } from '../../lib/i18n/uk'

const navItems = [
  { to: '/dashboard', icon: Home, label: uk.dashboard.home },
  { to: '/dashboard/templates', icon: LayoutTemplate, label: uk.dashboard.templates },
  { to: '/dashboard/album', icon: Image, label: uk.dashboard.album },
  { to: '/dashboard/settings', icon: Settings, label: uk.dashboard.settings },
]

export function MobileLayout() {
  const { user } = useAuth()

  return (
    <div className="min-h-dvh bg-ivory flex flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-20 lg:w-24 bg-espresso min-h-dvh py-6 items-center shrink-0">
        <div className="mb-8">
          <Camera className="w-7 h-7 text-rose-light" strokeWidth={1.5} />
        </div>

        <nav className="flex-1 flex flex-col items-center gap-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-rose-light/20 text-rose-light'
                    : 'text-white/50 hover:text-white/80'
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

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-dvh pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-espresso border-t border-white/10 z-50">
        <div className="flex items-center justify-around px-2 py-2 safe-area-bottom">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl min-w-[64px] transition-colors ${
                  isActive ? 'text-rose-light' : 'text-white/50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <motion.div
                    animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2 : 1.5} />
                  </motion.div>
                  <span className="text-[10px] font-medium">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
