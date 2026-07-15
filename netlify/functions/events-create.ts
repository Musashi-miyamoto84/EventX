import type { Handler } from '@netlify/functions'
import { getDb } from './_shared/db'
import { generateEventCode, requireUser } from './_shared/events'
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
      name?: string
      eventDate?: string | null
      theme?: string
    }

    const name = (body.name || '').trim()
    if (!name || name.length > 80) {
      return badRequest('invalid_name')
    }

    const theme = body.theme || 'champagne'
    const eventDate = body.eventDate || null
    const sql = getDb()

    let code = generateEventCode()
    for (let i = 0; i < 8; i++) {
      const existing = await sql`SELECT id FROM events WHERE code = ${code} LIMIT 1`
      if (existing.length === 0) break
      code = generateEventCode()
    }

    const rows = await sql`
      INSERT INTO events (owner_id, name, code, event_date, theme, access_mode)
      VALUES (${userId}, ${name}, ${code}, ${eventDate}, ${theme}, 'download')
      RETURNING id, name, code, event_date, cover_url, theme, access_mode, created_at
    `

    const created = rows[0]

    return ok({
      event: {
        id: created.id,
        name: created.name,
        code: created.code,
        eventDate: created.event_date,
        coverUrl: created.cover_url,
        theme: created.theme,
        accessMode: created.access_mode,
        createdAt: created.created_at,
        mediaCount: 0,
      },
    })
  } catch (error) {
    if ((error as { status?: number }).status === 401) return unauthorized()
    console.error('events-create', error)
    return serverError()
  }
}
