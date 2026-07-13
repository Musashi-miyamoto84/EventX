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
  clearToken,
  fetchMe,
  getToken,
  mapAuthError,
  saveToken,
  signIn,
  signUp,
  type AuthUser,
} from '../lib/auth'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  signUpWithLogin: (login: string, password: string) => Promise<void>
  signInWithLogin: (login: string, password: string) => Promise<void>
  signOut: () => void
  getErrorMessage: (error: unknown) => string
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const token = getToken()
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const { user: current } = await fetchMe(token)
        setUser(current)
      } catch {
        clearToken()
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  const signUpWithLogin = useCallback(async (login: string, password: string) => {
    const result = await signUp(login, password)
    saveToken(result.token)
    setUser(result.user)
  }, [])

  const signInWithLogin = useCallback(async (login: string, password: string) => {
    const result = await signIn(login, password)
    saveToken(result.token)
    setUser(result.user)
  }, [])

  const signOut = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  const getErrorMessage = useCallback((error: unknown) => mapAuthError(error), [])

  const value = useMemo(
    () => ({
      user,
      loading,
      signUpWithLogin,
      signInWithLogin,
      signOut,
      getErrorMessage,
    }),
    [user, loading, signUpWithLogin, signInWithLogin, signOut, getErrorMessage],
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
