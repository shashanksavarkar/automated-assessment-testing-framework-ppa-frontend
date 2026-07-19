import path from "node:path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // Lets the frontend call relative /api/... paths in both dev and prod without
      // hardcoding the backend's host/port, and avoids needing a CORS allowance for
      // arbitrary LAN IPs when this is opened from another machine on a shared server.
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
})
