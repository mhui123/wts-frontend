import React from 'react';
import './App.css';
import Layout from './components/Layout';
import Health from './pages/Health';
import Login from './pages/Login';
import { getMe, logout, type Me } from './api/auth';

function App() {
  const [, setTick] = React.useState(0);
  const [me, setMe] = React.useState<Me | null>(null);
  React.useEffect(() => {
    const handler = () => setTick((v) => v + 1);
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  React.useEffect(() => {
    // Try to fetch current user
    getMe().then((user) => setMe(user)).catch(() => setMe(null));
  }, []);

  const handleLogin = () => { window.location.hash = '/login'; };
  const handleLogout = async () => {
    try { await logout(); } finally { setMe(null); }
  };

  return (
    <Layout me={me} onLogin={handleLogin} onLogout={handleLogout}>
      {renderRoute()}
    </Layout>
  );
}

function renderRoute() {
  const hash = window.location.hash.replace('#', '') || '/';
  switch (hash) {
    case '/':
      return (
        <div className="cards">
          <div className="card">
            <div className="card-title">Overview</div>
            <div className="card-body">Quick stats and summary.</div>
          </div>
          <div className="card">
            <div className="card-title">Recent Activity</div>
            <div className="card-body">No recent activity.</div>
          </div>
          <div className="card">
            <div className="card-title">System Health</div>
            <div className="card-body">All systems nominal.</div>
          </div>
        </div>
      );
    case '/health':
      return <Health />;
    case '/login':
      return <Login />;
    default:
      return <div>Not Found</div>;
  }
}

export default App;