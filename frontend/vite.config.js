import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['devusmanasghar.site', 'www.devusmanasghar.site'],
    // If you want to allow everything (less secure but easier for testing):
    // allowedHosts: true 
  }
})
