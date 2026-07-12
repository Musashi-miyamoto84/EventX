import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Logo } from '../components/ui/Logo'
import { uk } from '../lib/i18n/uk'

export function RegisterPage() {
  const { signUpWithEmail, signInWithGoogle, getErrorMessage } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const validateEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateEmail(email)) {
      setError(uk.errors.invalidEmail)
      return
    }

    if (password.length < 8) {
      setError(uk.errors.passwordTooShort)
      return
    }

    if (password !== confirmPassword) {
      setError(uk.errors.passwordsMismatch)
      return
    }

    setLoading(true)
    try {
      await signUpWithEmail(email, password)
      setSuccess(true)
    } catch (err) {
      const key = getErrorMessage(err)
      setError(uk.errors[key as keyof typeof uk.errors] || uk.errors.generic)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-dvh bg-ivory flex flex-col items-center justify-center px-5 py-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm text-center"
        >
          <div className="flex justify-center mb-8">
            <Logo size="lg" />
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-rose-light rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-rose" />
            </div>
            <h2 className="text-xl font-semibold text-espresso mb-2">
              {uk.auth.signUpTitle}
            </h2>
            <p className="text-espresso/70 text-sm mb-6 leading-relaxed">
              {uk.auth.verifyEmail}
            </p>
            <Button fullWidth onClick={() => navigate('/login')}>
              {uk.auth.signInTitle}
            </Button>
          </div>
        </motion.div>
      </div>
    )
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
          {uk.auth.signUpTitle}
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
            autoComplete="new-password"
          />

          <Input
            label={uk.auth.confirmPasswordLabel}
            type="password"
            placeholder={uk.auth.passwordPlaceholder}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-red-500 text-center"
            >
              {error}
            </motion.p>
          )}

          <Button type="submit" fullWidth loading={loading}>
            <UserPlus className="w-4 h-4" />
            {uk.auth.signUp}
          </Button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 uppercase">{uk.auth.or}</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <Button
          variant="secondary"
          fullWidth
          type="button"
          onClick={signInWithGoogle}
        >
          {uk.auth.googleSignIn}
        </Button>

        <p className="text-center text-sm text-espresso/60 mt-8">
          {uk.auth.hasAccount}{' '}
          <Link to="/login" className="text-rose font-semibold hover:underline">
            {uk.auth.signInTitle}
          </Link>
        </p>

        <p className="text-center text-xs text-gray-400 mt-6 leading-relaxed">
          {uk.auth.terms}
        </p>
      </motion.div>
    </div>
  )
}
