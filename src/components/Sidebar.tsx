import React from 'react';

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
          <a className="nav-item active" href="#/">
            <span className="icon">📊</span>
            <span className="label">Dashboard</span>
          </a>
          <a className="nav-item" href="#/health">
            <span className="icon">🩺</span>
            <span className="label">Health</span>
          </a>
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
