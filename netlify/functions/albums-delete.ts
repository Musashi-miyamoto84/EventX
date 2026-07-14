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
  if (event.httpMethod !== 'DELETE') return badRequest('Method not allowed')

  try {
    const { userId } = await requireUser(event)
    const id = event.queryStringParameters?.id
    if (!id) return badRequest('missing_id')

    const sql = getDb()
    const rows = await sql`
      SELECT a.id
      FROM albums a
      JOIN events e ON e.id = a.event_id
      WHERE a.id = ${id} AND e.owner_id = ${userId}
      LIMIT 1
    `
    if (rows.length === 0) return unauthorized('not_found')

    await sql`UPDATE media SET album_id = NULL WHERE album_id = ${id}`
    await sql`DELETE FROM albums WHERE id = ${id}`

    return ok({ success: true })
  } catch (error) {
    if ((error as { status?: number }).status === 401) return unauthorized()
    console.error('albums-delete', error)
    return serverError()
  }
}
