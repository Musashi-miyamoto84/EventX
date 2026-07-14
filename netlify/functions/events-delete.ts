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
    const owned = await sql`
      SELECT id FROM events WHERE id = ${id} AND owner_id = ${userId} LIMIT 1
    `
    if (owned.length === 0) return unauthorized('not_found')

    // media + albums cascade via FK ON DELETE CASCADE
    await sql`DELETE FROM events WHERE id = ${id}`

    return ok({ success: true })
  } catch (error) {
    if ((error as { status?: number }).status === 401) return unauthorized()
    console.error('events-delete', error)
    return serverError()
  }
}
