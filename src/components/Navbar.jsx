import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Navbar() {
  const { user, isLoggedIn, isAdmin, logout } = useAuth()
  const { cartCount, setIsOpen } = useCart()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false) }
  const closeMenu = () => setMenuOpen(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-xl bg-black/40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2" onClick={closeMenu}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-xs font-black">S</div>
          <span className="font-black text-lg tracking-tight">Stream<span className="text-indigo-400">-It</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {isAdmin() ? (
            <>
              <Link to="/admin" className="text-sm text-slate-400 hover:text-white transition-colors">Dashboard</Link>
              <Link to="/" className="text-sm text-slate-400 hover:text-white transition-colors">Voir la boutique</Link>
            </>
          ) : (
            <>
              <Link to="/" className="text-sm text-slate-400 hover:text-white transition-colors">Boutique</Link>
              {isLoggedIn && <Link to="/account" className="text-sm text-slate-400 hover:text-white transition-colors">Mon compte</Link>}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Cart button — hidden for admin */}
          {!isAdmin() && (
            <button onClick={() => setIsOpen(true)} className="relative w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
              <span className="text-lg">🛒</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] text-[10px] font-black bg-indigo-500 text-white rounded-full flex items-center justify-center px-1">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>
          )}

          {/* Desktop auth */}
          {isLoggedIn ? (
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {user?.profile_photo
                    ? <img src={user.profile_photo} alt="avatar" className="w-full h-full object-cover" />
                    : <>{user?.first_name?.[0]}{user?.last_name?.[0]}</>
                  }
                </div>
                <span className="hidden lg:block">{user?.first_name}</span>
              </div>
              <button onClick={handleLogout} className="text-xs text-slate-500 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10">
                Déconnexion
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/login" className="text-sm text-slate-400 hover:text-white transition-colors">Connexion</Link>
              <Link to="/register" className="btn-primary text-sm py-2 px-4">Créer un compte</Link>
            </div>
          )}

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="sm:hidden w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            aria-label="Menu"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-white/5 bg-black/90 backdrop-blur-xl px-4 py-3 space-y-1">
          {isAdmin() ? (
            <>
              <Link to="/admin" onClick={closeMenu} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                ⚙️ Dashboard
              </Link>
              <Link to="/" onClick={closeMenu} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                🏪 Voir la boutique
              </Link>
            </>
          ) : (
            <>
              <Link to="/" onClick={closeMenu} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                🏪 Boutique
              </Link>
              {isLoggedIn && (
                <Link to="/account" onClick={closeMenu} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                  👤 Mon compte
                </Link>
              )}
            </>
          )}
          <div className="border-t border-white/5 pt-2 mt-1">
            {isLoggedIn ? (
              <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                🚪 Déconnexion
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <Link to="/login" onClick={closeMenu} className="px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                  Connexion
                </Link>
                <Link to="/register" onClick={closeMenu} className="btn-primary text-sm py-2.5 text-center block">
                  Créer un compte
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
