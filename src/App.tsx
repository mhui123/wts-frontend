import { useState } from 'react'
import { Link, Route, Routes, useNavigate } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Health from './pages/Health'
import Login from './pages/Login'

function App() {
  const [count, setCount] = useState(0);
  const navigate = useNavigate();

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
            <div>
              <a href="https://vite.dev" target="_blank">
                <img src={viteLogo} className="logo" alt="Vite logo" />
              </a>
              <a href="https://react.dev" target="_blank">
                <img src={reactLogo} className="logo react" alt="React logo" />
              </a>
            </div>
            <h1>WTS Frontend</h1>
            <div className="card">
              <button onClick={() => setCount((count) => count + 1)}>
                count is {count}
              </button>
              <p>
                Edit <code>src/App.tsx</code> and save to test HMR
              </p>
            </div>
            <nav style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <Link to="/">Home</Link>
              <Link to="/health">Health</Link>
              <button
                onClick={() => navigate('/login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'blue',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0
                }}
              >
                로그인
              </button>
            </nav>
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