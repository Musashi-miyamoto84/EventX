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
  getGoogleAuthUrl,
  getUser,
  loadAuth,
  mapAuthError,
  parseHashTokens,
  refreshToken,
  requestMagicLink,
  requestPasswordRecovery,
  saveAuth,
  signInWithPassword,
  signUp,
  type NetlifyUser,
  type StoredAuth,
} from '../lib/auth'

interface AuthContextValue {
  user: NetlifyUser | null
  loading: boolean
  signUpWithEmail: (email: string, password: string) => Promise<{ needsVerification: boolean }>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signInWithMagicLink: (email: string) => Promise<void>
  recoverPassword: (email: string) => Promise<void>
  signInWithGoogle: () => void
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

  const handleHashLogin = useCallback(async () => {
    const tokens = parseHashTokens()
    if (!tokens) return false

    try {
      const freshUser = await applyTokens(
        tokens.access_token,
        tokens.refresh_token,
        tokens.expires_in,
      )
      setUser(freshUser)
      window.history.replaceState(null, '', window.location.pathname)
      return true
    } catch {
      clearAuth()
      return false
    }
  }, [])

  useEffect(() => {
    async function init() {
      const fromHash = await handleHashLogin()
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
  }, [applyStoredAuth, handleHashLogin])

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      await signUp(email, password)
      return { needsVerification: true }
    },
    [],
  )

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const tokens = await signInWithPassword(email, password)
    const freshUser = await getUser(tokens.access_token)
    saveAuth(tokens, freshUser)
    setUser(freshUser)
  }, [])

  const signInWithMagicLink = useCallback(async (email: string) => {
    await requestMagicLink(email)
  }, [])

  const recoverPassword = useCallback(async (email: string) => {
    await requestPasswordRecovery(email)
  }, [])

  const signInWithGoogle = useCallback(() => {
    window.location.href = getGoogleAuthUrl()
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
      signInWithMagicLink,
      recoverPassword,
      signInWithGoogle,
      signOut,
      getErrorMessage,
    }),
    [
      user,
      loading,
      signUpWithEmail,
      signInWithEmail,
      signInWithMagicLink,
      recoverPassword,
      signInWithGoogle,
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
