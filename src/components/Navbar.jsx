import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useTheme } from '../context/ThemeContext'
import { useTranslation } from 'react-i18next'
import Avatar from './Avatar'

export default function Navbar() {
  const { user, isLoggedIn, isAdmin, logout } = useAuth()
  const { cartCount, setIsOpen } = useCart()
  const { theme, toggleTheme } = useTheme()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const toggleLang = () => {
    const next = i18n.language === 'fr' ? 'en' : 'fr'
    i18n.changeLanguage(next)
    localStorage.setItem('sit_lang', next)
  }

  const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false) }
  const closeMenu = () => setMenuOpen(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-xl bg-black/40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2" onClick={closeMenu}>
          <span className={`block ${theme === 'light' ? 'bg-slate-900 px-2.5 py-1 rounded-xl' : ''}`}>
            <img src="/img/logo.svg" alt="Stream-It" className="h-7" />
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {isAdmin() ? (
            <>
              <Link to="/admin" className="text-sm text-slate-400 hover:text-white transition-colors">Gestion</Link>
            </>
          ) : (
            <>
              <Link to="/" className="text-sm text-slate-400 hover:text-white transition-colors">{t('nav.shop')}</Link>
              {isLoggedIn && <Link to="/account" className="text-sm text-slate-400 hover:text-white transition-colors">{t('nav.account')}</Link>}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <button onClick={toggleLang} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase">
            {i18n.language === 'fr' ? 'EN' : 'FR'}
          </button>

          {/* Theme toggle — dark/light */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
            className={`w-9 h-9 rounded-full border-2 border-teal-400 flex items-center justify-center transition-all duration-300 ${theme === 'dark' ? 'bg-[#0a0a0f]' : 'bg-white'}`}
          >
            {theme === 'dark' ? (
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
              </svg>
            )}
          </button>

          {/* Cart button — hidden for admin */}
          {!isAdmin() && (
            <button onClick={() => setIsOpen(true)} className="relative w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
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
                <Avatar
                  src={user?.profile_photo}
                  name={`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email}
                  size="sm"
                  className="flex-shrink-0"
                />
                <span className="hidden lg:block">{user?.first_name}</span>
              </div>
              <button onClick={handleLogout} className="text-xs text-slate-500 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10">
                {t('nav.logout')}
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/login" className="text-sm text-slate-400 hover:text-white transition-colors">{t('nav.login')}</Link>
              <Link to="/register" className="btn-primary text-sm py-2 px-4">{t('nav.register')}</Link>
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
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" /></svg>
                Gestion
              </Link>
            </>
          ) : (
            <>
              <Link to="/" onClick={closeMenu} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75" /></svg>
                {t('nav.shop')}
              </Link>
              {isLoggedIn && (
                <Link to="/account" onClick={closeMenu} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                  {t('nav.account')}
                </Link>
              )}
            </>
          )}
          <div className="border-t border-white/5 pt-2 mt-1">
            {isLoggedIn ? (
              <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
                {t('nav.logout')}
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <Link to="/login" onClick={closeMenu} className="px-3 py-2.5 rounded-xl text-sm text-white font-semibold text-center bg-white/10 border border-white/20 hover:bg-white/15 transition-colors">
                  {t('nav.login')}
                </Link>
                <Link to="/register" onClick={closeMenu} className="btn-primary text-sm py-2.5 text-center block">
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
