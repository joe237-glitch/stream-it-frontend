import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Auth } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const redirect = new URLSearchParams(location.search).get('redirect') || '/account'

  const submit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const r = await Auth.login({ email, password })
      const user = r.data.data.user
      login(r.data.data.token, user)
      // Admin goes to dashboard, client goes to account
      window.location.href = user.role === 'admin' ? '/admin' : redirect
    } catch (err) {
      setError(err.response?.data?.message || 'Identifiants incorrects')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-2xl font-black mx-auto mb-4">S</div>
          <h1 className="text-3xl font-black">Connexion</h1>
          <p className="text-slate-500 mt-1">Accédez à vos abonnements</p>
        </div>

        <div className="card p-8">
          {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="votre@email.com" required className="input-field" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">Mot de passe</label>
              <div className="relative">
                <input value={password} onChange={e => setPassword(e.target.value)} type={show ? 'text' : 'password'} placeholder="••••••••" required className="input-field pr-12" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs transition-colors">
                  {show ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full btn-primary py-3.5 disabled:opacity-50">
              {loading ? '⏳ Connexion...' : 'Se connecter →'}
            </button>
          </form>

          <div className="flex items-center justify-between text-sm mt-6">
            <Link to="/forgot-password" className="text-slate-500 hover:text-slate-300 transition-colors text-xs">Mot de passe oublié ?</Link>
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold">Créer un compte</Link>
          </div>
        </div>

        <p className="text-center mt-6">
          <Link to="/" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">← Retour à la boutique</Link>
        </p>
      </div>
    </div>
  )
}
