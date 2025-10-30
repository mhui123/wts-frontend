import React from 'react';
import './Login.css';

const Login: React.FC = () => {
  return (
    <div className="login-page">
      <div className="login-box">
        <h1 className="login-title">로그인</h1>

        {/* Facebook */}
        <button className="social-btn facebook" type="button">
          <span className="icon" aria-hidden>
            {/* simple f glyph */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 12C22 6.477 17.523 2 12 2S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987H7.898V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.631.772-1.631 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" fill="currentColor"/>
            </svg>
          </span>
          <span className="label">페이스북 계정으로 로그인</span>
        </button>

        {/* Kakao */}
        <button className="social-btn kakao" type="button">
          <span className="icon" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="currentColor" />
            </svg>
          </span>
          <span className="label">카카오톡 계정으로 로그인</span>
        </button>

        {/* Naver */}
        <button className="social-btn naver" type="button">
          <span className="icon" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 4h4.5L18 14.2V4h4v16h-4.5L8 9.8V20H6V4z" fill="currentColor"/>
            </svg>
          </span>
          <span className="label">네이버 계정으로 로그인</span>
        </button>

        {/* Google */}
        <button className="social-btn google" type="button" onClick={() => {
          window.location.href = 'http://localhost:9789/oauth2/authorization/google';}} >
          <span className="icon" aria-hidden>
            {/* Google G */}
            <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 c0-6.627,5.373-12,12-12c3.059,0,5.839,1.155,7.938,3.062l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24 s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.839,1.155,7.938,3.062l5.657-5.657 C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.197l-6.191-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.616-3.317-11.283-7.946l-6.522,5.022C9.505,39.556,16.227,44,24,44z"/>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-3.994,5.565 c0.001-0.001,0.002-0.001,0.003-0.002l6.191,5.238C36.985,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
            </svg>
          </span>
          <span className="label">구글 계정으로 로그인</span>
        </button>

        <p className="login-note">
          회원가입 없이 이용 가능하며 첫 로그인 시 <a href="#">이용약관</a> 및 <a href="#">개인정보처리방침</a> 동의를 간주합니다.
        </p>
      </div>
    </div>
  );
};

export default Login;
