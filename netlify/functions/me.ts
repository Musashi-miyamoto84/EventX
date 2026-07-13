import type { Handler } from '@netlify/functions'
import { getDb } from './_shared/db'
import { verifyToken } from './_shared/crypto'
import {
  getBearerToken,
  ok,
  optionsResponse,
  serverError,
  unauthorized,
} from './_shared/http'

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse()
  if (event.httpMethod !== 'GET') {
    return unauthorized('Method not allowed')
  }

  try {
    const token = getBearerToken(event.headers.authorization || event.headers.Authorization)
    if (!token) return unauthorized()

    const { userId } = await verifyToken(token)
    const sql = getDb()
    const rows = await sql`
      SELECT id, login, created_at
      FROM users
      WHERE id = ${userId}
      LIMIT 1
    `

    if (rows.length === 0) return unauthorized()

    const user = rows[0] as { id: string; login: string; created_at: string }

    return ok({
      user: {
        id: user.id,
        login: user.login,
        createdAt: user.created_at,
      },
    })
  } catch (error) {
    console.error('me error', error)
    return serverError()
  }
}
