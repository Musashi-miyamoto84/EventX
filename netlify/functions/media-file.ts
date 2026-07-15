import type { Config } from '@netlify/functions'
import { getStore } from '@netlify/blobs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { getDb } from './_shared/db'

const LOCAL_DIR = path.join(process.cwd(), '.netlify', 'media-store')
/** Частина відповіді для Range (безпечно під ліміт streamed ~20 МБ). */
const MAX_SLICE = 4 * 1024 * 1024
/** Повна відповідь без Range (streamed payload max ≈ 20 МБ). */
const FULL_STREAM_MAX = 19 * 1024 * 1024

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Range',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Expose-Headers': 'Content-Range, Accept-Ranges, Content-Length',
}

function localPath(key: string) {
  const safe = key.replace(/\\/g, '/').replace(/\.\./g, '_')
  return path.join(LOCAL_DIR, safe)
}

async function readAllBytes(key: string): Promise<Uint8Array | null> {
  try {
    const store = getStore({ name: 'media', consistency: 'strong' })
    const data = await store.get(key, { type: 'arrayBuffer' })
    if (data) return new Uint8Array(data)
  } catch (error) {
    console.warn('blobs read failed, trying filesystem', error)
  }

  try {
    const buf = await readFile(localPath(key))
    return new Uint8Array(buf)
  } catch {
    return null
  }
}

function parseRange(
  rangeHeader: string | null,
  size: number,
): { start: number; end: number } | null {
  if (!rangeHeader || !rangeHeader.startsWith('bytes=')) return null
  const spec = rangeHeader.slice('bytes='.length).split(',')[0]?.trim()
  if (!spec) return null

  const [startRaw, endRaw] = spec.split('-')
  let start: number
  let end: number

  if (startRaw === '') {
    const suffix = Number(endRaw)
    if (!Number.isFinite(suffix) || suffix <= 0) return null
    start = Math.max(0, size - suffix)
    end = size - 1
  } else {
    start = Number(startRaw)
    end = endRaw === '' || endRaw === undefined ? size - 1 : Number(endRaw)
  }

  if (!Number.isFinite(start) || !Number.isFinite(end)) return null
  if (start < 0 || start >= size) return null
  end = Math.min(end, size - 1)
  if (end < start) return null

  if (end - start + 1 > MAX_SLICE) {
    end = start + MAX_SLICE - 1
  }
  return { start, end }
}

function contentDisposition(fileName: string, download: boolean) {
  const encoded = encodeURIComponent(fileName)
  const type = download ? 'attachment' : 'inline'
  return `${type}; filename="${encoded}"; filename*=UTF-8''${encoded}`
}

export default async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    const download = url.searchParams.get('download') === '1'
    if (!id) {
      return new Response(JSON.stringify({ error: 'missing_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const sql = getDb()
    const rows = await sql`
      SELECT m.storage_key, m.mime_type, m.file_name, m.size_bytes, e.access_mode
      FROM media m
      JOIN events e ON e.id = m.event_id
      WHERE m.id = ${id}
      LIMIT 1
    `

    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: 'not_found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const row = rows[0]
    if (row.access_mode === 'hidden') {
      return new Response(JSON.stringify({ error: 'hidden' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const key = row.storage_key as string
    const mimeType = (row.mime_type as string) || 'application/octet-stream'
    const fileName = (row.file_name as string) || 'file'
    const dbSize = Number(row.size_bytes) || 0

    const bytes = await readAllBytes(key)
    if (!bytes) {
      return new Response(JSON.stringify({ error: 'not_found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const size = bytes.byteLength || dbSize
    const range = parseRange(req.headers.get('range'), size)

    // Відеоплеєр без Range на великому файлі: віддаємо перший шматок 206
    // (не для ?download=1 — інакше файл зіпсується).
    const forcePartial =
      !range && !download && size > FULL_STREAM_MAX

    if (range || forcePartial) {
      const start = range?.start ?? 0
      const end = range?.end ?? Math.min(MAX_SLICE - 1, size - 1)
      const slice = bytes.subarray(start, end + 1)

      const headers: Record<string, string> = {
        ...corsHeaders,
        'Content-Type': mimeType,
        'Content-Length': String(slice.byteLength),
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Disposition': contentDisposition(fileName, download),
      }

      if (req.method === 'HEAD') {
        return new Response(null, { status: 206, headers })
      }

      return new Response(slice, { status: 206, headers })
    }

    // Повна віддача (streamed Response обходить ліміт 6 МБ base64 Handler)
    if (size > FULL_STREAM_MAX) {
      return new Response(
        JSON.stringify({
          error: 'use_range',
          detail: 'Файл завеликий для однієї відповіді. Використайте Range / клієнтське завантаження.',
          size,
        }),
        {
          status: 413,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Accept-Ranges': 'bytes',
          },
        },
      )
    }

    const headers: Record<string, string> = {
      ...corsHeaders,
      'Content-Type': mimeType,
      'Content-Length': String(size),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Disposition': contentDisposition(fileName, download),
    }

    if (req.method === 'HEAD') {
      return new Response(null, { status: 200, headers })
    }

    return new Response(bytes, { status: 200, headers })
  } catch (error) {
    console.error('media-file', error)
    return new Response(JSON.stringify({ error: 'generic' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

export const config: Config = {}
