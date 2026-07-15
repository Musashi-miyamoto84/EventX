import type { Handler } from '@netlify/functions'
import { randomUUID } from 'node:crypto'
import {
  resolveAlbumId,
  resolveUploadTarget,
  UPLOAD_TECH,
} from './_shared/media-limits'
import { savePendingMeta } from './_shared/media-store'
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
    const body = JSON.parse(event.body || '{}') as {
      eventId?: string
      eventCode?: string
      albumId?: string | null
      fileName?: string
      mimeType?: string
      totalSize?: number
      totalChunks?: number
    }

    const fileName = (body.fileName || 'file').trim()
    const mimeType = body.mimeType || 'application/octet-stream'
    const totalSize = Number(body.totalSize || 0)
    const totalChunks = Number(body.totalChunks || 0)

    if (!fileName || !totalSize || !totalChunks) return badRequest('missing_file')
    if (!mimeType.startsWith('image/') && !mimeType.startsWith('video/')) {
      return badRequest('invalid_type')
    }
    if (totalChunks < 1 || totalChunks > 500) return badRequest('invalid_chunks')

    const { eventId, uploadedBy } = await resolveUploadTarget(event, {
      eventId: body.eventId,
      eventCode: body.eventCode,
    })

    const albumId = await resolveAlbumId(eventId, body.albumId)

    const uploadId = randomUUID()
    await savePendingMeta(event, uploadId, {
      eventId,
      fileName,
      mimeType,
      totalSize,
      totalChunks,
      albumId,
      uploadedBy,
      createdAt: new Date().toISOString(),
    })

    return ok({
      uploadId,
      chunkSize: UPLOAD_TECH.chunkSize,
    })
  } catch (error) {
    if ((error as { status?: number }).status === 401) {
      const msg = error instanceof Error ? error.message : 'Unauthorized'
      return unauthorized(msg)
    }
    console.error('media-upload-init', error)
    const message = error instanceof Error ? error.message : 'unknown'
    return json(500, { error: 'generic', detail: message })
  }
}
