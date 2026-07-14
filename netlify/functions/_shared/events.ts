import type { HandlerEvent } from '@netlify/functions'
import { verifyToken } from './crypto'
import { getBearerToken, unauthorized } from './http'

export async function requireUser(event: HandlerEvent) {
  const token = getBearerToken(
    event.headers.authorization || event.headers.Authorization,
  )
  if (!token) {
    throw Object.assign(new Error('unauthorized'), { status: 401 })
  }
  return verifyToken(token)
}

export function generateEventCode(length = 6) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return code
}

export function mediaPublicUrl(mediaId: string) {
  return `/.netlify/functions/media-file?id=${mediaId}`
}

export { unauthorized }
