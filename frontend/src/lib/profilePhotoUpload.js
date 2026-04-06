import apiClient from '../apiClient'
import { getStoredCustomerId } from '../userSession'

const MAX_FILE_BYTES = 8 * 1024 * 1024
const MAX_BLOB_BYTES = 500_000



/**
 * Resize/compress image to JPEG Blob for S3 upload.
 */
export async function compressImageFileToJpegBlob(file) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file (PNG, JPG, or WebP).')
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('Image must be under 8 MB.')
  }

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read file.'))
    reader.readAsDataURL(file)
  })

  const img = await new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not load image.'))
    image.src = dataUrl
  })

  const maxDim = 1024
  let w = img.naturalWidth
  let h = img.naturalHeight
  if (w > maxDim || h > maxDim) {
    if (w >= h) {
      h = Math.round((h * maxDim) / w)
      w = maxDim
    } else {
      w = Math.round((w * maxDim) / h)
      h = maxDim
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, w, h)

  const toBlob = (quality) =>
    new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error('Could not encode image.')),
        'image/jpeg',
        quality,
      )
    })

  let quality = 0.88
  let blob = await toBlob(quality)
  while (blob.size > MAX_BLOB_BYTES && quality > 0.45) {
    quality -= 0.07
    blob = await toBlob(quality)
  }
  if (blob.size > MAX_BLOB_BYTES) {
    throw new Error('Image is still too large after compression. Try another photo.')
  }
  return blob
}

/**
 * Ask backend for presigned PUT URL, upload bytes, return public object URL.
 */
export async function uploadProfilePhotoViaPresignedUrl(jpegBlob) {
  const customerId = getStoredCustomerId() ?? 'anon'
  const fileName = `profile-${customerId}-${Date.now()}.jpg`
  const fileType = 'image/jpeg'

  const { data } = await apiClient.post('/get-presigned-url', {
    fileName,
    fileType,
  })

  if (!data?.success || !data?.data?.preSignedURL) {
    throw new Error(data?.message || 'Could not get upload URL.')
  }

  const { preSignedURL, publicUrl } = data.data

  const putRes = await fetch(preSignedURL, {
    method: 'PUT',
    body: jpegBlob,
    headers: {
      'Content-Type': fileType,
    },
  })

  if (!putRes.ok) {
    const hint = await putRes.text().catch(() => '')
    throw new Error(
      `Upload failed (${putRes.status}). ${hint ? hint.slice(0, 120) : ''}`.trim(),
    )
  }

  const saveMeta = await apiClient.post('/update-profile-photo', {
    imagePath: publicUrl,
  })

  if (!saveMeta.data?.success) {
    throw new Error(
      saveMeta.data?.message ||
        'Photo uploaded but could not save URL to your profile.',
    )
  }

  return saveMeta.data?.data?.profileURL || publicUrl
}
