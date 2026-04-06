import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ProfilePage.css'
import apiClient from '../../apiClient'
import AuthBar from '../../components/AuthBar/AuthBar'
import { notifyProfileUpdated, PROFILE_UPDATED_EVENT } from '../../profileEvents'
import {
  getStoredCustomerName,
  getStoredProfilePhoto,
  setStoredCustomerName,
  setStoredProfilePhoto,
} from '../../userSession'

const MAX_FILE_BYTES = 8 * 1024 * 1024
const MAX_STORED_CHARS = 500_000

async function fileToProfilePhotoDataUrl(file) {
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

  const maxDim = 280
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

  let quality = 0.88
  let jpeg = canvas.toDataURL('image/jpeg', quality)
  while (jpeg.length > MAX_STORED_CHARS && quality > 0.45) {
    quality -= 0.07
    jpeg = canvas.toDataURL('image/jpeg', quality)
  }
  if (jpeg.length > MAX_STORED_CHARS) {
    throw new Error('Image is still too large. Try a smaller or simpler photo.')
  }
  return jpeg
}

function getInitials(displayName) {
  const trimmed = String(displayName || 'User').trim()
  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return trimmed.slice(0, 2).toUpperCase() || 'U'
}

/** undefined = no photo change pending; null = remove on save; string = new image */
function ProfilePage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [name, setName] = useState(() => getStoredCustomerName())
  const [storedPhoto, setStoredPhotoState] = useState(() => getStoredProfilePhoto())
  const [stagedPhoto, setStagedPhoto] = useState(undefined)
  const [saveMessage, setSaveMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const displayPhoto =
    stagedPhoto === null
      ? null
      : stagedPhoto !== undefined
        ? stagedPhoto
        : storedPhoto

  useEffect(() => {
    const sync = () => {
      setName(getStoredCustomerName())
      setStoredPhotoState(getStoredProfilePhoto())
      setStagedPhoto(undefined)
    }
    window.addEventListener(PROFILE_UPDATED_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(PROFILE_UPDATED_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError('')
    try {
      const dataUrl = await fileToProfilePhotoDataUrl(file)
      setStagedPhoto(dataUrl)
      setSaveMessage('')
    } catch (e) {
      setError(e.message || 'Could not process image.')
    }
  }

  const handleRemovePhoto = () => {
    setStagedPhoto(null)
    setSaveMessage('')
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Name cannot be empty.')
      return
    }
    setSaving(true)
    setError('')
    setSaveMessage('')
    try {
      await apiClient.post('/update-profile', { name: trimmed })
      setStoredCustomerName(trimmed)
      if (stagedPhoto === null) {
        setStoredProfilePhoto(null)
        setStoredPhotoState(null)
      } else if (typeof stagedPhoto === 'string') {
        setStoredProfilePhoto(stagedPhoto)
        setStoredPhotoState(stagedPhoto)
      }
      setStagedPhoto(undefined)
      setName(trimmed)
      notifyProfileUpdated()
      setSaveMessage('Profile saved.')
    } catch (e) {
      console.error(e)
      setError(
        e.response?.data?.message ||
          'Could not update your name on the server. Try again.',
      )
    } finally {
      setSaving(false)
    }
  }

  const pendingRemoval = stagedPhoto === null && storedPhoto != null
  const canRemovePhoto =
    typeof stagedPhoto === 'string' || (stagedPhoto === undefined && storedPhoto != null)

  return (
    <main className="profile-page">
      <AuthBar userName={name} />
      <section className="profile-card" aria-labelledby="profile-heading">
        <h1 id="profile-heading">Your profile</h1>
        <p className="profile-subtitle">
          Your name is saved to your account. Profile photo is stored on this
          device only.
        </p>

        <div className="profile-avatar-block">
          <div className="profile-avatar-preview" aria-hidden>
            {displayPhoto ? (
              <img src={displayPhoto} alt="" className="profile-avatar-img" />
            ) : (
              <span className="profile-avatar-initials">
                {getInitials(name)}
              </span>
            )}
          </div>
          <div className="profile-avatar-actions">
            <button
              type="button"
              className="profile-btn secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload photo
            </button>
            {pendingRemoval ? (
              <button
                type="button"
                className="profile-btn ghost"
                onClick={() => setStagedPhoto(undefined)}
              >
                Undo removal
              </button>
            ) : canRemovePhoto ? (
              <button
                type="button"
                className="profile-btn ghost"
                onClick={handleRemovePhoto}
              >
                Remove photo
              </button>
            ) : null}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="profile-file-input"
              onChange={handleFileChange}
            />
          </div>
        </div>

        <form className="profile-form" onSubmit={handleSubmit}>
          <label htmlFor="profile-name">Display name</label>
          <input
            id="profile-name"
            name="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          {error ? (
            <p className="profile-error" role="alert">
              {error}
            </p>
          ) : null}
          {saveMessage ? (
            <p className="profile-success">{saveMessage}</p>
          ) : null}

          <div className="profile-form-actions">
            <button type="submit" className="profile-btn primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button
              type="button"
              className="profile-btn secondary"
              onClick={() => navigate('/products')}
            >
              Back to products
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}

export default ProfilePage
