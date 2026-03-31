import axios from 'axios'
import apiBaseUrl from './apiBaseUrl'

export const AUTH_TOKEN_KEY = 'authToken'

const apiClient = axios.create({
  baseURL: apiBaseUrl,
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  console.log("🚀 ~ token:", token)

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export default apiClient
