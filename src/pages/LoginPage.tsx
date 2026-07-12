import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Logo } from '../components/ui/Logo'
import { uk } from '../lib/i18n/uk'

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

export function LoginPage() {
  const { signInWithEmail, signInWithMagicLink, signInWithGoogle, getErrorMessage } =
    useAuth()
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
          <GoogleIcon />
          {uk.auth.googleSignIn}
        </Button>

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
