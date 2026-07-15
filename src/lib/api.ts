import { getToken } from './auth'
import { compressImageIfNeeded } from './image-compress'
import { UPLOAD_TECH } from './media-limits'
import type { AccessMode, AlbumItem, EventItem, MediaItem } from './types'

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (data.detail) console.error('API error detail:', data.detail)
    throw new Error(data.error || 'generic')
  }
  return data as T
}

async function api<T>(
  path: string,
  options: RequestInit = {},
  auth = false,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }

  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`/.netlify/functions/${path}`, {
    ...options,
    headers,
  })

  return parseResponse<T>(response)
}

export async function listEvents() {
  return api<{ events: EventItem[] }>('events-list', { method: 'GET' }, true)
}

export async function createEvent(input: {
  name: string
  eventDate?: string | null
  theme?: string
}) {
  return api<{ event: EventItem }>(
    'events-create',
    { method: 'POST', body: JSON.stringify(input) },
    true,
  )
}

export async function getEvent(id: string) {
  return api<{ event: EventItem; albums: AlbumItem[] }>(
    `events-get?id=${encodeURIComponent(id)}`,
    { method: 'GET' },
    true,
  )
}

export async function getEventByCode(code: string) {
  return api<{ event: EventItem; albums: AlbumItem[] }>(
    `events-by-code?code=${encodeURIComponent(code)}`,
    { method: 'GET' },
  )
}

export async function updateEvent(input: {
  id: string
  name?: string
  eventDate?: string | null
}) {
  return api<{ success: boolean; event: EventItem }>(
    'events-update',
    { method: 'PATCH', body: JSON.stringify(input) },
    true,
  )
}

export async function deleteEvent(id: string) {
  return api<{ success: boolean }>(
    `events-delete?id=${encodeURIComponent(id)}`,
    { method: 'DELETE' },
    true,
  )
}

export async function createAlbum(eventId: string, name: string) {
  return api<{ album: AlbumItem }>(
    'albums-create',
    { method: 'POST', body: JSON.stringify({ eventId, name }) },
    true,
  )
}

export async function deleteAlbum(id: string) {
  return api<{ success: boolean }>(
    `albums-delete?id=${encodeURIComponent(id)}`,
    { method: 'DELETE' },
    true,
  )
}

export async function listMedia(params: {
  eventId?: string
  code?: string
  albumId?: string
}) {
  const q = new URLSearchParams()
  if (params.eventId) q.set('eventId', params.eventId)
  if (params.code) q.set('code', params.code)
  if (params.albumId) q.set('albumId', params.albumId)

  return api<{ media: MediaItem[]; accessMode: AccessMode }>(
    `media-list?${q.toString()}`,
    { method: 'GET' },
    Boolean(params.eventId),
  )
}

function uploadHeaders(
  file: File,
  input: { eventId?: string; eventCode?: string; albumId?: string | null },
  auth: boolean,
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/octet-stream',
    'X-File-Name': encodeURIComponent(file.name),
    'X-Mime-Type': file.type || 'application/octet-stream',
    'X-Album-Id': input.albumId ?? 'null',
  }
  if (input.eventId) headers['X-Event-Id'] = input.eventId
  if (input.eventCode) headers['X-Event-Code'] = input.eventCode
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }
  return headers
}

async function uploadDirect(
  file: File,
  input: { eventId?: string; eventCode?: string; albumId?: string | null },
  auth: boolean,
) {
  const response = await fetch('/.netlify/functions/media-upload', {
    method: 'POST',
    headers: uploadHeaders(file, input, auth),
    body: file,
  })
  return parseResponse<{ media: MediaItem }>(response)
}

async function uploadChunked(
  file: File,
  input: { eventId?: string; eventCode?: string; albumId?: string | null },
  auth: boolean,
) {
  const chunkSize = UPLOAD_TECH.chunkSize
  const totalChunks = Math.ceil(file.size / chunkSize)

  const init = await api<{ uploadId: string; chunkSize: number }>(
    'media-upload-init',
    {
      method: 'POST',
      body: JSON.stringify({
        eventId: input.eventId,
        eventCode: input.eventCode,
        albumId: input.albumId ?? null,
        fileName: file.name,
        mimeType: file.type,
        totalSize: file.size,
        totalChunks,
      }),
    },
    auth,
  )

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize
    const chunk = file.slice(start, Math.min(start + chunkSize, file.size))
    const response = await fetch('/.netlify/functions/media-upload-chunk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Upload-Id': init.uploadId,
        'X-Chunk-Index': String(i),
      },
      body: chunk,
    })
    await parseResponse<{ received: number }>(response)
  }

  return api<{ media: MediaItem }>(
    'media-upload-complete',
    { method: 'POST', body: JSON.stringify({ uploadId: init.uploadId }) },
    auth,
  )
}

export async function uploadMedia(input: {
  file: File
  eventId?: string
  eventCode?: string
  albumId?: string | null
}) {
  if (!input.file.type.startsWith('image/') && !input.file.type.startsWith('video/')) {
    throw new Error('invalid_type')
  }
  if (input.file.size === 0) throw new Error('empty_file')

  const prepared = await compressImageIfNeeded(input.file)
  const auth = Boolean(input.eventId)

  if (prepared.size <= UPLOAD_TECH.directUploadMax) {
    return uploadDirect(prepared, input, auth)
  }
  return uploadChunked(prepared, input, auth)
}

export async function deleteMedia(id: string) {
  return api<{ success: boolean }>(
    `media-delete?id=${encodeURIComponent(id)}`,
    { method: 'DELETE' },
    true,
  )
}
