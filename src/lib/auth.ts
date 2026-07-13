export interface AuthUser {
  id: string
  login: string
  createdAt: string
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

const TOKEN_KEY = 'eventoly_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function getUserInitial(user: AuthUser | null) {
  if (!user?.login) return '?'
  return user.login.charAt(0).toUpperCase()
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/.netlify/functions/${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'generic')
  }

  return data as T
}

export async function signUp(login: string, password: string) {
  return api<AuthResponse>('signup', {
    method: 'POST',
    body: JSON.stringify({ login, password }),
  })
}

export async function signIn(login: string, password: string) {
  return api<AuthResponse>('login', {
    method: 'POST',
    body: JSON.stringify({ login, password }),
  })
}

export async function fetchMe(token: string) {
  return api<{ user: AuthUser }>('me', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function mapAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : 'generic'

  if (message === 'invalid_login') return 'invalidLogin'
  if (message === 'password_too_short') return 'passwordTooShort'
  if (message === 'user_exists') return 'userExists'
  if (message === 'invalid_credentials') return 'invalidCredentials'
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'network'
  }
  return 'generic'
}
