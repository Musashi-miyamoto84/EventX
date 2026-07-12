import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  clearAuth,
  getUser,
  loadAuth,
  mapAuthError,
  parseHashAuthAction,
  refreshToken,
  requestPasswordRecovery,
  resendConfirmationEmail,
  saveAuth,
  signInWithPassword,
  signUp,
  verifyEmailToken,
  type NetlifyUser,
  type StoredAuth,
} from '../lib/auth'

interface AuthContextValue {
  user: NetlifyUser | null
  loading: boolean
  signUpWithEmail: (email: string, password: string) => Promise<{ needsVerification: boolean }>
  signInWithEmail: (email: string, password: string) => Promise<void>
  recoverPassword: (email: string) => Promise<void>
  resendConfirmation: (email: string) => Promise<void>
  signOut: () => void
  getErrorMessage: (error: unknown) => string
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function applyTokens(accessToken: string, refreshTokenValue: string, expiresIn: number) {
  const freshUser = await getUser(accessToken)
  saveAuth(
    {
      access_token: accessToken,
      refresh_token: refreshTokenValue,
      expires_in: expiresIn,
      token_type: 'bearer',
    },
    freshUser,
  )
  return freshUser
}

function clearHashFromUrl() {
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<NetlifyUser | null>(null)
  const [loading, setLoading] = useState(true)

  const applyStoredAuth = useCallback(async (stored: StoredAuth) => {
    if (Date.now() < stored.expires_at - 60_000) {
      setUser(stored.user)
      return
    }

    try {
      const tokens = await refreshToken(stored.refresh_token)
      const freshUser = await getUser(tokens.access_token)
      saveAuth(tokens, freshUser)
      setUser(freshUser)
    } catch {
      clearAuth()
      setUser(null)
    }
  }, [])

  const handleHashAuth = useCallback(async () => {
    const action = parseHashAuthAction()
    if (!action) return false

    try {
      if (action.type === 'session') {
        const freshUser = await applyTokens(
          action.tokens.access_token,
          action.tokens.refresh_token,
          action.tokens.expires_in,
        )
        setUser(freshUser)
        clearHashFromUrl()
        return true
      }

      if (action.type === 'confirmation') {
        const tokens = await verifyEmailToken(action.token, 'signup')
        const freshUser = await applyTokens(
          tokens.access_token,
          tokens.refresh_token,
          tokens.expires_in,
        )
        setUser(freshUser)
        clearHashFromUrl()
        return true
      }

      if (action.type === 'recovery') {
        const tokens = await verifyEmailToken(action.token, 'recovery')
        const freshUser = await applyTokens(
          tokens.access_token,
          tokens.refresh_token,
          tokens.expires_in,
        )
        setUser(freshUser)
        clearHashFromUrl()
        return true
      }
    } catch {
      clearAuth()
      clearHashFromUrl()
    }

    return false
  }, [])

  useEffect(() => {
    async function init() {
      const fromHash = await handleHashAuth()
      if (fromHash) {
        setLoading(false)
        return
      }

      const stored = loadAuth()
      if (stored) {
        await applyStoredAuth(stored)
      }
      setLoading(false)
    }

    init()
  }, [applyStoredAuth, handleHashAuth])

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      await signUp(email.trim().toLowerCase(), password)
      return { needsVerification: true }
    },
    [],
  )

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const tokens = await signInWithPassword(email.trim().toLowerCase(), password)
    const freshUser = await getUser(tokens.access_token)
    saveAuth(tokens, freshUser)
    setUser(freshUser)
  }, [])

  const recoverPassword = useCallback(async (email: string) => {
    await requestPasswordRecovery(email.trim().toLowerCase())
  }, [])

  const resendConfirmation = useCallback(async (email: string) => {
    await resendConfirmationEmail(email.trim().toLowerCase())
  }, [])

  const signOut = useCallback(() => {
    clearAuth()
    setUser(null)
  }, [])

  const getErrorMessage = useCallback((error: unknown) => mapAuthError(error), [])

  const value = useMemo(
    () => ({
      user,
      loading,
      signUpWithEmail,
      signInWithEmail,
      recoverPassword,
      resendConfirmation,
      signOut,
      getErrorMessage,
    }),
    [
      user,
      loading,
      signUpWithEmail,
      signInWithEmail,
      recoverPassword,
      resendConfirmation,
      signOut,
      getErrorMessage,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
