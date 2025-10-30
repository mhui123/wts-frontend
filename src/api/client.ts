import axios from 'axios'

// Axios instance configured to hit the backend via Vite dev proxy.
// In dev: requests to '/api' are proxied to http://localhost:9789 (see vite.config.ts)
// In prod: adjust baseURL via reverse-proxy or env as needed.
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // ALWAYS include cookies (JSESSIONID/JWT) in requests
})

// Optional: redirect to /login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      // You can customize behavior here (e.g., clear storage)
      // window.location.href = '/login';
    }
    return Promise.reject(err);
  }
)

export default api
