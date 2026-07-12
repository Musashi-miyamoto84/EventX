export interface NetlifyUser {
  id: string
  email: string
  user_metadata: {
    full_name?: string
    avatar_url?: string
  }
  app_metadata: Record<string, unknown>
  created_at: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

const IDENTITY_URL = '/.netlify/identity'

function getIdentityUrl(): string {
  if (import.meta.env.DEV && import.meta.env.VITE_NETLIFY_IDENTITY_URL) {
    return import.meta.env.VITE_NETLIFY_IDENTITY_URL
  }
  return IDENTITY_URL
}

async function identityFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${getIdentityUrl()}${path}`
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message =
      data.msg || data.error_description || data.error || 'auth_error'
    throw new Error(message)
  }

  return data as T
}

export async function signUp(
  email: string,
  password: string,
): Promise<{ user: NetlifyUser }> {
  return identityFetch('/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<AuthTokens & { user?: NetlifyUser }> {
  return identityFetch('/token', {
    method: 'POST',
    body: JSON.stringify({
      grant_type: 'password',
      username: email,
      password,
    }),
  })
}

export async function requestMagicLink(email: string): Promise<void> {
  await identityFetch('/magiclink', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function requestPasswordRecovery(email: string): Promise<void> {
  await identityFetch('/recover', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function getUser(accessToken: string): Promise<NetlifyUser> {
  return identityFetch('/user', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export async function refreshToken(
  refreshTokenValue: string,
): Promise<AuthTokens> {
  return identityFetch('/token', {
    method: 'POST',
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshTokenValue,
    }),
  })
}

export interface IdentitySettings {
  external: {
    google: boolean
    email: boolean
  }
}

export async function fetchIdentitySettings(): Promise<IdentitySettings | null> {
  try {
    const url = `${getIdentityUrl()}/settings`
    const response = await fetch(url)
    if (!response.ok) return null
    return (await response.json()) as IdentitySettings
  } catch {
    return null
  }
}

export function getGoogleAuthUrl(): string {
  const redirectUri = window.location.origin
  return `${getIdentityUrl()}/authorize?provider=google&redirect_uri=${encodeURIComponent(redirectUri)}`
}

export function parseHashTokens(): AuthTokens | null {
  const hash = window.location.hash.replace(/^#/, '')
  if (!hash || !hash.includes('access_token=')) return null

  const params = new URLSearchParams(hash)
  const access_token = params.get('access_token')
  const refresh_token = params.get('refresh_token')
  const expires_in = Number(params.get('expires_in') ?? 3600)

  if (!access_token || !refresh_token) return null

  return {
    access_token,
    refresh_token,
    expires_in,
    token_type: params.get('token_type') ?? 'bearer',
  }
}

export function mapAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'unknown'

  if (message.includes('User already registered')) {
    return 'userExists'
  }
  if (
    message.includes('Invalid login credentials') ||
    message.includes('invalid_grant')
  ) {
    return 'invalidCredentials'
  }
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'network'
  }
  if (message.includes('404') || message.includes('Not Found')) {
    return 'identityNotEnabled'
  }
  return 'generic'
}

const TOKEN_KEY = 'eventoly_auth'

export interface StoredAuth {
  access_token: string
  refresh_token: string
  user: NetlifyUser
  expires_at: number
}

export function saveAuth(tokens: AuthTokens, user: NetlifyUser): StoredAuth {
  const auth: StoredAuth = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    user,
    expires_at: Date.now() + tokens.expires_in * 1000,
  }
  localStorage.setItem(TOKEN_KEY, JSON.stringify(auth))
  return auth
}

export function loadAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredAuth
  } catch {
    return null
  }
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function getUserInitial(user: NetlifyUser | null): string {
  if (!user?.email) return '?'
  return user.email.charAt(0).toUpperCase()
}
