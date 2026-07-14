import type { Handler } from '@netlify/functions'
import { getDb } from './_shared/db'
import { requireUser } from './_shared/events'
import { deleteMediaFile } from './_shared/media-store'
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
      SELECT m.id, m.storage_key
      FROM media m
      JOIN events e ON e.id = m.event_id
      WHERE m.id = ${id} AND e.owner_id = ${userId}
      LIMIT 1
    `
    if (rows.length === 0) return unauthorized('not_found')

    await deleteMediaFile(event, rows[0].storage_key as string)
    await sql`DELETE FROM media WHERE id = ${id}`

    return ok({ success: true })
  } catch (error) {
    if ((error as { status?: number }).status === 401) return unauthorized()
    console.error('media-delete', error)
    return serverError()
  }
}
