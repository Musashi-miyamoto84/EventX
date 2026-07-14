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
    const sql = getDb()
    const rows = await sql`
      SELECT
        e.id,
        e.name,
        e.code,
        e.event_date,
        e.cover_url,
        e.theme,
        e.access_mode,
        e.created_at,
        COALESCE(m.cnt, 0)::int AS media_count
      FROM events e
      LEFT JOIN (
        SELECT event_id, COUNT(*)::int AS cnt FROM media GROUP BY event_id
      ) m ON m.event_id = e.id
      WHERE e.owner_id = ${userId}
      ORDER BY e.created_at DESC
    `

    return ok({
      events: rows.map((row) => ({
        id: row.id,
        name: row.name,
        code: row.code,
        eventDate: row.event_date,
        coverUrl: row.cover_url,
        theme: row.theme,
        accessMode: row.access_mode,
        createdAt: row.created_at,
        mediaCount: row.media_count,
      })),
    })
  } catch (error) {
    if ((error as { status?: number }).status === 401) return unauthorized()
    console.error('events-list', error)
    return serverError()
  }
}
