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
  if (event.httpMethod !== 'PATCH') return badRequest('Method not allowed')

  try {
    const { userId } = await requireUser(event)
    const body = JSON.parse(event.body || '{}') as {
      id?: string
      name?: string
      eventDate?: string | null
    }

    if (!body.id) return badRequest('missing_id')

    const sql = getDb()
    const owned = await sql`
      SELECT id FROM events WHERE id = ${body.id} AND owner_id = ${userId} LIMIT 1
    `
    if (owned.length === 0) return unauthorized('not_found')

    if (typeof body.name === 'string' && body.name.trim()) {
      await sql`
        UPDATE events SET name = ${body.name.trim()} WHERE id = ${body.id}
      `
    }
    if (body.eventDate !== undefined) {
      const dateValue = body.eventDate?.trim() ? body.eventDate.trim() : null
      await sql`
        UPDATE events SET event_date = ${dateValue} WHERE id = ${body.id}
      `
    }

    const rows = await sql`
      SELECT id, name, code, event_date, cover_url, theme, access_mode, created_at
      FROM events WHERE id = ${body.id} LIMIT 1
    `
    const e = rows[0]

    return ok({
      success: true,
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
    })
  } catch (error) {
    if ((error as { status?: number }).status === 401) return unauthorized()
    console.error('events-update', error)
    return serverError()
  }
}
