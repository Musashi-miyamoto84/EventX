import type { HandlerResponse } from '@netlify/functions'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

export function json(statusCode: number, body: unknown): HandlerResponse {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
    body: JSON.stringify(body),
  }
}

export function ok(body: unknown) {
  return json(200, body)
}

export function badRequest(message: string) {
  return json(400, { error: message })
}

export function unauthorized(message = 'Unauthorized') {
  return json(401, { error: message })
}

export function conflict(message: string) {
  return json(409, { error: message })
}

export function serverError(message = 'Internal server error') {
  return json(500, { error: message })
}

export function optionsResponse(): HandlerResponse {
  return {
    statusCode: 204,
    headers: corsHeaders,
    body: '',
  }
}

export function getBearerToken(authorization?: string) {
  if (!authorization?.startsWith('Bearer ')) return null
  return authorization.slice(7).trim() || null
}

export function normalizeLogin(login: string) {
  return login.trim().toLowerCase()
}

export function isValidLogin(login: string) {
  return /^[a-zA-Z0-9._-]{3,32}$/.test(login)
}

export function isValidPassword(password: string) {
  return password.length >= 8
}
