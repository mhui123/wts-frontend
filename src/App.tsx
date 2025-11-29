import React from 'react';
import './App.css';
import Layout from './components/Layout';
import { getMe, logout, type Me } from './api/auth';
import { useRoutes, useNavigate } from 'react-router-dom';
import { routes } from './routes';
import { AuthContext } from './contexts/AuthContext';

function App() {
  const [me, setMe] = React.useState<Me | null>(null);
  const [loadingMe, setLoadingMe] = React.useState(true);
  const navigate = useNavigate();
  const routing = useRoutes(routes);

  React.useEffect(() => {
    let mounted = true;
    // Try to fetch current user
    getMe().then(user => { if (mounted) setMe(user); })
      .catch(() => { if (mounted) setMe(null); })
      .finally(() => { if (mounted) setLoadingMe(false); });
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogin = () => { navigate('/login'); };
  const handleLogout = async () => {
    try { await logout(); } finally { setMe(null); }
  };

  return (
    <AuthContext.Provider value={{ me, setMe, loadingMe }}>
      <Layout me={me} onLogin={handleLogin} onLogout={handleLogout}>
        {loadingMe ? <div>사용자 정보 로딩중...</div> : routing}
      </Layout>
    </AuthContext.Provider>
  );
}

export default App;