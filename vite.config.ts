import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy API requests to the Spring Boot backend
      '/api': {
        target: 'http://localhost:9789',
        changeOrigin: true,
        // No rewrite needed since backend already serves under /api
      },
      '/ws': {
        target: 'http://localhost:9789',
        changeOrigin: true,
        ws: true  // WebSocket 프록시 활성화
      }
      // '/kiwoom': {
      //   target: 'http://localhost:19789',
      //   changeOrigin: true,
      //   // No rewrite needed since backend already serves under /api
      // },
      // '/wpy': {
      //   target: 'http://localhost:19789',
      //   changeOrigin: true,
      //   // No rewrite needed since backend already serves under /api
      // },
    },
  },
})
