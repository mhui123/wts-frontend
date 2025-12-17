import { NavLink } from 'react-router-dom';

type SidebarProps = {
  open: boolean;
  onToggle: () => void;
  isAuthed?: boolean;
};

export default function Sidebar({ open, isAuthed = false }: SidebarProps) {
  return (
    <aside className={`sidebar ${open ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <span className="logo">⚙️ <span className="label">WTS</span></span>
        {/* <button className="sidebar-toggle" onClick={onToggle} aria-label="Toggle sidebar">
          {open ? '⟨⟨' : '⟩⟩'}
        </button> */}
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
          <NavLink className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} to="/kiwoom-api">
            <span className="icon">🔑</span>
            <span className="label">키움 API</span>
          </NavLink>
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
