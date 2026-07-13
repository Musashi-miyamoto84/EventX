import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Logo } from '../components/ui/Logo'
import { uk } from '../lib/i18n/uk'

export function LoginPage() {
  const { signInWithLogin, getErrorMessage } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'

  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (login.trim().length < 3) {
      setError(uk.errors.invalidLogin)
      return
    }
    if (password.length < 8) {
      setError(uk.errors.passwordTooShort)
      return
    }

    setLoading(true)
    try {
      await signInWithLogin(login, password)
      navigate(from, { replace: true })
    } catch (err) {
      const key = getErrorMessage(err)
      setError(uk.errors[key as keyof typeof uk.errors] || uk.errors.generic)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-ivory flex flex-col items-center justify-center px-5 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="flex justify-center mb-10">
          <Logo size="lg" />
        </div>

        <h1
          className="text-2xl font-semibold text-center text-espresso mb-6"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {uk.auth.signInTitle}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={uk.auth.loginLabel}
            type="text"
            placeholder={uk.auth.loginPlaceholder}
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
          />

          <Input
            label={uk.auth.passwordLabel}
            type="password"
            placeholder={uk.auth.passwordPlaceholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <Button type="submit" fullWidth loading={loading}>
            <LogIn className="w-4 h-4" />
            {uk.auth.signIn}
          </Button>
        </form>

        <p className="text-center text-sm text-espresso/60 mt-8">
          {uk.auth.noAccount}{' '}
          <Link to="/register" className="text-rose font-semibold hover:underline">
            {uk.auth.createAccount}
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
