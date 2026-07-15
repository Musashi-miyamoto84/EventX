import type { Handler } from '@netlify/functions'
import { UPLOAD_TECH } from './_shared/media-limits'
import { saveUploadChunk } from './_shared/media-store'
import {
  badRequest,
  json,
  ok,
  optionsResponse,
} from './_shared/http'

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse()
  if (event.httpMethod !== 'POST') return badRequest('Method not allowed')

  try {
    const uploadId = event.headers['x-upload-id'] || event.headers['X-Upload-Id']
    const chunkIndex = Number(
      event.headers['x-chunk-index'] ?? event.headers['X-Chunk-Index'],
    )

    if (!uploadId || Number.isNaN(chunkIndex) || chunkIndex < 0) {
      return badRequest('missing_chunk_meta')
    }

    const raw = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64')
      : Buffer.from(event.body || '', event.body ? undefined : 'utf8')

    if (!raw.byteLength) return badRequest('empty_chunk')
    // Технічна перевірка частини (не ліміт файлу користувача)
    if (raw.byteLength > UPLOAD_TECH.chunkSize + 1024) {
      return badRequest('chunk_too_large')
    }

    await saveUploadChunk(event, uploadId, chunkIndex, raw)
    return ok({ received: chunkIndex })
  } catch (error) {
    console.error('media-upload-chunk', error)
    const message = error instanceof Error ? error.message : 'unknown'
    return json(500, { error: 'generic', detail: message })
  }
}
