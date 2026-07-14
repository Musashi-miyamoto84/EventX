import type { Handler } from '@netlify/functions'
import { getDb } from './_shared/db'
import { requireUser } from './_shared/events'
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
    const { userId } = await requireUser(event)
    const id = event.queryStringParameters?.id
    if (!id) return badRequest('missing_id')

    const sql = getDb()
    const rows = await sql`
      SELECT id, name, code, event_date, cover_url, theme, access_mode, created_at, owner_id
      FROM events
      WHERE id = ${id} AND owner_id = ${userId}
      LIMIT 1
    `
    if (rows.length === 0) return unauthorized('not_found')

    const e = rows[0]
    const albums = await sql`
      SELECT id, name, sort_order, created_at
      FROM albums
      WHERE event_id = ${id}
      ORDER BY sort_order ASC, created_at ASC
    `

    const mediaCount = await sql`
      SELECT COUNT(*)::int AS cnt FROM media WHERE event_id = ${id}
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
        mediaCount: mediaCount[0]?.cnt ?? 0,
      },
      albums: albums.map((a) => ({
        id: a.id,
        name: a.name,
        sortOrder: a.sort_order,
        createdAt: a.created_at,
      })),
    })
  } catch (error) {
    if ((error as { status?: number }).status === 401) return unauthorized()
    console.error('events-get', error)
    return serverError()
  }
}
