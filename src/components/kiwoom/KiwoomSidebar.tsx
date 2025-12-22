import React from 'react';
import { NavLink } from 'react-router-dom';

type KiwoomSidebarProps = {
  open: boolean;
  onToggle: () => void;
  onLogout: () => void;
};

const KiwoomSidebar: React.FC<KiwoomSidebarProps> = ({ open, onToggle, onLogout }) => {
  return (
    <aside className={`kiwoom-sidebar ${open ? 'open' : 'closed'}`}>
      <div className="kiwoom-sidebar-header">
        <div className="logo">
          <span className="icon">📈</span>
          {open && <span className="text">키움 API</span>}
        </div>
      </div>
      
      <nav className="kiwoom-sidebar-nav">
        <NavLink 
          to="/kiwoom-dashboard/watchlist" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          title="관심종목"
        >
          <span className="icon">⭐</span>
          {open && <span className="text">관심종목</span>}
        </NavLink>
        
        <NavLink 
          to="/kiwoom-dashboard/account" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          title="계좌현황"
        >
          <span className="icon">💰</span>
          {open && <span className="text">계좌현황</span>}
        </NavLink>
        
        <NavLink 
          to="/kiwoom-dashboard/orders" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          title="주문내역"
        >
          <span className="icon">📋</span>
          {open && <span className="text">주문내역</span>}
        </NavLink>
        
        <NavLink 
          to="/kiwoom-dashboard/realtime" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          title="실시간 현황"
        >
          <span className="icon">📊</span>
          {open && <span className="text">실시간 현황</span>}
        </NavLink>
      </nav>
      
      <div className="kiwoom-sidebar-footer">
        <button 
          onClick={onLogout}
          className="logout-btn"
          title="키움 API 로그아웃"
        >
          <span className="icon">🚪</span>
          {open && <span className="text">로그아웃</span>}
        </button>
      </div>
    </aside>
  );
};

export default KiwoomSidebar;