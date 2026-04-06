export const AUTH_TOKEN_KEY = 'authToken'

const CUSTOMER_ID_KEY = 'customerId'
const CUSTOMER_NAME_KEY = 'customerName'
const CUSTOMER_PHOTO_KEY = 'customerProfilePhoto'

/**
 * Persist logged-in user (token + profile) for reloads / return visits.
 */
export function saveUserSession({ token, user, fallbackName }) {
  const resolvedToken = token ?? user?.token
  if (resolvedToken) {
    localStorage.setItem(AUTH_TOKEN_KEY, resolvedToken)
  }

  const id = user?.c_id
  if (id != null && id !== '') {
    localStorage.setItem(CUSTOMER_ID_KEY, String(id))
  }

  const name = user?.c_name ?? fallbackName
  if (name) {
    localStorage.setItem(CUSTOMER_NAME_KEY, name)
  }
}

export function clearUserSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(CUSTOMER_ID_KEY)
  localStorage.removeItem(CUSTOMER_NAME_KEY)
  localStorage.removeItem(CUSTOMER_PHOTO_KEY)
}

export function hasUserSession() {
  return Boolean(
    localStorage.getItem(AUTH_TOKEN_KEY) &&
    localStorage.getItem(CUSTOMER_ID_KEY),
  )
}

export function getStoredCustomerId() {
  const raw = localStorage.getItem(CUSTOMER_ID_KEY)
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

export function getStoredCustomerName() {
  return localStorage.getItem(CUSTOMER_NAME_KEY) || 'User'
}

export function setStoredCustomerName(name) {
  const trimmed = String(name || '').trim()
  if (trimmed) {
    localStorage.setItem(CUSTOMER_NAME_KEY, trimmed)
  }
}

/** Data URL (e.g. image/jpeg) or null to clear */
export function getStoredProfilePhoto() {
  return localStorage.getItem(CUSTOMER_PHOTO_KEY) || null
}

export function setStoredProfilePhoto(dataUrl) {
  if (dataUrl == null || dataUrl === '') {
    localStorage.removeItem(CUSTOMER_PHOTO_KEY)
  } else {
    localStorage.setItem(CUSTOMER_PHOTO_KEY, dataUrl)
  }
}
