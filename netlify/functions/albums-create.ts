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
  if (event.httpMethod !== 'POST') return badRequest('Method not allowed')

  try {
    const { userId } = await requireUser(event)
    const body = JSON.parse(event.body || '{}') as {
      eventId?: string
      name?: string
    }

    const name = (body.name || '').trim()
    if (!body.eventId || !name) return badRequest('invalid')

    const sql = getDb()
    const owned = await sql`
      SELECT id FROM events WHERE id = ${body.eventId} AND owner_id = ${userId} LIMIT 1
    `
    if (owned.length === 0) return unauthorized('not_found')

    const maxOrder = await sql`
      SELECT COALESCE(MAX(sort_order), -1)::int AS m FROM albums WHERE event_id = ${body.eventId}
    `
    const sortOrder = (maxOrder[0]?.m ?? -1) + 1

    const rows = await sql`
      INSERT INTO albums (event_id, name, sort_order)
      VALUES (${body.eventId}, ${name}, ${sortOrder})
      RETURNING id, name, sort_order, created_at
    `

    const a = rows[0]
    return ok({
      album: {
        id: a.id,
        name: a.name,
        sortOrder: a.sort_order,
        createdAt: a.created_at,
      },
    })
  } catch (error) {
    if ((error as { status?: number }).status === 401) return unauthorized()
    console.error('albums-create', error)
    return serverError()
  }
}
