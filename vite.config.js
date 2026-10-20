import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: true, // بيسمح بأي رابط خارجي (مفيد جداً مع ngrok والتطوير المحلي)
  }
})