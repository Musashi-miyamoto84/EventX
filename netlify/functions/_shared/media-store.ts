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
    const store = getStore('media')
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
    await store.set(key, buffer, { metadata })
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
