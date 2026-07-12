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
  const { signInWithEmail, recoverPassword, resendConfirmation, getErrorMessage } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [errorKey, setErrorKey] = useState('')
  const [success, setSuccess] = useState('')

  const validateEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setErrorKey('')
    setSuccess('')

    if (!validateEmail(email)) {
      setError(uk.errors.invalidEmail)
      return
    }

    if (password.length < 8) {
      setError(uk.errors.passwordTooShort)
      return
    }

    setLoading(true)
    try {
      await signInWithEmail(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      const key = getErrorMessage(err)
      setErrorKey(key)
      setError(uk.errors[key as keyof typeof uk.errors] || uk.errors.generic)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    setError('')
    setErrorKey('')
    setSuccess('')

    if (!validateEmail(email)) {
      setError(uk.errors.invalidEmail)
      return
    }

    setLoading(true)
    try {
      await recoverPassword(email)
      setSuccess(uk.auth.resetSent)
    } catch (err) {
      const key = getErrorMessage(err)
      setErrorKey(key)
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
            label={uk.auth.emailLabel}
            type="email"
            placeholder={uk.auth.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
          />

          <Input
            label={uk.auth.passwordLabel}
            type="password"
            placeholder={uk.auth.passwordPlaceholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={loading}
              className="text-sm text-espresso/60 hover:text-rose transition-colors"
            >
              {uk.auth.forgotPassword}
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-red-500 text-center space-y-2"
            >
              <p>{error}</p>
              {errorKey === 'emailNotConfirmed' && email && (
                <button
                  type="button"
                  disabled={resending}
                  onClick={async () => {
                    setResending(true)
                    try {
                      await resendConfirmation(email)
                      setSuccess(uk.errors.confirmationSent)
                      setError('')
                      setErrorKey('')
                    } catch {
                      setError(uk.errors.generic)
                    } finally {
                      setResending(false)
                    }
                  }}
                  className="text-rose font-medium hover:underline disabled:opacity-50"
                >
                  {uk.errors.resendConfirmation}
                </button>
              )}
            </motion.div>
          )}

          {success && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-green-600 text-center bg-green-50 rounded-xl p-3"
            >
              {success}
            </motion.p>
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

        <p className="text-center text-xs text-gray-400 mt-6 leading-relaxed">
          {uk.auth.terms}
        </p>
      </motion.div>
    </div>
  )
}
