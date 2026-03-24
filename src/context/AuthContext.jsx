import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sit_user')) } catch { return null }
  })
  const [token, setToken]                   = useState(() => localStorage.getItem('sit_token'))
  const [sessionExpired, setSessionExpired] = useState(false)

  // ─── Login ────────────────────────────────────────────────
  const login = useCallback((tok, usr) => {
    localStorage.setItem('sit_token', tok)
    localStorage.setItem('sit_user', JSON.stringify(usr))
    setToken(tok)
    setUser(usr)
    setSessionExpired(false)
  }, [])

  // ─── Logout ───────────────────────────────────────────────
  const logout = useCallback((reason = 'manual') => {
    localStorage.removeItem('sit_token')
    localStorage.removeItem('sit_user')
    setToken(null)
    setUser(null)
    if (reason === 'session_expired') {
      setSessionExpired(true)
    }
  }, [])

  // ─── Dismiss session expired banner ───────────────────────
  const dismissExpired = useCallback(() => setSessionExpired(false), [])

  // ─── Listen for 401 auto-logout event ─────────────────────
  useEffect(() => {
    const handler = (e) => {
      const reason = e?.detail?.reason || 'session_expired'
      logout(reason)
    }
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [logout])

  const isAdmin = () => user?.role === 'admin'

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      isAdmin,
      isLoggedIn:     !!token,
      sessionExpired,
      dismissExpired,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
