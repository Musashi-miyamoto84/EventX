import type { Handler } from '@netlify/functions'
import { randomUUID } from 'node:crypto'
import { getDb } from './_shared/db'
import { verifyToken } from './_shared/crypto'
import { getBearerToken } from './_shared/http'
import { mediaRowToJson } from './_shared/media-limits'
import { mergePendingUpload, readPendingMeta } from './_shared/media-store'
import {
  badRequest,
  json,
  ok,
  optionsResponse,
  unauthorized,
} from './_shared/http'

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse()
  if (event.httpMethod !== 'POST') return badRequest('Method not allowed')

  try {
    const body = JSON.parse(event.body || '{}') as { uploadId?: string }
    const uploadId = body.uploadId?.trim()
    if (!uploadId) return badRequest('missing_upload_id')

    const pending = await readPendingMeta(event, uploadId)
    if (!pending) return badRequest('pending_not_found')

    const sql = getDb()

    if (pending.uploadedBy === 'organizer') {
      const token = getBearerToken(
        event.headers.authorization || event.headers.Authorization,
      )
      if (!token) return unauthorized()
      const { userId } = await verifyToken(token)
      const owned = await sql`
        SELECT id FROM events
        WHERE id = ${pending.eventId} AND owner_id = ${userId}
        LIMIT 1
      `
      if (owned.length === 0) return unauthorized('not_found')
    }

    const mediaId = randomUUID()
    const storageKey = `events/${pending.eventId}/${mediaId}`

    const sizeBytes = await mergePendingUpload(event, uploadId, storageKey, {
      mimeType: pending.mimeType,
      fileName: pending.fileName,
    })

    const rows = await sql`
      INSERT INTO media (id, event_id, album_id, storage_key, file_name, mime_type, size_bytes, uploaded_by)
      VALUES (
        ${mediaId},
        ${pending.eventId},
        ${pending.albumId},
        ${storageKey},
        ${pending.fileName},
        ${pending.mimeType},
        ${sizeBytes},
        ${pending.uploadedBy}
      )
      RETURNING id, event_id, album_id, file_name, mime_type, size_bytes, uploaded_by, created_at
    `

    return ok({ media: mediaRowToJson(rows[0]) })
  } catch (error) {
    console.error('media-upload-complete', error)
    const message = error instanceof Error ? error.message : 'unknown'
    return json(500, { error: 'generic', detail: message })
  }
}
