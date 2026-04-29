import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { ToastProvider, useToast } from './components/Toast'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import ChatBot from './components/ChatBot'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Account from './pages/Account'
import Admin from './pages/Admin'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Info from './pages/Info'
import ProductDetail from './pages/ProductDetail'
import SSOCallback from './pages/SSOCallback'
import OAuthCallback from './pages/OAuthCallback'
import PaymentReturn from './pages/PaymentReturn'
import PaymentCoverage from './pages/PaymentCoverage'
import AdminObservability from './pages/AdminObservability'
import { useEffect, lazy, Suspense } from 'react'

// Lazy chunk 3D : R3F + drei + three + postprocessing + detect-gpu sont
// uniquement téléchargés si l'utilisateur visite /3d-store. Le flag
// VITE_STORE_3D_ENABLED='false' coupe la route côté composant (kill-switch).
const Store3D = lazy(() => import('./pages/Store3D/Store3D'))

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
              <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-page)', color: 'var(--text-1)', transition: 'background 0.3s, color 0.3s' }}>
                <SessionExpiredBanner />
                <Navbar />
                <div className="flex-1">
                  <Routes>
                    <Route path="/"                element={<Home />} />
                    <Route path="/product/:id"     element={<ProductDetail />} />
                    <Route path="/login"           element={<Login />} />
                    <Route path="/register"        element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password"  element={<ResetPassword />} />
                    <Route path="/info/:section"   element={<Info />} />
                    <Route path="/sso-callback"    element={<SSOCallback />} />
                    <Route path="/oauth-complete"  element={<OAuthCallback />} />
                    <Route path="/payment/return"     element={<PaymentReturn />} />
                    <Route path="/payment-coverage"   element={<PaymentCoverage />} />
                    <Route path="/account"         element={<ProtectedRoute><Account /></ProtectedRoute>} />
                    <Route path="/admin"               element={<AdminRoute><Admin /></AdminRoute>} />
                    <Route path="/admin/observability" element={<AdminRoute><AdminObservability /></AdminRoute>} />
                    <Route
                      path="/3d-store"
                      element={
                        <Suspense fallback={<div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9aa0c0' }}>Chargement de la boutique 3D…</div>}>
                          <Store3D />
                        </Suspense>
                      }
                    />
                  </Routes>
                </div>
                <Footer />
                <ChatBot />
                <CartDrawer />
              </div>
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
