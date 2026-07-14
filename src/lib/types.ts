export type AccessMode = 'view' | 'download' | 'hidden'

export interface EventItem {
  id: string
  name: string
  code: string
  eventDate: string | null
  coverUrl: string | null
  theme: string
  accessMode: AccessMode
  createdAt: string
  mediaCount?: number
}

export interface AlbumItem {
  id: string
  name: string
  sortOrder: number
  createdAt?: string
}

export interface MediaItem {
  id: string
  eventId: string
  albumId: string | null
  fileName: string
  mimeType: string
  sizeBytes: number
  uploadedBy: 'organizer' | 'guest'
  createdAt: string
  url: string
  isVideo?: boolean
}
