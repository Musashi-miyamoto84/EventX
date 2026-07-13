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
  const { signUpWithLogin, getErrorMessage } = useAuth()
  const navigate = useNavigate()

  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!/^[a-zA-Z0-9._-]{3,32}$/.test(login.trim())) {
      setError(uk.errors.invalidLogin)
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
      await signUpWithLogin(login, password)
      navigate('/dashboard', { replace: true })
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
          className="text-2xl font-semibold text-center text-espresso mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {uk.auth.signUpTitle}
        </h1>
        <p className="text-center text-sm text-espresso/60 mb-6">
          {uk.auth.signUpDescription}
        </p>

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
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <Button type="submit" fullWidth loading={loading}>
            <UserPlus className="w-4 h-4" />
            {uk.auth.signUp}
          </Button>
        </form>

        <p className="text-center text-sm text-espresso/60 mt-8">
          {uk.auth.hasAccount}{' '}
          <Link to="/login" className="text-rose font-semibold hover:underline">
            {uk.auth.signInTitle}
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
