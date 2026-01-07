import React from 'react';
import '../styles/components/Login.css';
import { useNavigate } from 'react-router-dom';
import { loginAsGuest } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setMe } = useAuth();
  const [loading, setLoading] = React.useState(false);

  const handleGuestLogin = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const guestUser = await loginAsGuest();
      setMe(guestUser);
      navigate('/'); // 메인 페이지로 이동
    } catch (error) {
      console.error('게스트 로그인 실패:', error);
      alert('게스트 로그인에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="login-page">
      <div className="login-box">
        <h1 className="login-title">로그인</h1>
        
        {/* Facebook */}
        {/* <button className="social-btn facebook" type="button">
          <span className="icon" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 12C22 6.477 17.523 2 12 2S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987H7.898V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.631.772-1.631 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" fill="currentColor"/>
            </svg>
          </span>
          <span className="label">페이스북 계정으로 로그인</span>
        </button> */}

        {/* Kakao */}
        {/* <button className="social-btn kakao" type="button">
          <span className="icon" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="currentColor" />
            </svg>
          </span>
          <span className="label">카카오톡 계정으로 로그인</span>
        </button> */}

        {/* Naver */}
        {/* <button className="social-btn naver" type="button">
          <span className="icon" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 4h4.5L18 14.2V4h4v16h-4.5L8 9.8V20H6V4z" fill="currentColor"/>
            </svg>
          </span>
          <span className="label">네이버 계정으로 로그인</span>
        </button> */}

        {/* Google */}
        <button className="social-btn google" type="button" onClick={() => {
          window.location.href = 'http://localhost:9789/oauth2/authorization/google';}} >
          <span className="icon" aria-hidden>
            <svg width="18" height="18"version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{display: 'block'}}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
          </span>
          <span className="label">구글 계정으로 로그인</span>
        </button>

        {/* Guest Login */}
        <button 
          className="social-btn guest" 
          type="button" 
          onClick={handleGuestLogin}
          disabled={loading}
          style={{
            backgroundColor: '#6B7280',
            borderColor: '#6B7280',
            marginTop: '12px'
          }}
        >
          <span className="icon" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L12 2L3 7V9H21ZM12 7.5C9.5 7.5 7.5 9.5 7.5 12S9.5 16.5 12 16.5S16.5 14.5 16.5 12S14.5 7.5 12 7.5ZM12 14.5C10.6 14.5 9.5 13.4 9.5 12S10.6 9.5 12 9.5S14.5 10.6 14.5 12S13.4 14.5 12 14.5Z" fill="currentColor"/>
            </svg>
          </span>
          <span className="label">
            {loading ? '게스트 로그인 중...' : 'GUEST로 로그인'}
          </span>
        </button>

        <p className="login-note">
          회원가입 없이 이용 가능하며 첫 로그인 시 <a href="#">이용약관</a> 및 <a href="#">개인정보처리방침</a> 동의를 간주합니다.
        </p>
      </div>
    </div>
  );
};

export default Login;
