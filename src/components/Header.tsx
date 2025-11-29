 

type HeaderProps = {
  onToggleSidebar: () => void;
  me?: { name?: string; email?: string } | null;
  onLogin?: () => void;
  onLogout?: () => void;
};

export default function Header({ onToggleSidebar, me, onLogin, onLogout }: HeaderProps) {
  const isAuthed = !!me;
  const displayName = `${me?.name} (${me?.email})` || 'Guest';
  const handleAuthClick = () => {
    if (isAuthed) {
      onLogout?.();
    } else {
      onLogin?.();
    }
  };

  return (
    <header className="topbar">
      <button className="menu-btn" onClick={onToggleSidebar} aria-label="Toggle sidebar">☰</button>
      <h1 className="topbar-title">Work Tracking System</h1>
      <div className="topbar-actions">
        <input className="topbar-search" placeholder="Search..." />
        <div className="user-pill">{displayName}</div>
        <button className="auth-btn" onClick={handleAuthClick}>
          {isAuthed ? 'Logout' : 'Login'}
        </button>
      </div>
    </header>
  );
}
