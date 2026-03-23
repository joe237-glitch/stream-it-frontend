import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Auth } from '../api/client'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const submit = async e => {
    e.preventDefault()
    if (password !== confirm) return setError('Les mots de passe ne correspondent pas')
    if (password.length < 8) return setError('Minimum 8 caractères')
    setError('')
    setLoading(true)
    try {
      await Auth.resetPassword({ token, password })
      setDone(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Lien invalide ou expiré.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400 font-bold mb-4">Lien invalide.</p>
          <Link to="/forgot-password" className="btn-primary text-sm py-2 px-6">Demander un nouveau lien</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-2xl font-black mx-auto mb-4">🔒</div>
          <h1 className="text-3xl font-black">Nouveau mot de passe</h1>
          <p className="text-slate-500 mt-1">Choisissez un mot de passe sécurisé</p>
        </div>

        <div className="card p-8">
          {done ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                <span className="text-3xl">✅</span>
              </div>
              <p className="font-bold text-emerald-400">Mot de passe mis à jour !</p>
              <p className="text-slate-500 text-sm">Redirection vers la connexion...</p>
            </div>
          ) : (
            <>
              {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">Nouveau mot de passe</label>
                  <div className="relative">
                    <input value={password} onChange={e => setPassword(e.target.value)} type={show ? 'text' : 'password'} placeholder="••••••••" required minLength={8} className="input-field pr-12" />
                    <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs">
                      {show ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">Confirmer</label>
                  <input value={confirm} onChange={e => setConfirm(e.target.value)} type={show ? 'text' : 'password'} placeholder="••••••••" required className="input-field" />
                </div>
                <button type="submit" disabled={loading} className="w-full btn-primary py-3.5 disabled:opacity-50">
                  {loading ? '⏳ Mise à jour...' : 'Changer le mot de passe →'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
