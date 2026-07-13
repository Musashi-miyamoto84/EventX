import type { Handler } from '@netlify/functions'
import { getDb } from './_shared/db'
import { createToken, hashPassword } from './_shared/crypto'
import {
  badRequest,
  conflict,
  isValidLogin,
  isValidPassword,
  normalizeLogin,
  ok,
  optionsResponse,
  serverError,
} from './_shared/http'

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse()
  if (event.httpMethod !== 'POST') return badRequest('Method not allowed')

  try {
    const body = JSON.parse(event.body || '{}') as {
      login?: string
      password?: string
    }

    const login = normalizeLogin(body.login || '')
    const password = body.password || ''

    if (!isValidLogin(login)) {
      return badRequest('invalid_login')
    }
    if (!isValidPassword(password)) {
      return badRequest('password_too_short')
    }

    const sql = getDb()
    const existing = await sql`SELECT id FROM users WHERE login = ${login} LIMIT 1`
    if (existing.length > 0) {
      return conflict('user_exists')
    }

    const passwordHash = await hashPassword(password)
    const rows = await sql`
      INSERT INTO users (login, password_hash)
      VALUES (${login}, ${passwordHash})
      RETURNING id, login, created_at
    `

    const user = rows[0] as { id: string; login: string; created_at: string }
    const token = await createToken({ userId: user.id, login: user.login })

    return ok({
      token,
      user: {
        id: user.id,
        login: user.login,
        createdAt: user.created_at,
      },
    })
  } catch (error) {
    console.error('signup error', error)
    return serverError()
  }
}
