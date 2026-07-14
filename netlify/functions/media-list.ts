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
    const sql = getDb()
    const eventId = event.queryStringParameters?.eventId
    const code = (event.queryStringParameters?.code || '').trim().toUpperCase()
    const albumId = event.queryStringParameters?.albumId

    let resolvedEventId = eventId || ''
    let accessMode = 'download'

    if (code) {
      const rows = await sql`
        SELECT id, access_mode FROM events WHERE code = ${code} LIMIT 1
      `
      if (rows.length === 0) return unauthorized('not_found')
      if (rows[0].access_mode === 'hidden') return unauthorized('hidden')
      resolvedEventId = rows[0].id as string
      accessMode = rows[0].access_mode as string
    } else if (eventId) {
      const { userId } = await requireUser(event)
      const rows = await sql`
        SELECT id, access_mode FROM events
        WHERE id = ${eventId} AND owner_id = ${userId}
        LIMIT 1
      `
      if (rows.length === 0) return unauthorized('not_found')
      resolvedEventId = rows[0].id as string
      accessMode = rows[0].access_mode as string
    } else {
      return badRequest('missing_event')
    }

    const rows = albumId
      ? await sql`
          SELECT id, event_id, album_id, file_name, mime_type, size_bytes, uploaded_by, created_at
          FROM media
          WHERE event_id = ${resolvedEventId} AND album_id = ${albumId}
          ORDER BY created_at DESC
        `
      : await sql`
          SELECT id, event_id, album_id, file_name, mime_type, size_bytes, uploaded_by, created_at
          FROM media
          WHERE event_id = ${resolvedEventId}
          ORDER BY created_at DESC
        `

    return ok({
      accessMode,
      media: rows.map((m) => ({
        id: m.id,
        eventId: m.event_id,
        albumId: m.album_id,
        fileName: m.file_name,
        mimeType: m.mime_type,
        sizeBytes: m.size_bytes,
        uploadedBy: m.uploaded_by,
        createdAt: m.created_at,
        url: `/.netlify/functions/media-file?id=${m.id}`,
        isVideo: String(m.mime_type).startsWith('video/'),
      })),
    })
  } catch (error) {
    if ((error as { status?: number }).status === 401) return unauthorized()
    console.error('media-list', error)
    return serverError()
  }
}
