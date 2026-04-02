export const AUTH_TOKEN_KEY = 'authToken'

const CUSTOMER_ID_KEY = 'customerId'
const CUSTOMER_NAME_KEY = 'customerName'

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
