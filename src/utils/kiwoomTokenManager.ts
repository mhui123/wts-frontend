export class KiwoomTokenManager {
  private static readonly TOKEN_KEY = 'kiwoom_jwt_token';
  private static readonly TOKEN_EXPIRY_KEY = 'kiwoom_jwt_expiry';

  // JWT 토큰 저장
  static setToken(token: string, expiryInHours: number = 24): void {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
      const expiryTime = Date.now() + (expiryInHours * 60 * 60 * 1000);
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
    } catch (error) {
      console.warn('JWT 토큰 저장 실패:', error);
    }
  }

  // JWT 토큰 조회
  static getToken(): string | null {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);

      if (!token || !expiry) {
        return null;
      }

      // 토큰 만료 확인
      if (Date.now() > parseInt(expiry)) {
        this.clearToken();
        return null;
      }

      return token;
    } catch (error) {
      console.warn('JWT 토큰 조회 실패:', error);
      return null;
    }
  }

  // JWT 토큰 삭제
  static clearToken(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    } catch (error) {
      console.warn('JWT 토큰 삭제 실패:', error);
    }
  }

  // JWT 토큰 유효성 확인
  static isTokenValid(): boolean {
    return this.getToken() !== null;
  }

  // JWT 토큰 파싱 (payload 추출)
  static parseToken(): any | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (error) {
      console.warn('JWT 토큰 파싱 실패:', error);
      return null;
    }
  }
}