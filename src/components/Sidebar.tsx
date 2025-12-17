import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { KiwoomTokenManager } from '../utils/kiwoomTokenManager';

type SidebarProps = {
  open: boolean;
  onToggle: () => void;
  isAuthed?: boolean;
};

export default function Sidebar({ open, isAuthed = false }: SidebarProps) {
  const [kiwoomMenuOpen, setKiwoomMenuOpen] = useState(false);
  const [hasKiwoomToken, setHasKiwoomToken] = useState(false);

  // 키움 토큰 상태 감시
  useEffect(() => {
    const checkToken = () => {
      setHasKiwoomToken(KiwoomTokenManager.isTokenValid());
    };

    checkToken();
    // 주기적으로 토큰 상태 확인
    const interval = setInterval(checkToken, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // 키움API 메뉴 토글
  const handleKiwoomMenuToggle = () => {
    if (hasKiwoomToken) {
      setKiwoomMenuOpen(!kiwoomMenuOpen);
    }
  };

  return (
    <aside className={`sidebar ${open ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <span className="logo">⚙️ <span className="label">WTS</span></span>
      </div>
      
      {isAuthed ? (
        <nav className="sidebar-nav">
          <NavLink className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} to="/">
            <span className="icon">📊</span>
            <span className="label">Dashboard</span>
          </NavLink>
          
          <NavLink className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} to="/trade-history">
            <span className="icon">📑</span>
            <span className="label">거래 내역</span>
          </NavLink>
          
          <NavLink className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} to="/upload">
            <span className="icon">📤</span>
            <span className="label">업로드</span>
          </NavLink>

          {/* 키움 API 메뉴 (확장 가능) */}
          <div className="nav-item-group">
            <div 
              className={`nav-item expandable ${hasKiwoomToken ? 'has-token' : ''}`}
              onClick={hasKiwoomToken ? handleKiwoomMenuToggle : undefined}
            >
              <NavLink 
                to="/kiwoom-api" 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={(e) => hasKiwoomToken && e.preventDefault()}
              >
                <span className="icon">🔑</span>
                <span className="label">키움 API</span>
              </NavLink>
              {hasKiwoomToken && (
                <button 
                  className="expand-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleKiwoomMenuToggle();
                  }}
                  aria-label={kiwoomMenuOpen ? '메뉴 접기' : '메뉴 펼치기'}
                >
                  <span className={`expand-icon ${kiwoomMenuOpen ? 'expanded' : ''}`}>
                    ▼
                  </span>
                </button>
              )}
            </div>

            {/* 키움 API 하위 메뉴 */}
            {hasKiwoomToken && (
              <div className={`sub-menu ${kiwoomMenuOpen ? 'open' : 'closed'}`}>
                <NavLink 
                  className={({ isActive }) => `nav-item sub-item ${isActive ? 'active' : ''}`} 
                  to="/kiwoom/watchlist"
                >
                  <span className="icon">⭐</span>
                  <span className="label">관심종목</span>
                </NavLink>
                
                <NavLink 
                  className={({ isActive }) => `nav-item sub-item ${isActive ? 'active' : ''}`} 
                  to="/kiwoom/account"
                >
                  <span className="icon">💰</span>
                  <span className="label">계좌현황</span>
                </NavLink>
                
                <NavLink 
                  className={({ isActive }) => `nav-item sub-item ${isActive ? 'active' : ''}`} 
                  to="/kiwoom/orders"
                >
                  <span className="icon">📋</span>
                  <span className="label">주문내역</span>
                </NavLink>
                
                <NavLink 
                  className={({ isActive }) => `nav-item sub-item ${isActive ? 'active' : ''}`} 
                  to="/kiwoom/realtime"
                >
                  <span className="icon">📊</span>
                  <span className="label">실시간 현황</span>
                </NavLink>
              </div>
            )}
          </div>
        </nav>
      ) : (
        <div className="sidebar-nav" aria-hidden="true">
          <div className="nav-item" style={{ opacity: 0.6 }}>
            <span className="icon">🔐</span>
            <span className="label">Login required</span>
          </div>
        </div>
      )}
    </aside>
  );
}