import type { HandlerEvent } from '@netlify/functions'
import { connectLambda, getStore } from '@netlify/blobs'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { deleteFromDrive, uploadToDrive } from './drive'

type BlobStore = ReturnType<typeof getStore>

const LOCAL_DIR = path.join(process.cwd(), '.netlify', 'media-store')

/** Filesystem fallback only during local development, never on AWS Lambda. */
function isLocalDev() {
  return (
    process.env.NETLIFY_DEV === 'true' ||
    process.env.CONTEXT === 'dev' ||
    (!process.env.AWS_LAMBDA_FUNCTION_NAME && !process.env.NETLIFY)
  )
}

function localPath(key: string) {
  const safe = key.replace(/\\/g, '/').replace(/\.\./g, '_')
  return path.join(LOCAL_DIR, safe)
}

function openStore(event?: HandlerEvent): BlobStore {
  if (event) {
    try {
      connectLambda(event)
    } catch {
      // Functions 2.0 may not need connectLambda
    }
  }
  return getStore('media')
}

async function withLocalFallback<T>(
  blobsOp: () => Promise<T>,
  localOp: () => Promise<T>,
): Promise<T> {
  try {
    return await blobsOp()
  } catch (error) {
    if (!isLocalDev()) {
      console.error('Netlify Blobs failed (production — no filesystem fallback)', error)
      throw error
    }
    console.warn('Netlify Blobs unavailable, using local filesystem', error)
    return localOp()
  }
}

export async function saveMediaFile(
  event: HandlerEvent,
  key: string,
  buffer: Buffer,
  metadata: { mimeType: string; fileName: string },
) {
  await withLocalFallback(
    async () => {
      const store = openStore(event)
      await store.set(key, buffer, {
        metadata: {
          mimeType: metadata.mimeType,
          fileName: metadata.fileName,
        },
      })
    },
    async () => {
      const filePath = localPath(key)
      await mkdir(path.dirname(filePath), { recursive: true })
      await writeFile(filePath, buffer)
      await writeFile(`${filePath}.meta.json`, JSON.stringify(metadata), 'utf8')
    },
  )

  // Secondary storage mirror (best-effort, never breaks the primary flow).
  await uploadToDrive(key, buffer, metadata)
}

export async function readMediaFile(
  event: HandlerEvent,
  key: string,
): Promise<{ data: Buffer; mimeType?: string; fileName?: string } | null> {
  return withLocalFallback(
    async () => {
      const store = openStore(event)
      const result = await store.getWithMetadata(key, { type: 'arrayBuffer' })
      if (!result?.data) return null
      return {
        data: Buffer.from(result.data as ArrayBuffer),
        mimeType: result.metadata?.mimeType as string | undefined,
        fileName: result.metadata?.fileName as string | undefined,
      }
    },
    async () => {
      try {
        const filePath = localPath(key)
        const data = await readFile(filePath)
        let mimeType: string | undefined
        let fileName: string | undefined
        try {
          const meta = JSON.parse(await readFile(`${filePath}.meta.json`, 'utf8')) as {
            mimeType?: string
            fileName?: string
          }
          mimeType = meta.mimeType
          fileName = meta.fileName
        } catch {
          // no metadata
        }
        return { data, mimeType, fileName }
      } catch {
        return null
      }
    },
  )
}

export async function readMediaBytes(key: string, event?: HandlerEvent): Promise<Uint8Array | null> {
  return withLocalFallback(
    async () => {
      const store = openStore(event)
      const data = await store.get(key, { type: 'arrayBuffer' })
      if (!data) return null
      return new Uint8Array(data)
    },
    async () => {
      try {
        return new Uint8Array(await readFile(localPath(key)))
      } catch {
        return null
      }
    },
  )
}

export async function deleteMediaFile(event: HandlerEvent, key: string) {
  try {
    const store = openStore(event)
    await store.delete(key)
  } catch (error) {
    if (!isLocalDev()) throw error
    console.warn('blobs delete failed', error)
  }

  if (isLocalDev()) {
    const filePath = localPath(key)
    await unlink(filePath).catch(() => undefined)
    await unlink(`${filePath}.meta.json`).catch(() => undefined)
  }

  // Mirror the delete to the secondary storage (best-effort).
  await deleteFromDrive(key)
}

function pendingChunkKey(uploadId: string, index: number) {
  return `pending/${uploadId}/chunk-${index}`
}

function pendingMetaKey(uploadId: string) {
  return `pending/${uploadId}/meta.json`
}

export interface PendingUploadMeta {
  eventId: string
  fileName: string
  mimeType: string
  totalSize: number
  totalChunks: number
  albumId: string | null
  uploadedBy: 'organizer' | 'guest'
  createdAt: string
}

export async function savePendingMeta(
  event: HandlerEvent,
  uploadId: string,
  meta: PendingUploadMeta,
) {
  const payload = JSON.stringify(meta)
  const key = pendingMetaKey(uploadId)

  await withLocalFallback(
    async () => {
      const store = openStore(event)
      await store.set(key, payload, { metadata: { mimeType: 'application/json' } })
    },
    async () => {
      const filePath = localPath(key)
      await mkdir(path.dirname(filePath), { recursive: true })
      await writeFile(filePath, payload, 'utf8')
    },
  )
}

export async function readPendingMeta(
  event: HandlerEvent,
  uploadId: string,
): Promise<PendingUploadMeta | null> {
  const key = pendingMetaKey(uploadId)

  return withLocalFallback(
    async () => {
      const store = openStore(event)
      const result = await store.get(key, { type: 'text' })
      if (!result) return null
      return JSON.parse(result) as PendingUploadMeta
    },
    async () => {
      try {
        const raw = await readFile(localPath(key), 'utf8')
        return JSON.parse(raw) as PendingUploadMeta
      } catch {
        return null
      }
    },
  )
}

export async function saveUploadChunk(
  event: HandlerEvent,
  uploadId: string,
  index: number,
  buffer: Buffer,
) {
  const key = pendingChunkKey(uploadId, index)

  await withLocalFallback(
    async () => {
      const store = openStore(event)
      await store.set(key, buffer)
    },
    async () => {
      const filePath = localPath(key)
      await mkdir(path.dirname(filePath), { recursive: true })
      await writeFile(filePath, buffer)
    },
  )
}

async function readUploadChunk(
  event: HandlerEvent,
  uploadId: string,
  index: number,
): Promise<Buffer | null> {
  const key = pendingChunkKey(uploadId, index)

  return withLocalFallback(
    async () => {
      const store = openStore(event)
      const result = await store.get(key, { type: 'arrayBuffer' })
      if (!result) return null
      return Buffer.from(result)
    },
    async () => {
      try {
        return await readFile(localPath(key))
      } catch {
        return null
      }
    },
  )
}

export async function mergePendingUpload(
  event: HandlerEvent,
  uploadId: string,
  finalKey: string,
  metadata: { mimeType: string; fileName: string },
): Promise<number> {
  const meta = await readPendingMeta(event, uploadId)
  if (!meta) throw new Error('pending_not_found')

  const parts: Buffer[] = []
  for (let i = 0; i < meta.totalChunks; i++) {
    const chunk = await readUploadChunk(event, uploadId, i)
    if (!chunk) throw new Error(`missing_chunk_${i}`)
    parts.push(chunk)
  }

  const merged = Buffer.concat(parts)
  if (merged.byteLength !== meta.totalSize) {
    console.warn(
      `upload ${uploadId}: size mismatch expected ${meta.totalSize} got ${merged.byteLength}`,
    )
  }

  await saveMediaFile(event, finalKey, merged, metadata)
  await deletePendingUpload(event, uploadId, meta.totalChunks)
  return merged.byteLength
}

export async function deletePendingUpload(
  event: HandlerEvent,
  uploadId: string,
  totalChunks: number,
) {
  try {
    const store = openStore(event)
    await store.delete(pendingMetaKey(uploadId))
    for (let i = 0; i < totalChunks; i++) {
      await store.delete(pendingChunkKey(uploadId, i))
    }
  } catch (error) {
    if (!isLocalDev()) {
      console.warn('pending cleanup blobs', error)
    }
  }

  if (isLocalDev()) {
    await unlink(localPath(pendingMetaKey(uploadId))).catch(() => undefined)
    for (let i = 0; i < totalChunks; i++) {
      await unlink(localPath(pendingChunkKey(uploadId, i))).catch(() => undefined)
    }
  }
}
