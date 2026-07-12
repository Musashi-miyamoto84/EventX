import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import netlifyIdentity from 'netlify-identity-widget'

interface NetlifyIdentityUser {
  id: string
  email: string
  user_metadata?: Record<string, unknown>
  app_metadata?: Record<string, unknown>
  created_at?: string
  token?: {
    access_token: string
    refresh_token: string
    expires_in?: number
  }
}
import {
  clearAuth,
  getUser,
  loadAuth,
  mapAuthError,
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

  useEffect(() => {
    netlifyIdentity.init()

    const handleLogin = (netlifyUser: NetlifyIdentityUser | null | undefined) => {
      if (netlifyUser) {
        const mapped: NetlifyUser = {
          id: netlifyUser.id,
          email: netlifyUser.email,
          user_metadata: netlifyUser.user_metadata ?? {},
          app_metadata: netlifyUser.app_metadata ?? {},
          created_at: netlifyUser.created_at ?? new Date().toISOString(),
        }
        setUser(mapped)
        if (netlifyUser.token) {
          saveAuth(
            {
              access_token: netlifyUser.token.access_token,
              refresh_token: netlifyUser.token.refresh_token,
              expires_in: netlifyUser.token.expires_in ?? 3600,
              token_type: 'bearer',
            },
            mapped,
          )
        }
      }
    }

    netlifyIdentity.on('init', handleLogin)
    netlifyIdentity.on('login', handleLogin)
    netlifyIdentity.on('logout', () => {
      clearAuth()
      setUser(null)
    })

    const stored = loadAuth()
    if (stored) {
      applyStoredAuth(stored).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }

    return () => {
      netlifyIdentity.off('init')
      netlifyIdentity.off('login')
      netlifyIdentity.off('logout')
    }
  }, [applyStoredAuth])

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      const result = await signUp(email, password)
      if (result.user) {
        setUser(result.user)
      }
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
    netlifyIdentity.open('login')
  }, [])

  const signOut = useCallback(() => {
    netlifyIdentity.logout()
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
