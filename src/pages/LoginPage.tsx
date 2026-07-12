import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Logo } from '../components/ui/Logo'
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton'
import { uk } from '../lib/i18n/uk'

export function LoginPage() {
  const { signInWithEmail, signInWithMagicLink, getErrorMessage } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [useMagicLink, setUseMagicLink] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const validateEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!validateEmail(email)) {
      setError(uk.errors.invalidEmail)
      return
    }

    if (!useMagicLink && password.length < 8) {
      setError(uk.errors.passwordTooShort)
      return
    }

    setLoading(true)
    try {
      if (useMagicLink) {
        await signInWithMagicLink(email)
        setSuccess(uk.auth.magicLinkSent)
      } else {
        await signInWithEmail(email, password)
        navigate(from, { replace: true })
      }
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

          {!useMagicLink && (
            <Input
              label={uk.auth.passwordLabel}
              type="password"
              placeholder={uk.auth.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          )}

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-red-500 text-center"
            >
              {error}
            </motion.p>
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
            <Mail className="w-4 h-4" />
            {useMagicLink ? uk.auth.useMagicLink : uk.auth.signIn}
          </Button>

          <button
            type="button"
            onClick={() => {
              setUseMagicLink(!useMagicLink)
              setError('')
              setSuccess('')
            }}
            className="w-full text-sm text-espresso/60 hover:text-rose transition-colors py-2"
          >
            {useMagicLink ? uk.auth.usePassword : uk.auth.useMagicLink}
          </button>
        </form>

        <GoogleSignInButton />

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
