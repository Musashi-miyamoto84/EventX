import type { HandlerEvent } from '@netlify/functions'
import { getDb } from './db'
import { verifyToken } from './crypto'
import { getBearerToken } from './http'

/** Лише технічні константи для chunked upload (ліміт тіла Netlify Functions ~6 МБ). */
export const UPLOAD_TECH = {
  chunkSize: 3 * 1024 * 1024,
  directUploadMax: 4 * 1024 * 1024,
} as const

export function isVideoMime(mime: string) {
  return mime.startsWith('video/')
}

export interface ResolvedUploadTarget {
  eventId: string
  uploadedBy: 'organizer' | 'guest'
}

export async function resolveUploadTarget(
  event: HandlerEvent,
  input: { eventId?: string; eventCode?: string },
): Promise<ResolvedUploadTarget> {
  const sql = getDb()
  const token = getBearerToken(event.headers.authorization || event.headers.Authorization)

  if (token && input.eventId) {
    try {
      const { userId } = await verifyToken(token)
      const owned = await sql`
        SELECT id FROM events WHERE id = ${input.eventId} AND owner_id = ${userId} LIMIT 1
      `
      if (owned.length === 0) {
        throw Object.assign(new Error('not_found'), { status: 401 })
      }
      return { eventId: input.eventId, uploadedBy: 'organizer' as const }
    } catch (error) {
      if ((error as { status?: number }).status === 401) throw error
      throw Object.assign(new Error('invalid_token'), { status: 401 })
    }
  }

  const code = (input.eventCode || '').trim().toUpperCase()
  if (!code) throw Object.assign(new Error('missing_code'), { status: 401 })

  const rows = await sql`
    SELECT id, access_mode FROM events WHERE code = ${code} LIMIT 1
  `
  if (rows.length === 0) throw Object.assign(new Error('not_found'), { status: 401 })
  if (rows[0].access_mode === 'hidden') {
    throw Object.assign(new Error('hidden'), { status: 401 })
  }

  return { eventId: rows[0].id as string, uploadedBy: 'guest' as const }
}

export async function resolveAlbumId(
  eventId: string,
  albumId: string | null | undefined,
): Promise<string | null> {
  if (!albumId) return null
  const sql = getDb()
  const album = await sql`
    SELECT id FROM albums WHERE id = ${albumId} AND event_id = ${eventId} LIMIT 1
  `
  return album.length === 0 ? null : albumId
}

export function mediaRowToJson(m: Record<string, unknown>) {
  return {
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
  }
}
