import api from './client';
import kiwoomApi from './kiwoomApi';
import { KiwoomTokenManager } from '../utils/kiwoomTokenManager';

export type Me = {
  id: number | string;
  email?: string;
  name?: string;
  roles?: string[];
  [key: string]: unknown;
};

/**
 * Try to fetch current user info using cookie-based session/JWT.
 * Primary path: /account/me (common)
 * Fallback: /accpunt/me (typo variant provided in request) to be safe.
 */
type AxiosErr = { response?: { status?: number } };

export async function getMe(): Promise<Me> {
  try {
    const res = await api.get('/account/getMyInfo');
    return res.data;
  } catch (e: unknown) {
    // fallback if backend route is spelled differently
    const status = (e as AxiosErr).response?.status;
    if (status === 404) {
      const res2 = await api.get('/account/getMyInfo');
      return res2.data;
    }
    throw e;
  }
}

/**
 * Logout current session.
 * Backend should clear cookie/session.
 */
export async function logout(): Promise<void> {
  try {
    // 1. 일반 계정 로그아웃
    await api.post('/account/logout');
    
    // 2. 키움API 토큰이 있는 경우에만 로그아웃 요청
    const hasKiwoomToken = KiwoomTokenManager.isTokenValid();
    if (hasKiwoomToken) {
      console.log('🔐 Logging out from Kiwoom API...');
      await kiwoomApi.post('/public/logout');
      console.log('✅ Kiwoom API logout successful');
    }
    
    // 3. 토큰 삭제 (로그아웃 요청 후)
    KiwoomTokenManager.clearToken();
    window.location.href = '/login';
  } catch (e) {
    console.error('Logout error:', e);
    // 에러가 발생해도 클라이언트 상태는 정리
    KiwoomTokenManager.clearToken();
    window.location.href = '/login';
  }
}
