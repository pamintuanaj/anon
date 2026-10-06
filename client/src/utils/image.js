// Shrinks a photo in the browser before it is saved. Phone photos are 3-8 MB;
// a project cover only ever shows at a few hundred pixels, so a 900px JPEG is
// plenty. It also keeps demo mode (localStorage, ~5 MB) from filling up, and
// re-drawing on a canvas drops hidden data such as GPS location in the EXIF.

const MAX_SIDE = 900
const TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

export const COVER_FILE_LIMIT = 15 * 1024 * 1024   // refuse absurd inputs before decoding

export async function shrinkImage(file, { maxSide = MAX_SIDE, quality = 0.82, maxBytes = Infinity } = {}) {
  if (!TYPES.includes(file.type)) throw new Error('Choose a PNG, JPEG, WebP or GIF picture.')
  if (file.size > COVER_FILE_LIMIT) throw new Error('That picture is over 15 MB. Try a smaller one.')

  let bitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('That picture could not be read. Try a different one.')
  }

  // Try the requested size, then smaller and lower quality until it fits the
  // byte limit (a noisy photo can stay big even at a small size).
  let side = maxSide
  let q = quality
  for (let attempt = 0; attempt < 6; attempt++) {
    const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#FFF7F8'                    // transparent PNGs land on cream, not black
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', q))
    if (!blob) break
    if (blob.size <= maxBytes) { bitmap.close?.(); return blob }
    side = Math.round(side * 0.8)
    q = Math.max(0.5, q - 0.08)
  }
  bitmap.close?.()
  throw new Error('That picture could not be made small enough. Try a different one.')
}

// The server takes pictures for posts and comments as data: URLs inside JSON.
export const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.onerror = () => reject(new Error('Could not read the picture'))
  reader.readAsDataURL(blob)
})

// A cover link must be https, the same rule the server enforces.
export function checkCoverUrl(text) {
  const raw = text.trim()
  let url
  try { url = new URL(raw) } catch { return { ok: false, error: 'That does not look like a link.' } }
  if (url.protocol !== 'https:') return { ok: false, error: 'The link must start with https://' }
  if (raw.length > 500) return { ok: false, error: 'That link is too long (500 characters max).' }
  return { ok: true, url: url.toString() }
}
