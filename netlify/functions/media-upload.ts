import type { Handler } from '@netlify/functions'
import { randomUUID } from 'node:crypto'
import { getDb } from './_shared/db'
import { verifyToken } from './_shared/crypto'
import { getBearerToken } from './_shared/http'
import { saveMediaFile } from './_shared/media-store'
import {
  badRequest,
  json,
  ok,
  optionsResponse,
  serverError,
  unauthorized,
} from './_shared/http'

const MAX_BYTES = 4.5 * 1024 * 1024

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse()
  if (event.httpMethod !== 'POST') return badRequest('Method not allowed')

  try {
    const body = JSON.parse(event.body || '{}') as {
      eventId?: string
      eventCode?: string
      albumId?: string | null
      fileName?: string
      mimeType?: string
      dataBase64?: string
    }

    const fileName = (body.fileName || 'file').trim()
    const mimeType = body.mimeType || 'application/octet-stream'
    const dataBase64 = body.dataBase64 || ''

    if (!dataBase64 || !fileName) return badRequest('missing_file')
    if (!mimeType.startsWith('image/') && !mimeType.startsWith('video/')) {
      return badRequest('invalid_type')
    }

    const buffer = Buffer.from(dataBase64, 'base64')
    if (buffer.byteLength === 0) return badRequest('empty_file')
    if (buffer.byteLength > MAX_BYTES) return badRequest('file_too_large')

    const sql = getDb()
    let eventId = body.eventId || ''
    let uploadedBy: 'organizer' | 'guest' = 'guest'

    const token = getBearerToken(
      event.headers.authorization || event.headers.Authorization,
    )

    if (token && eventId) {
      try {
        const { userId } = await verifyToken(token)
        const owned = await sql`
          SELECT id FROM events WHERE id = ${eventId} AND owner_id = ${userId} LIMIT 1
        `
        if (owned.length === 0) return unauthorized('not_found')
        uploadedBy = 'organizer'
      } catch (error) {
        console.error('media-upload auth', error)
        return unauthorized('invalid_token')
      }
    } else {
      const code = (body.eventCode || '').trim().toUpperCase()
      if (!code) return unauthorized('missing_code')
      const rows = await sql`
        SELECT id, access_mode FROM events WHERE code = ${code} LIMIT 1
      `
      if (rows.length === 0) return unauthorized('not_found')
      if (rows[0].access_mode === 'hidden') return unauthorized('hidden')
      eventId = rows[0].id as string
      uploadedBy = 'guest'
    }

    let albumId = body.albumId || null
    if (albumId) {
      const album = await sql`
        SELECT id FROM albums WHERE id = ${albumId} AND event_id = ${eventId} LIMIT 1
      `
      if (album.length === 0) albumId = null
    }

    const mediaId = randomUUID()
    const storageKey = `events/${eventId}/${mediaId}`

    await saveMediaFile(event, storageKey, buffer, { mimeType, fileName })

    const rows = await sql`
      INSERT INTO media (id, event_id, album_id, storage_key, file_name, mime_type, size_bytes, uploaded_by)
      VALUES (
        ${mediaId},
        ${eventId},
        ${albumId},
        ${storageKey},
        ${fileName},
        ${mimeType},
        ${buffer.byteLength},
        ${uploadedBy}
      )
      RETURNING id, event_id, album_id, file_name, mime_type, size_bytes, uploaded_by, created_at
    `

    const m = rows[0]
    return ok({
      media: {
        id: m.id,
        eventId: m.event_id,
        albumId: m.album_id,
        fileName: m.file_name,
        mimeType: m.mime_type,
        sizeBytes: m.size_bytes,
        uploadedBy: m.uploaded_by,
        createdAt: m.created_at,
        url: `/.netlify/functions/media-file?id=${m.id}`,
      },
    })
  } catch (error) {
    if ((error as { status?: number }).status === 401) return unauthorized()
    console.error('media-upload', error)
    const message = error instanceof Error ? error.message : 'unknown'
    // Surface DB/migration hints during local debugging
    if (message.includes('relation') && message.includes('does not exist')) {
      return json(500, {
        error: 'db_schema_missing',
        detail: 'Виконай sql/migration_events.sql у Neon SQL Editor',
      })
    }
    return json(500, { error: 'generic', detail: message })
  }
}
