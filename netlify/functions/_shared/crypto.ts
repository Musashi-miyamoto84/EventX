import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

const SALT_ROUNDS = 10
const TOKEN_TTL = '7d'

function getSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not configured')
  }
  return new TextEncoder().encode(secret)
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export async function createToken(payload: { userId: string; login: string }) {
  return new SignJWT({ login: payload.login })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(getSecret())
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret())
  const userId = payload.sub
  const login = payload.login

  if (!userId || typeof login !== 'string') {
    throw new Error('Invalid token')
  }

  return { userId, login }
}
