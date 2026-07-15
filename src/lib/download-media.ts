/** Завантаження медіа з підтримкою Range (обхід ліміту відповіді Netlify). */
export async function downloadMediaFile(
  url: string,
  fileName: string,
  sizeBytes?: number,
) {
  const chunkSize = 3 * 1024 * 1024

  // Маленькі файли — звичайний fetch
  if (!sizeBytes || sizeBytes <= 12 * 1024 * 1024) {
    const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}download=1`)
    if (!res.ok) throw new Error('download_failed')
    const blob = await res.blob()
    triggerSave(blob, fileName)
    return
  }

  // Великі — збираємо частинами через Range
  const parts: BlobPart[] = []
  let start = 0
  while (start < sizeBytes) {
    const end = Math.min(start + chunkSize - 1, sizeBytes - 1)
    const res = await fetch(url, {
      headers: { Range: `bytes=${start}-${end}` },
    })
    if (!(res.status === 206 || res.status === 200)) {
      throw new Error('download_failed')
    }
    const buf = await res.arrayBuffer()
    parts.push(buf)
    if (res.status === 200) break
    start = end + 1
  }

  triggerSave(new Blob(parts), fileName)
}

function triggerSave(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(objectUrl)
}
