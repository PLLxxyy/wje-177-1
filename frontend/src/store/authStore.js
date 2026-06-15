import { create } from 'zustand'
import axios from 'axios'

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  
  setUser: (user) => set({ user }),
  setToken: (token) => {
    localStorage.setItem('token', token)
    set({ token })
  },
  
  login: async (username, password) => {
    const res = await axios.post('/api/login', { username, password })
    localStorage.setItem('token', res.data.token)
    set({ token: res.data.token, user: res.data.user })
    return res.data
  },
  
  register: async (username, password, nickname) => {
    const res = await axios.post('/api/register', { username, password, nickname })
    localStorage.setItem('token', res.data.token)
    set({ token: res.data.token, user: res.data.user })
    return res.data
  },
  
  logout: () => {
    localStorage.removeItem('token')
    set({ token: null, user: null })
  },
  
  fetchProfile: async () => {
    const res = await axios.get('/api/user/profile', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    set({ user: res.data })
    return res.data
  }
}))

export default useAuthStore
