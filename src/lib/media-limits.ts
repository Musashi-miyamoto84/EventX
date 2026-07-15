/** Технічні константи chunked upload (обмеження тіла Netlify Functions). */
export const UPLOAD_TECH = {
  chunkSize: 3 * 1024 * 1024,
  directUploadMax: 4 * 1024 * 1024,
} as const

export function isVideoMime(mime: string) {
  return mime.startsWith('video/')
}

export function isImageMime(mime: string) {
  return mime.startsWith('image/')
}
