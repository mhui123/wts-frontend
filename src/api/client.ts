import axios from 'axios'
import { GuestTokenManager } from '../utils/guestTokenManager';

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
    const headers = (err?.config?.headers ?? {}) as Record<string, string>;
    const skipAuthRedirect = headers['x-skip-auth-redirect'] === 'true';
    if (err?.response?.status === 401 && !skipAuthRedirect && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
)


// 요청 인터셉터 - 게스트 사용자 JWT 토큰 자동 첨부
api.interceptors.request.use(
  (config) => {
    console.log('🔍 API Request Interceptor:', config.url); // 디버깅용
    
    // 게스트 토큰이 있는지 확인 (게스트 사용자 판별)
    const guestToken = GuestTokenManager.getToken();

    if (guestToken) {
      // 게스트 사용자인 경우 JWT 토큰 첨부
      config.headers.Authorization = `Bearer ${guestToken}`;
      console.log('✅ Guest JWT token added to Authorization header'); // 디버깅용
    }
    // 일반 사용자인 경우 withCredentials로 쿠키가 자동 첨부됨
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);



export default api
