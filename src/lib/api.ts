import { getToken } from './auth'
import type { AccessMode, AlbumItem, EventItem, MediaItem } from './types'

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

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (data.detail) console.error('API error detail:', data.detail)
    throw new Error(data.error || 'generic')
  }
  return data as T
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
  accessMode?: AccessMode
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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || '')
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('read_failed'))
    reader.readAsDataURL(file)
  })
}

export async function uploadMedia(input: {
  file: File
  eventId?: string
  eventCode?: string
  albumId?: string | null
}) {
  const dataBase64 = await fileToBase64(input.file)
  return api<{ media: MediaItem }>(
    'media-upload',
    {
      method: 'POST',
      body: JSON.stringify({
        eventId: input.eventId,
        eventCode: input.eventCode,
        albumId: input.albumId ?? null,
        fileName: input.file.name,
        mimeType: input.file.type,
        dataBase64,
      }),
    },
    Boolean(input.eventId),
  )
}

export async function deleteMedia(id: string) {
  return api<{ success: boolean }>(
    `media-delete?id=${encodeURIComponent(id)}`,
    { method: 'DELETE' },
    true,
  )
}
