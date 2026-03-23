import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function hasToken() {
  return !!(localStorage.getItem('sit_token'))
}

export function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth()
  return (isLoggedIn || hasToken()) ? children : <Navigate to="/login" replace />
}

export function AdminRoute({ children }) {
  const { isLoggedIn, isAdmin } = useAuth()
  const loggedIn = isLoggedIn || hasToken()
  if (!loggedIn) return <Navigate to="/login" replace />
  if (!isAdmin()) return <Navigate to="/" replace />
  return children
}
