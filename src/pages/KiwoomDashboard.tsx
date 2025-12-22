import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import KiwoomSidebar from '../components/kiwoom/KiwoomSidebar';
import { KiwoomTokenManager } from '../utils/kiwoomTokenManager';
import { useAuth } from '../contexts/AuthContext';
import LoginRequired from '../components/LoginRequired';
// import '../styles/components/KiwoomDashboard.css';

const KiwoomDashboard: React.FC = () => {
  const { me } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // 인증 체크
  if (!me) {
    return <LoginRequired />;
  }

  // 키움 토큰 체크
  const hasValidToken = KiwoomTokenManager.isTokenValid();
  if (!hasValidToken) {
    navigate('/kiwoom-api');
    return null;
  }

  const handleLogoutKiwoom = () => {
    KiwoomTokenManager.clearToken();
    navigate('/kiwoom-api');
  };

  return (
    <div className="kiwoom-dashboard">
      <main className={`kiwoom-main sidebar-closed`}>

        <div className="kiwoom-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default KiwoomDashboard;