import type { Handler } from '@netlify/functions'
import { getDb } from './_shared/db'
import { createToken, verifyPassword } from './_shared/crypto'
import {
  badRequest,
  isValidPassword,
  normalizeLogin,
  ok,
  optionsResponse,
  serverError,
  unauthorized,
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

    if (!login || !isValidPassword(password)) {
      return unauthorized('invalid_credentials')
    }

    const sql = getDb()
    const rows = await sql`
      SELECT id, login, password_hash, created_at
      FROM users
      WHERE login = ${login}
      LIMIT 1
    `

    if (rows.length === 0) {
      return unauthorized('invalid_credentials')
    }

    const user = rows[0] as {
      id: string
      login: string
      password_hash: string
      created_at: string
    }

    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      return unauthorized('invalid_credentials')
    }

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
    console.error('login error', error)
    return serverError()
  }
}
