import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Publish from './pages/Publish'
import Detail from './pages/Detail'
import Profile from './pages/Profile'
import Admin from './pages/Admin'

function App() {
  const { token, fetchProfile } = useAuthStore()

  useEffect(() => {
    if (token) {
      fetchProfile().catch(() => {})
    }
  }, [token])

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/publish" element={<Publish />} />
        <Route path="/clothes/:id" element={<Detail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Layout>
  )
}

export default App
