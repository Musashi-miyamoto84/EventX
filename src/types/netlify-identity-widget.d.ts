declare module 'netlify-identity-widget' {
  export interface User {
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

  interface NetlifyIdentity {
    init(): void
    open(mode?: 'login' | 'signup'): void
    close(): void
    logout(): void
    currentUser(): User | null
    on(event: 'init' | 'login' | 'logout' | 'error' | 'close', callback: (user?: User | null) => void): void
    off(event: 'init' | 'login' | 'logout' | 'error' | 'close'): void
  }

  const netlifyIdentity: NetlifyIdentity
  export default netlifyIdentity
}
