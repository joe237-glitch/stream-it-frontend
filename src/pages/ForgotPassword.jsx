import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Auth } from '../api/client'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [devLink, setDevLink] = useState('')

  const submit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const r = await Auth.forgotPassword({ email })
      setSent(true)
      if (r.data._dev_resetUrl) setDevLink(r.data._dev_resetUrl)
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-2xl font-black mx-auto mb-4">🔑</div>
          <h1 className="text-3xl font-black">Mot de passe oublié</h1>
          <p className="text-slate-500 mt-1">Entrez votre email pour recevoir un lien de réinitialisation</p>
        </div>

        <div className="card p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                <span className="text-3xl">✅</span>
              </div>
              <p className="font-bold text-emerald-400">Email envoyé !</p>
              <p className="text-slate-500 text-sm">Si cet email est enregistré, vous recevrez un lien dans quelques instants.</p>
              {devLink && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-left">
                  <p className="text-xs text-yellow-400 font-bold mb-1">Mode développement — lien direct :</p>
                  <a href={devLink} className="text-xs text-indigo-400 break-all hover:underline">{devLink}</a>
                </div>
              )}
              <Link to="/login" className="btn-primary block py-3 text-sm text-center mt-2">Retour à la connexion</Link>
            </div>
          ) : (
            <>
              {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">Email</label>
                  <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="votre@email.com" required className="input-field" />
                </div>
                <button type="submit" disabled={loading} className="w-full btn-primary py-3.5 disabled:opacity-50">
                  {loading ? '⏳ Envoi...' : 'Envoyer le lien →'}
                </button>
              </form>
              <p className="text-center text-sm text-slate-500 mt-6">
                <Link to="/login" className="text-indigo-400 hover:text-indigo-300">← Retour à la connexion</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
