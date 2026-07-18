import type { Handler } from '@netlify/functions'
import { randomUUID } from 'node:crypto'
import { getDb } from './_shared/db'
import {
  mediaRowToJson,
  resolveAlbumId,
  resolveUploadTarget,
  UPLOAD_TECH,
} from './_shared/media-limits'
import { saveMediaFile } from './_shared/media-store'
import {
  badRequest,
  json,
  ok,
  optionsResponse,
  unauthorized,
} from './_shared/http'

function readBinaryBody(event: { body?: string | null; isBase64Encoded?: boolean }) {
  if (!event.body) return Buffer.alloc(0)
  return event.isBase64Encoded
    ? Buffer.from(event.body, 'base64')
    : Buffer.from(event.body, 'binary')
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse()
  if (event.httpMethod !== 'POST') return badRequest('Method not allowed')

  try {
    const contentType = event.headers['content-type'] || event.headers['Content-Type'] || ''
    const isBinary = contentType.includes('application/octet-stream')

    let fileName: string
    let mimeType: string
    let buffer: Buffer
    let eventId = ''
    let eventCode = ''
    let albumId: string | null = null

    if (isBinary) {
      fileName = decodeURIComponent(
        event.headers['x-file-name'] || event.headers['X-File-Name'] || 'file',
      )
      mimeType =
        event.headers['x-mime-type'] || event.headers['X-Mime-Type'] || 'application/octet-stream'
      eventId = event.headers['x-event-id'] || event.headers['X-Event-Id'] || ''
      eventCode = event.headers['x-event-code'] || event.headers['X-Event-Code'] || ''
      const rawAlbum = event.headers['x-album-id'] || event.headers['X-Album-Id'] || ''
      albumId = rawAlbum && rawAlbum !== 'null' ? rawAlbum : null
      buffer = readBinaryBody(event)
    } else {
      const body = JSON.parse(event.body || '{}') as {
        eventId?: string
        eventCode?: string
        albumId?: string | null
        fileName?: string
        mimeType?: string
        dataBase64?: string
      }

      fileName = (body.fileName || 'file').trim()
      mimeType = body.mimeType || 'application/octet-stream'
      eventId = body.eventId || ''
      eventCode = body.eventCode || ''
      albumId = body.albumId ?? null
      const dataBase64 = body.dataBase64 || ''
      if (!dataBase64 || !fileName) return badRequest('missing_file')
      buffer = Buffer.from(dataBase64, 'base64')
    }

    if (!buffer.byteLength) return badRequest('empty_file')
    if (!mimeType.startsWith('image/') && !mimeType.startsWith('video/')) {
      return badRequest('invalid_type')
    }
    // Великі файли йдуть через chunked upload — це не «ліміт організатора»
    if (buffer.byteLength > UPLOAD_TECH.directUploadMax) {
      return badRequest('use_chunked_upload')
    }

    const { eventId: resolvedEventId, uploadedBy } = await resolveUploadTarget(event, {
      eventId,
      eventCode,
    })

    const resolvedAlbumId = await resolveAlbumId(resolvedEventId, albumId)

    const mediaId = randomUUID()
    const storageKey = `events/${resolvedEventId}/${mediaId}`

    const sql = getDb()
    const eventNameRows = await sql`
      SELECT name FROM events WHERE id = ${resolvedEventId} LIMIT 1
    `
    const eventName = (eventNameRows[0]?.name as string | undefined) ?? undefined

    await saveMediaFile(event, storageKey, buffer, {
      mimeType,
      fileName,
      eventId: resolvedEventId,
      eventName,
    })

    const rows = await sql`
      INSERT INTO media (id, event_id, album_id, storage_key, file_name, mime_type, size_bytes, uploaded_by)
      VALUES (
        ${mediaId},
        ${resolvedEventId},
        ${resolvedAlbumId},
        ${storageKey},
        ${fileName},
        ${mimeType},
        ${buffer.byteLength},
        ${uploadedBy}
      )
      RETURNING id, event_id, album_id, file_name, mime_type, size_bytes, uploaded_by, created_at
    `

    return ok({ media: mediaRowToJson(rows[0]) })
  } catch (error) {
    if ((error as { status?: number }).status === 401) {
      const msg = error instanceof Error ? error.message : 'Unauthorized'
      return unauthorized(msg)
    }
    console.error('media-upload', error)
    const message = error instanceof Error ? error.message : 'unknown'
    if (message.includes('relation') && message.includes('does not exist')) {
      return json(500, {
        error: 'db_schema_missing',
        detail: 'Виконай sql/migration_events.sql у Neon SQL Editor',
      })
    }
    return json(500, { error: 'generic', detail: message })
  }
}
