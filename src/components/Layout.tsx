import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

type LayoutProps = {
  children: React.ReactNode;
  me?: { name?: string; email?: string } | null;
  onLogin?: () => void;
  onLogout?: () => void;
};

export default function Layout({ children, me, onLogin, onLogout }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const shellClasses = `dashboard-shell ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'} ${!me ? 'no-sidebar' : ''}`;
  return (
    <div className={shellClasses}>
      {me ? (
        <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} isAuthed={!!me} />
      ) : null}
      <div className="dashboard-main">
        <Header
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          me={me}
          onLogin={onLogin}
          onLogout={onLogout}
        />
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}
