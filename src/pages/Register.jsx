import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Auth } from '../api/client'
import { useAuth } from '../context/AuthContext'
import GoogleSignInButton from '../components/GoogleSignInButton'

export default function Register() {
  const [step, setStep] = useState(1) // 1 = form, 2 = OTP
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', confirm: '' })
  const [photo, setPhoto] = useState(null)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const { login } = useAuth()
  const inputRefs = useRef([])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  // ─── Step 1: Request OTP ───────────────────────────────────
  const requestOtp = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) return setError('Les mots de passe ne correspondent pas')
    if (form.password.length < 8) return setError('Mot de passe minimum 8 caractères')
    setLoading(true)
    try {
      await Auth.registerRequestOtp({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
      })
      setStep(2)
      setCountdown(60)
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi du code')
    } finally {
      setLoading(false)
    }
  }

  // ─── Step 2: Verify OTP ────────────────────────────────────
  const verifyOtp = async (code) => {
    setError('')
    setLoading(true)
    try {
      const r = await Auth.registerVerifyOtp({ email: form.email, code })
      login(r.data.data.token, r.data.data.user)
      window.location.href = '/account'
    } catch (err) {
      setError(err.response?.data?.message || 'Code invalide')
      setOtp(['', '', '', '', '', ''])
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
      setLoading(false)
    }
  }

  // ─── Resend OTP ────────────────────────────────────────────
  const resendOtp = async () => {
    if (countdown > 0) return
    setError('')
    setLoading(true)
    try {
      await Auth.registerRequestOtp({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
      })
      setCountdown(60)
      setOtp(['', '', '', '', '', ''])
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du renvoi')
    } finally {
      setLoading(false)
    }
  }

  // ─── OTP Input handlers ────────────────────────────────────
  const handleOtpChange = (idx, val) => {
    if (val && !/^\d$/.test(val)) return
    const next = [...otp]
    next[idx] = val
    setOtp(next)

    if (val && idx < 5) {
      inputRefs.current[idx + 1]?.focus()
    }

    // Auto-submit when all 6 digits entered
    if (val && idx === 5 && next.every(d => d !== '')) {
      verifyOtp(next.join(''))
    }
  }

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus()
    }
  }

  const handleOtpPaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      e.preventDefault()
      const digits = text.split('')
      setOtp(digits)
      inputRefs.current[5]?.focus()
      verifyOtp(text)
    }
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-2xl font-black mx-auto mb-4">S</div>
          <h1 className="text-3xl font-black">
            {step === 1 ? 'Créer un compte' : 'Vérification'}
          </h1>
          <p className="text-slate-500 mt-1">
            {step === 1
              ? 'Rejoignez des milliers de clients'
              : <>Un code a été envoyé à <span className="text-indigo-400 font-medium">{form.email}</span></>
            }
          </p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* ─── STEP 1: Registration Form ─────────────────── */}
          {step === 1 && (
            <>
            <GoogleSignInButton onError={setError} />

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-slate-500 uppercase tracking-wide">ou</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <form onSubmit={requestOtp} className="space-y-4">
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
              <button type="submit" disabled={loading} className="w-full btn-primary py-3.5 disabled:opacity-50">
                {loading ? '⏳ Envoi du code...' : 'Continuer →'}
              </button>
            </form>
            </>
          )}

          {/* ─── STEP 2: OTP Verification ──────────────────── */}
          {step === 2 && (
            <div className="space-y-6">
              {/* OTP Input boxes */}
              <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => inputRefs.current[idx] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(idx, e)}
                    disabled={loading}
                    className="w-12 h-14 text-center text-2xl font-bold bg-white/5 border border-white/10 rounded-xl
                               focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all
                               text-white disabled:opacity-50"
                  />
                ))}
              </div>

              <p className="text-center text-sm text-slate-500">
                Entrez le code à 6 chiffres reçu par email
              </p>

              {/* Resend button */}
              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-sm text-slate-600">
                    Renvoyer dans <span className="text-indigo-400 font-semibold">{countdown}s</span>
                  </p>
                ) : (
                  <button
                    onClick={resendOtp}
                    disabled={loading}
                    className="text-sm text-indigo-400 hover:text-indigo-300 font-semibold disabled:opacity-50"
                  >
                    Renvoyer le code
                  </button>
                )}
              </div>

              {/* Back button */}
              <button
                onClick={() => { setStep(1); setOtp(['', '', '', '', '', '']); setError('') }}
                className="w-full text-center text-sm text-slate-500 hover:text-slate-400 transition-colors"
              >
                ← Modifier mes informations
              </button>
            </div>
          )}

          <p className="text-center text-sm text-slate-500 mt-6">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
