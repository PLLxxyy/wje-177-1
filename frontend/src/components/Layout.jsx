import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const Layout = ({ children }) => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const hideNav = location.pathname === '/login' || location.pathname === '/register'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!hideNav && (
        <header style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '0 24px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <Link to="/" style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>
            衣换衣
          </Link>
          <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <Link to="/" style={{ color: 'white', opacity: 0.9 }}>首页</Link>
            {user ? (
              <>
                <Link to="/publish" style={{
                  background: 'rgba(255,255,255,0.25)',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  color: 'white'
                }}>+ 发布闲置</Link>
                <Link to="/profile" style={{ color: 'white', opacity: 0.9 }}>个人中心</Link>
                {user.role === 'admin' && (
                  <Link to="/admin" style={{ color: 'white', opacity: 0.9 }}>管理后台</Link>
                )}
                <button onClick={handleLogout} style={{
                  background: 'transparent',
                  color: 'white',
                  opacity: 0.9,
                  fontSize: '14px'
                }}>退出</button>
              </>
            ) : (
              <>
                <Link to="/login" style={{ color: 'white', opacity: 0.9 }}>登录</Link>
                <Link to="/register" style={{
                  background: 'rgba(255,255,255,0.25)',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  color: 'white'
                }}>注册</Link>
              </>
            )}
          </nav>
        </header>
      )}
      <main style={{ flex: 1 }}>{children}</main>
      {!hideNav && (
        <footer style={{
          background: '#333',
          color: '#999',
          textAlign: 'center',
          padding: '20px',
          fontSize: '13px'
        }}>
          © 2024 衣换衣 - 让闲置衣物焕发新生
        </footer>
      )}
    </div>
  )
}

export default Layout
