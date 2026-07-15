import type { HandlerEvent } from '@netlify/functions'
import { connectLambda, getStore } from '@netlify/blobs'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

const LOCAL_DIR = path.join(process.cwd(), '.netlify', 'media-store')

function localPath(key: string) {
  // Prevent path traversal; keep flat-ish structure under LOCAL_DIR
  const safe = key.replace(/\\/g, '/').replace(/\.\./g, '_')
  return path.join(LOCAL_DIR, safe)
}

async function withBlobsStore<T>(
  event: HandlerEvent,
  fn: (store: ReturnType<typeof getStore>) => Promise<T>,
): Promise<T | null> {
  try {
    connectLambda(event)
    const store = getStore({ name: 'media', consistency: 'strong' })
    return await fn(store)
  } catch (error) {
    console.warn('Netlify Blobs unavailable, falling back to filesystem', error)
    return null
  }
}

export async function saveMediaFile(
  event: HandlerEvent,
  key: string,
  buffer: Buffer,
  metadata: { mimeType: string; fileName: string },
) {
  const saved = await withBlobsStore(event, async (store) => {
    await store.set(key, buffer, {
      metadata: {
        mimeType: metadata.mimeType,
        fileName: metadata.fileName,
      },
    })
    return true
  })
  if (saved) return

  const filePath = localPath(key)
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, buffer)
  await writeFile(`${filePath}.meta.json`, JSON.stringify(metadata), 'utf8')
}

export async function readMediaFile(
  event: HandlerEvent,
  key: string,
): Promise<{ data: Buffer; mimeType?: string; fileName?: string } | null> {
  const fromBlobs = await withBlobsStore(event, async (store) => {
    const result = await store.getWithMetadata(key, { type: 'arrayBuffer' })
    if (!result?.data) return null
    return {
      data: Buffer.from(result.data as ArrayBuffer),
      mimeType: result.metadata?.mimeType as string | undefined,
      fileName: result.metadata?.fileName as string | undefined,
    }
  })
  if (fromBlobs) return fromBlobs
  // null from withBlobsStore means blobs failed; also handle "file not in blobs"
  if (fromBlobs === null) {
    // try filesystem
  }

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
}

export async function deleteMediaFile(event: HandlerEvent, key: string) {
  await withBlobsStore(event, async (store) => {
    await store.delete(key)
    return true
  })

  const filePath = localPath(key)
  await unlink(filePath).catch(() => undefined)
  await unlink(`${filePath}.meta.json`).catch(() => undefined)
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

  const saved = await withBlobsStore(event, async (store) => {
    await store.set(key, payload, { metadata: { mimeType: 'application/json' } })
    return true
  })
  if (saved) return

  const filePath = localPath(key)
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, payload, 'utf8')
}

export async function readPendingMeta(
  event: HandlerEvent,
  uploadId: string,
): Promise<PendingUploadMeta | null> {
  const key = pendingMetaKey(uploadId)

  const fromBlobs = await withBlobsStore(event, async (store) => {
    const result = await store.get(key, { type: 'text' })
    if (!result) return null
    return JSON.parse(result) as PendingUploadMeta
  })
  if (fromBlobs) return fromBlobs

  try {
    const raw = await readFile(localPath(key), 'utf8')
    return JSON.parse(raw) as PendingUploadMeta
  } catch {
    return null
  }
}

export async function saveUploadChunk(
  event: HandlerEvent,
  uploadId: string,
  index: number,
  buffer: Buffer,
) {
  const key = pendingChunkKey(uploadId, index)

  const saved = await withBlobsStore(event, async (store) => {
    await store.set(key, buffer)
    return true
  })
  if (saved) return

  const filePath = localPath(key)
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, buffer)
}

async function readUploadChunk(
  event: HandlerEvent,
  uploadId: string,
  index: number,
): Promise<Buffer | null> {
  const key = pendingChunkKey(uploadId, index)

  const fromBlobs = await withBlobsStore(event, async (store) => {
    const result = await store.getWithMetadata(key, { type: 'arrayBuffer' })
    if (!result?.data) return null
    return Buffer.from(result.data as ArrayBuffer)
  })
  if (fromBlobs) return fromBlobs

  try {
    return await readFile(localPath(key))
  } catch {
    return null
  }
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
  await withBlobsStore(event, async (store) => {
    await store.delete(pendingMetaKey(uploadId))
    for (let i = 0; i < totalChunks; i++) {
      await store.delete(pendingChunkKey(uploadId, i))
    }
    return true
  })

  await unlink(localPath(pendingMetaKey(uploadId))).catch(() => undefined)
  for (let i = 0; i < totalChunks; i++) {
    await unlink(localPath(pendingChunkKey(uploadId, i))).catch(() => undefined)
  }
}
