import type { Handler } from '@netlify/functions'
import { getDb } from './_shared/db'
import { readMediaFile } from './_shared/media-store'
import { badRequest, optionsResponse, serverError, unauthorized } from './_shared/http'

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse()
  if (event.httpMethod !== 'GET') return badRequest('Method not allowed')

  try {
    const id = event.queryStringParameters?.id
    if (!id) return badRequest('missing_id')

    const sql = getDb()
    const rows = await sql`
      SELECT m.storage_key, m.mime_type, m.file_name, e.access_mode
      FROM media m
      JOIN events e ON e.id = m.event_id
      WHERE m.id = ${id}
      LIMIT 1
    `
    if (rows.length === 0) return unauthorized('not_found')
    if (rows[0].access_mode === 'hidden') return unauthorized('hidden')

    const file = await readMediaFile(event, rows[0].storage_key as string)
    if (!file) return unauthorized('not_found')

    const mimeType =
      file.mimeType || (rows[0].mime_type as string) || 'application/octet-stream'
    const fileName = file.fileName || (rows[0].file_name as string)

    return {
      statusCode: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
      body: file.data.toString('base64'),
      isBase64Encoded: true,
    }
  } catch (error) {
    console.error('media-file', error)
    return serverError()
  }
}
