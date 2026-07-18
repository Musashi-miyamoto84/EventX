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

/** Best-effort mirror upload. Never throws. */
export async function uploadToDrive(
  key: string,
  buffer: Buffer,
  metadata: { mimeType: string; fileName: string },
): Promise<boolean> {
  const drive = getDrive()
  if (!drive) return false

  const parent = folderId()
  try {
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
