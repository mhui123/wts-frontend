import api from './client';
import kiwoomApi from './kiwoomApi';
import { KiwoomTokenManager } from '../utils/kiwoomTokenManager';
import { GuestTokenManager } from '../utils/guestTokenManager';

export type Me = {
  id: number | string;
  email?: string;
  name?: string;
  roles?: string[];
  [key: string]: unknown;
  isGuest?: boolean; // 게스트 식별 필드 추가
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
    const guestToken = GuestTokenManager.getToken();
    if (guestToken) {
      // 게스트 토큰도 클리어
      GuestTokenManager.clearToken();
    }
  } catch (e) {
    console.error('Logout error:', e);
    // 에러가 발생해도 클라이언트 상태는 정리
    KiwoomTokenManager.clearToken();
    window.location.href = '/login';
  }
}


/**
 * 게스트 로그인 - JWT 토큰 발급
 */
export async function loginAsGuest(): Promise<Me> {
  try {
    const response = await api.post('/guest/login');
    const { token } = response.data;
    
    // JWT 토큰 저장
    GuestTokenManager.setToken(token);

    // const res = await api.get('/account/getMyInfo');
    
    // 게스트 사용자 정보 반환
    const guestUser: Me = {
      id: 'guest',
      name: '게스트 사용자',
      email: 'guest@temp.local',
      isGuest: true,
      roles: ['GUEST']
    };
    
    return guestUser;
  } catch (error) {
    console.error('게스트 로그인 실패:', error);
    throw error;
  }
}

/**
 * 게스트 토큰으로 사용자 정보 조회
 */
export async function getMeFromGuestToken(): Promise<Me | null> {
  if (!GuestTokenManager.isTokenValid()) {
    return null;
  }

  try {
    // 게스트 토큰이 유효한 경우 게스트 사용자 정보 반환
    return {
      id: 'guest',
      name: '게스트 사용자',
      email: 'guest@temp.local',
      isGuest: true,
      roles: ['GUEST']
    };
  } catch (error) {
    console.error('게스트 토큰 검증 실패:', error);
    GuestTokenManager.clearToken();
    return null;
  }
}
