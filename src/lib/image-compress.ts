/**
 * Стиснення великих фото перед завантаженням (економія сховища).
 * Не відхиляє файли — лише зменшує вагу, коли можливо.
 */
export async function compressImageIfNeeded(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file
  if (file.size <= 1.5 * 1024 * 1024) return file

  try {
    const bitmap = await createImageBitmap(file)
    const maxSide = 2400
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close()
      return file
    }
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
    const quality = outputType === 'image/jpeg' ? 0.86 : undefined

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, outputType, quality)
    })
    if (!blob || blob.size >= file.size) return file

    const ext = outputType === 'image/png' ? '.png' : '.jpg'
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo'
    return new File([blob], `${baseName}${ext}`, { type: outputType })
  } catch {
    return file
  }
}
