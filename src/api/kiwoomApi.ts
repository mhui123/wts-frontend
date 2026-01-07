import axios from 'axios';
import { KiwoomTokenManager } from '../utils/kiwoomTokenManager';
import { GuestTokenManager } from '../utils/guestTokenManager';

const kiwoomApi = axios.create({
  baseURL: '/api/kiwoom',
  withCredentials: true,
});

// 요청 인터셉터 - JWT 토큰 자동 첨부
kiwoomApi.interceptors.request.use(
  (config) => {
    console.log('🔍 Kiwoom API Request Interceptor:', config.url); // 디버깅용
    
    // 토큰이 필요한 경로 판단
    const isPublicRoute = config.url?.startsWith('/public');
    const isLogoutRoute = config.url === '/public/logout';
    const needsToken = !isPublicRoute || isLogoutRoute;
    
    if (needsToken) {
      const token = KiwoomTokenManager.getToken();
      console.log('🔑 Token exists:', !!token); // 디버깅용
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ Authorization header added'); // 디버깅용
      } else {
        console.warn('⚠️ No token found for authenticated request');
      }
    } else {
      console.log('ℹ️ Public route, no token needed');

      // 게스트 토큰 첨부
      if (GuestTokenManager.isTokenValid()) {
        const token = GuestTokenManager.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('✅ Guest Authorization header added'); // 디버깅용
        }
      }
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 토큰 만료 처리
kiwoomApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 Unauthorized 에러 시 토큰 삭제
    if (error.response?.status === 401) {
      KiwoomTokenManager.clearToken();
      
      // 토큰 만료 알림 (선택사항)
      const isPublicRoute = error.config?.url?.startsWith('/public');
      if (!isPublicRoute) {
        console.warn('키움 API 토큰이 만료되었습니다. 다시 로그인해주세요.');
        // 필요시 토스트 알림이나 리다이렉트 로직 추가
      }
    }
    
    return Promise.reject(error);
  }
);

export default kiwoomApi;