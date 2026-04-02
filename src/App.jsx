import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { ToastProvider, useToast } from './components/Toast'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Account from './pages/Account'
import Admin from './pages/Admin'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Info from './pages/Info'
import SSOCallback from './pages/SSOCallback'
import OAuthCallback from './pages/OAuthCallback'
import { useEffect } from 'react'

/**
 * SessionExpiredBanner — Affiche un bandeau si la session a expiré.
 * Doit être à l'intérieur de AuthProvider + ToastProvider + BrowserRouter.
 */
function SessionExpiredBanner() {
  const { sessionExpired, dismissExpired } = useAuth()
  const toast    = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (sessionExpired) {
      toast('Votre session a expiré. Veuillez vous reconnecter.', 'warn')
      dismissExpired()
      navigate('/login')
    }
  }, [sessionExpired]) // eslint-disable-line

  return null
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
                <SessionExpiredBanner />
                <Navbar />
                <div className="flex-1">
                  <Routes>
                    <Route path="/"                element={<Home />} />
                    <Route path="/login"           element={<Login />} />
                    <Route path="/register"        element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password"  element={<ResetPassword />} />
                    <Route path="/info/:section"   element={<Info />} />
                    <Route path="/sso-callback"    element={<SSOCallback />} />
                    <Route path="/oauth-complete"  element={<OAuthCallback />} />
                    <Route path="/account"         element={<ProtectedRoute><Account /></ProtectedRoute>} />
                    <Route path="/admin"           element={<AdminRoute><Admin /></AdminRoute>} />
                  </Routes>
                </div>
                <Footer />
                <CartDrawer />
              </div>
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
