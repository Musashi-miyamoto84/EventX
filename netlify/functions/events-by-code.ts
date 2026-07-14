import type { Handler } from '@netlify/functions'
import { getDb } from './_shared/db'
import {
  badRequest,
  ok,
  optionsResponse,
  serverError,
  unauthorized,
} from './_shared/http'

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse()
  if (event.httpMethod !== 'GET') return badRequest('Method not allowed')

  try {
    const code = (event.queryStringParameters?.code || '').trim().toUpperCase()
    if (!code) return badRequest('missing_code')

    const sql = getDb()
    const rows = await sql`
      SELECT id, name, code, event_date, cover_url, theme, access_mode, created_at
      FROM events
      WHERE code = ${code}
      LIMIT 1
    `
    if (rows.length === 0) return unauthorized('not_found')

    const e = rows[0]
    if (e.access_mode === 'hidden') {
      return unauthorized('hidden')
    }

    const albums = await sql`
      SELECT id, name, sort_order
      FROM albums
      WHERE event_id = ${e.id}
      ORDER BY sort_order ASC, created_at ASC
    `

    return ok({
      event: {
        id: e.id,
        name: e.name,
        code: e.code,
        eventDate: e.event_date,
        coverUrl: e.cover_url,
        theme: e.theme,
        accessMode: e.access_mode,
        createdAt: e.created_at,
      },
      albums: albums.map((a) => ({
        id: a.id,
        name: a.name,
        sortOrder: a.sort_order,
      })),
    })
  } catch (error) {
    console.error('events-by-code', error)
    return serverError()
  }
}
