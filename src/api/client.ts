import axios from 'axios'

// Axios instance configured to hit the backend via Vite dev proxy.
// In dev: requests to '/api' are proxied to http://localhost:9789 (see vite.config.ts)
// In prod: adjust baseURL via reverse-proxy or env as needed.
export const api = axios.create({
  baseURL: '/api',
  // You can add headers/interceptors here if auth is required later
})

export default api
