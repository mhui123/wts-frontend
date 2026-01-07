import React from 'react';
import './App.css';
import Layout from './components/Layout';
import { getMe, logout, type Me, getMeFromGuestToken } from './api/auth';
import { useRoutes, useNavigate } from 'react-router-dom';
import { routes } from './routes';
import { AuthContext } from './contexts/AuthContext';
import './styles/globals.css';
import { GuestTokenManager } from './utils/guestTokenManager';

function App() {
  const [me, setMe] = React.useState<Me | null>(null);
  const [loadingMe, setLoadingMe] = React.useState(true);
  const navigate = useNavigate();
  const routing = useRoutes(routes);

  React.useEffect(() => {
    let mounted = true;
    
    const loadUser = async () => {
      try {
        // 1. 일반 사용자 정보 조회 시도
        const user = await getMe();
        if (mounted) setMe(user);
      } catch {
        // 2. 일반 로그인 실패 시 게스트 토큰 확인
        try {
          const guestUser = await getMeFromGuestToken();
          if (mounted) setMe(guestUser);
        } catch {
          if (mounted) setMe(null);
        }
      } finally {
        if (mounted) setLoadingMe(false);
      }
    };

    loadUser();
    
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogin = () => { navigate('/login'); };
  const handleLogout = async () => {
    try {
      // 게스트 사용자인 경우 게스트 토큰만 삭제
      if (me?.isGuest) {
        GuestTokenManager.clearToken();
      } else {
        // 일반 사용자인 경우 기존 로그아웃 로직
        await logout();
      }
    } finally {
      setMe(null);
    }
  };

  return (
    <AuthContext.Provider value={{ me, setMe, loadingMe, isGuest: me?.isGuest ?? false }}>
      <Layout me={me} onLogin={handleLogin} onLogout={handleLogout}>
        {loadingMe ? <div>사용자 정보 로딩중...</div> : routing}
      </Layout>
    </AuthContext.Provider>
  );
}

export default App;