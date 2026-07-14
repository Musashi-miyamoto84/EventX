import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { GuestRoute, ProtectedRoute } from './components/auth/ProtectedRoute'
import { MobileLayout } from './components/layout/MobileLayout'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { SettingsPage } from './pages/SettingsPage'
import { EventDetailPage } from './pages/EventDetailPage'
import { JoinEventPage } from './pages/JoinEventPage'
import { GuestGalleryPage } from './pages/GuestGalleryPage'
import { LiveSlideshowPage } from './pages/LiveSlideshowPage'
import { AlbumPage } from './pages/AlbumPage'
import { LegalPage } from './pages/LegalPage'

function HomeRedirect() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-ivory">
        <div className="w-8 h-8 border-2 border-rose border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return <LandingPage />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/join" element={<JoinEventPage />} />
          <Route path="/e/:code" element={<GuestGalleryPage />} />
          <Route path="/e/:code/live" element={<LiveSlideshowPage />} />
          <Route path="/legal/:type" element={<LegalPage />} />

          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <RegisterPage />
              </GuestRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MobileLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="events/:id" element={<EventDetailPage />} />
            <Route path="album" element={<AlbumPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
