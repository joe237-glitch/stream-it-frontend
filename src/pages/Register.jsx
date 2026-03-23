import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Auth } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'

export default function Register() {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', confirm: '' })
  const [photo, setPhoto] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async e => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) return setError('Les mots de passe ne correspondent pas')
    if (form.password.length < 8) return setError('Mot de passe minimum 8 caractères')
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('first_name', form.first_name)
      fd.append('last_name', form.last_name)
      fd.append('email', form.email)
      fd.append('password', form.password)
      if (photo) fd.append('profile_photo', photo)
      const r = await Auth.register(fd)
      login(r.data.data.token, r.data.data.user)
      window.location.href = '/account'
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création du compte')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-2xl font-black mx-auto mb-4">S</div>
          <h1 className="text-3xl font-black">Créer un compte</h1>
          <p className="text-slate-500 mt-1">Rejoignez des milliers de clients</p>
        </div>

        <div className="card p-8">
          {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}

          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">Prénom</label>
                <input value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="Jean" required className="input-field" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">Nom</label>
                <input value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Dupont" required className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">Email</label>
              <input value={form.email} onChange={e => set('email', e.target.value)} type="email" placeholder="votre@email.com" required className="input-field" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">Mot de passe</label>
              <input value={form.password} onChange={e => set('password', e.target.value)} type="password" placeholder="Minimum 8 caractères" required className="input-field" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">Confirmer</label>
              <input value={form.confirm} onChange={e => set('confirm', e.target.value)} type="password" placeholder="••••••••" required className="input-field" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">Photo de profil <span className="text-slate-700 normal-case">(optionnel)</span></label>
              <label className="flex items-center gap-3 cursor-pointer bg-white/5 border border-white/10 rounded-xl px-4 py-3 hover:border-white/20 transition-colors">
                <span>📸</span>
                <span className="text-sm text-slate-500">{photo?.name || 'Choisir une image'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => setPhoto(e.target.files[0])} />
              </label>
            </div>
            <button type="submit" disabled={loading} className="w-full btn-primary py-3.5 disabled:opacity-50">
              {loading ? '⏳ Création...' : 'Créer mon compte →'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
