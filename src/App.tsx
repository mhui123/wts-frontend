import { useEffect, useState } from 'react'
import { Link, Route, Routes, useNavigate } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Health from './pages/Health'
import Login from './pages/Login'
import { getMe, type Me } from './api/auth'
import api from './api/client'

function App() {
  const [count, setCount] = useState(0);
  const [isAuthed, setIsAuthed] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const navigate = useNavigate();

  // On first mount (including after OAuth redirect), try to fetch current user using cookies
  useEffect(() => {
    getMe()
      .then((me) => {
  try { localStorage.setItem('user', JSON.stringify(me)); } catch (e) { void e; /* ignore storage quota/private mode */ }
        setMe(me);
        setIsAuthed(true);
        setStatusMsg('');
        // Optionally navigate away from login if currently on it
      })
      .catch(() => {
        // not logged in or endpoint missing; ignore
        setMe(null);
        setIsAuthed(false);
        setStatusMsg('');
      });
  }, []);

  const authLabel = isAuthed ? '로그아웃' : '로그인';
  const handleAuthClick = async () => {
    if (isAuthed) {
      // Attempt to logout on server (endpoint may vary)
      try {
        const res = await api.post('/account/logout');
        const ok = res?.data === 'logged_out' || res?.status === 200;
        if (ok) {
          setStatusMsg('로그아웃 되었습니다');
        }
      } catch {
        try {
          const res2 = await api.post('/logout');
          const ok2 = res2?.data === 'logged_out' || res2?.status === 200;
          if (ok2) setStatusMsg('로그아웃 되었습니다');
        } catch {
          // If logout endpoint fails, still clear local state
          setStatusMsg('');
        }
      }
      try { localStorage.removeItem('user'); } catch (e) { void e; }
      setMe(null);
      setIsAuthed(false);
      // Stay on current page so the user sees the message
    } else {
      navigate('/login');
    }
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={<Login />}
      />
      <Route
        path="/*"
        element={
          <>
            {/* Top Navigation Bar */}
            <header
              style={{
                position: 'sticky',
                top: 0,
                background: '#fff',
                borderBottom: '1px solid #eee',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 10,
              }}
            >
              <nav style={{ display: 'flex', gap: 12 }}>
                <Link to="/">Home</Link>
                <Link to="/health">Health</Link>
              </nav>
              <button
                onClick={handleAuthClick}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'blue',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                {authLabel}
              </button>
            </header>

            <div>
              <a href="https://vite.dev" target="_blank">
                <img src={viteLogo} className="logo" alt="Vite logo" />
              </a>
              <a href="https://react.dev" target="_blank">
                <img src={reactLogo} className="logo react" alt="React logo" />
              </a>
            </div>
            <div className="resultPlace" style={{ margin: '12px 0', textAlign: 'center', color: '#333' }}>
              {statusMsg ? (
                <span>{statusMsg}</span>
              ) : me ? (
                <span>
                  {me.name ?? ''}
                  {me.name && me.email ? ' ' : ''}
                  {me.email ? `(${me.email})` : ''}
                </span>
              ) : (
                <span></span>
              )}
            </div>
            <h1>WTS Frontend</h1>
            <div className="card">
              <button onClick={() => setCount((count) => count + 1)}>
                count is {count}
              </button>
              <p className='resultplace'>
                Edit <code>src/App.tsx</code> and save to test HMR
              </p>
            </div>
            <Routes>
              <Route path="/health" element={<Health />} />
              <Route path="/" element={<div>Home page</div>} />
            </Routes>
            <p className="read-the-docs">
              Click on the Vite and React logos to learn more
            </p>
          </>
        }
      />
    </Routes>
  );
}

export default App