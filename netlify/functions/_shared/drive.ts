import { Readable } from 'node:stream'
import { google } from 'googleapis'
import type { drive_v3 } from 'googleapis'

/**
 * Optional secondary storage: Google Drive (organizer's account via OAuth).
 *
 * All operations are best-effort and MUST never break the primary Netlify Blobs
 * flow. If Drive is not configured everything is a silent no-op, so existing
 * behaviour is fully preserved.
 *
 * Configuration (Netlify env vars, or local .env):
 *   GOOGLE_CLIENT_ID       – OAuth client id.
 *   GOOGLE_CLIENT_SECRET   – OAuth client secret.
 *   GOOGLE_REFRESH_TOKEN   – refresh token for the organizer account.
 *   GOOGLE_DRIVE_FOLDER_ID – optional target folder (defaults to Drive root).
 */

let cachedDrive: drive_v3.Drive | null | undefined
let warnedMissing = false
// eventId -> Drive folder id (persists across warm Lambda invocations).
const folderCache = new Map<string, string>()

function getDrive(): drive_v3.Drive | null {
  if (cachedDrive !== undefined) return cachedDrive

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim()
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim()
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN?.trim()

  if (!clientId || !clientSecret || !refreshToken) {
    if (!warnedMissing) {
      console.info('Drive: secondary storage disabled (missing OAuth credentials)')
      warnedMissing = true
    }
    cachedDrive = null
    return cachedDrive
  }

  try {
    const auth = new google.auth.OAuth2(clientId, clientSecret)
    auth.setCredentials({ refresh_token: refreshToken })
    cachedDrive = google.drive({ version: 'v3', auth })
  } catch (error) {
    console.warn('Drive: failed to initialise client', error)
    cachedDrive = null
  }
  return cachedDrive
}

function folderId(): string | undefined {
  return process.env.GOOGLE_DRIVE_FOLDER_ID?.trim() || undefined
}

export function isDriveConfigured(): boolean {
  return getDrive() !== null
}

/**
 * Resolve (find or create) a per-event folder in Drive, named after the event.
 * Matched by appProperties.eventId so renaming the event on the site never
 * creates duplicates. Falls back to the configured parent folder / root.
 */
async function resolveEventFolder(
  drive: drive_v3.Drive,
  eventId: string | undefined,
  eventName: string | undefined,
): Promise<string | undefined> {
  const parent = folderId()
  if (!eventId) return parent

  const cached = folderCache.get(eventId)
  if (cached) return cached

  const safeEventId = eventId.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  const qParts = [
    "mimeType='application/vnd.google-apps.folder'",
    `appProperties has { key='eventId' and value='${safeEventId}' }`,
    'trashed=false',
  ]
  if (parent) qParts.push(`'${parent.replace(/'/g, "\\'")}' in parents`)

  let id: string | undefined
  try {
    const list = await drive.files.list({
      q: qParts.join(' and '),
      fields: 'files(id)',
      spaces: 'drive',
      pageSize: 1,
    })
    id = list.data.files?.[0]?.id ?? undefined

    if (!id) {
      const created = await drive.files.create({
        requestBody: {
          name: (eventName || '').trim() || `event-${eventId}`,
          mimeType: 'application/vnd.google-apps.folder',
          parents: parent ? [parent] : undefined,
          appProperties: { eventId },
        },
        fields: 'id',
      })
      id = created.data.id ?? undefined
    }
  } catch (error) {
    console.warn(`Drive: failed to resolve folder for event ${eventId}`, error)
    return parent
  }

  if (id) folderCache.set(eventId, id)
  return id ?? parent
}

/** Best-effort mirror upload. Never throws. */
export async function uploadToDrive(
  key: string,
  buffer: Buffer,
  metadata: { mimeType: string; fileName: string; eventId?: string; eventName?: string },
): Promise<boolean> {
  const drive = getDrive()
  if (!drive) return false

  try {
    const parent = await resolveEventFolder(drive, metadata.eventId, metadata.eventName)
    await drive.files.create({
      requestBody: {
        name: metadata.fileName || key.split('/').pop() || key,
        parents: parent ? [parent] : undefined,
        // Lets us find/delete this file later even with the drive.file scope.
        appProperties: { mediaKey: key },
      },
      media: {
        mimeType: metadata.mimeType,
        body: Readable.from(buffer),
      },
      fields: 'id',
    })
    return true
  } catch (error) {
    console.warn(`Drive: mirror upload failed for ${key}`, error)
    return false
  }
}

/** Best-effort mirror delete. Never throws. */
export async function deleteFromDrive(key: string): Promise<void> {
  const drive = getDrive()
  if (!drive) return

  const safeKey = key.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  try {
    const res = await drive.files.list({
      q: `appProperties has { key='mediaKey' and value='${safeKey}' } and trashed=false`,
      fields: 'files(id)',
      spaces: 'drive',
      pageSize: 10,
    })
    for (const file of res.data.files ?? []) {
      if (file.id) {
        await drive.files.delete({ fileId: file.id }).catch((error) => {
          console.warn(`Drive: mirror delete failed for file ${file.id}`, error)
        })
      }
    }
  } catch (error) {
    console.warn(`Drive: mirror delete lookup failed for ${key}`, error)
  }
}
