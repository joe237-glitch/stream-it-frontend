import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sit_user')) } catch { return null }
  })
  const [token, setToken] = useState(() => localStorage.getItem('sit_token'))

  const login = (tok, usr) => {
    localStorage.setItem('sit_token', tok)
    localStorage.setItem('sit_user', JSON.stringify(usr))
    setToken(tok)
    setUser(usr)
  }

  const logout = () => {
    localStorage.removeItem('sit_token')
    localStorage.removeItem('sit_user')
    setToken(null)
    setUser(null)
  }

  useEffect(() => {
    const handler = () => logout()
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [])

  const isAdmin = () => user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
