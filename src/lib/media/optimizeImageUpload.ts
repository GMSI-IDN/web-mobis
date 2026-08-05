import path from 'path'
import sharp from 'sharp'
import type { CollectionBeforeOperationHook } from 'payload'

// Every image uploaded through the Media collection is converted to WebP and
// re-encoded (and, if necessary, downscaled) until it fits under MAX_BYTES.
// This keeps customer-facing pages light regardless of what editors upload.
const MAX_BYTES = 700 * 1024
const MAX_DIMENSION = 2560
const MIN_DIMENSION = 480
const QUALITY_STEPS = [82, 75, 68, 60, 52, 45, 38, 32, 26, 20]

// GIF is intentionally excluded — sharp's webp() only keeps the first frame,
// which would silently kill any animated GIF an editor uploads. SVG/PDF
// aren't raster images and pass through untouched.
const RESIZABLE_MIMETYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/tiff',
  'image/avif',
])

async function encodeWebp(input: Buffer, width: number | undefined, quality: number) {
  let pipeline = sharp(input, { failOn: 'none' }).rotate()
  if (width) {
    pipeline = pipeline.resize({ width, fit: 'inside', withoutEnlargement: true })
  }
  return pipeline.webp({ quality, effort: 4 }).toBuffer()
}

/**
 * Encodes an image buffer as WebP, stepping quality down (and, if that isn't
 * enough, dimensions too) until the result fits within maxBytes. Falls back
 * to the smallest buffer achieved if the target still can't be hit.
 */
export async function compressImageToWebp(
  input: Buffer,
  maxBytes: number = MAX_BYTES,
): Promise<Buffer> {
  const metadata = await sharp(input, { failOn: 'none' }).metadata()
  const originalWidth = metadata.width ?? MAX_DIMENSION
  const originalHeight = metadata.height ?? MAX_DIMENSION

  let width = Math.max(originalWidth, originalHeight) > MAX_DIMENSION ? MAX_DIMENSION : undefined
  let best: Buffer | null = null

  for (;;) {
    for (const quality of QUALITY_STEPS) {
      const buffer = await encodeWebp(input, width, quality)
      if (!best || buffer.length < best.length) best = buffer
      if (buffer.length <= maxBytes) return buffer
    }

    const nextWidth = Math.round((width ?? originalWidth) * 0.8)
    if (nextWidth < MIN_DIMENSION || (width !== undefined && nextWidth >= width)) break
    width = nextWidth
  }

  // Best effort: couldn't hit maxBytes even at the quality/dimension floor
  // (e.g. an extremely detailed source image). Use the smallest we achieved
  // rather than fail the upload.
  return best as Buffer
}

function toWebpFilename(originalName: string): string {
  const ext = path.extname(originalName)
  const base = ext ? originalName.slice(0, -ext.length) : originalName
  return `${base || 'upload'}.webp`
}

export const optimizeImageUpload: CollectionBeforeOperationHook = async ({ req, operation }) => {
  if (operation !== 'create' && operation !== 'update') return

  const file = req.file
  if (!file?.data?.length || !RESIZABLE_MIMETYPES.has(file.mimetype)) return

  try {
    const compressed = await compressImageToWebp(file.data)
    req.file = {
      ...file,
      data: compressed,
      mimetype: 'image/webp',
      name: toWebpFilename(file.name),
      size: compressed.length,
    }
  } catch (err) {
    req.payload?.logger?.warn?.({
      err,
      message: 'Image upload optimization failed — saving original file untouched.',
    })
  }
}
