import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'
import { Payment } from '../api/client'

const COUNTRIES = [
  { code: 'CM',  flag: '🇨🇲', name: 'Cameroun' },
  { code: 'CI',  flag: '🇨🇮', name: "Côte d'Ivoire" },
  { code: 'BF',  flag: '🇧🇫', name: 'Burkina Faso' },
  { code: 'BJ',  flag: '🇧🇯', name: 'Bénin' },
  { code: 'TG',  flag: '🇹🇬', name: 'Togo' },
  { code: 'COD', flag: '🇨🇩', name: 'RD Congo' },
  { code: 'COG', flag: '🇨🇬', name: 'Congo' },
  { code: 'GAB', flag: '🇬🇦', name: 'Gabon' },
  { code: 'UGA', flag: '🇺🇬', name: 'Ouganda' },
]

const SERVICES = [
  { id: 1,  name: 'MTN Mobile Money', country: 'CM',  color: 'from-yellow-600 to-yellow-500' },
  { id: 2,  name: 'Orange Money',     country: 'CM',  color: 'from-orange-600 to-orange-500' },
  { id: 29, name: 'Orange Money',     country: 'CI',  color: 'from-orange-600 to-orange-500' },
  { id: 30, name: 'MTN Money',        country: 'CI',  color: 'from-yellow-600 to-yellow-500' },
  { id: 31, name: 'Moov Money',       country: 'CI',  color: 'from-blue-600 to-blue-500' },
  { id: 32, name: 'Wave',             country: 'CI',  color: 'from-sky-600 to-sky-500' },
  { id: 33, name: 'Moov Money',       country: 'BF',  color: 'from-blue-600 to-blue-500' },
  { id: 34, name: 'Orange Money',     country: 'BF',  color: 'from-orange-600 to-orange-500' },
  { id: 35, name: 'MTN Money',        country: 'BJ',  color: 'from-yellow-600 to-yellow-500' },
  { id: 36, name: 'Moov Money',       country: 'BJ',  color: 'from-blue-600 to-blue-500' },
  { id: 37, name: 'T-Money',          country: 'TG',  color: 'from-red-600 to-red-500' },
  { id: 52, name: 'Vodacom',          country: 'COD', color: 'from-red-600 to-red-500' },
  { id: 53, name: 'Airtel Money',     country: 'COD', color: 'from-red-700 to-red-600' },
  { id: 54, name: 'Orange Money',     country: 'COD', color: 'from-orange-600 to-orange-500' },
  { id: 55, name: 'Airtel Money',     country: 'COG', color: 'from-red-600 to-red-500' },
  { id: 56, name: 'MTN Money',        country: 'COG', color: 'from-yellow-600 to-yellow-500' },
  { id: 57, name: 'Airtel Money',     country: 'GAB', color: 'from-red-600 to-red-500' },
  { id: 58, name: 'Airtel Money',     country: 'UGA', color: 'from-red-600 to-red-500' },
  { id: 59, name: 'MTN Money',        country: 'UGA', color: 'from-yellow-600 to-yellow-500' },
]

// Polling config :
// Phase active   : toutes les 5s pendant 3 min (36 polls)
// Premier check  : après 3s (pour Orange Money qui peut confirmer rapidement)
// Après timeout  : auto-recheck toutes les 20s jusqu'à fermeture manuelle
const POLL_INTERVAL_MS       = 5_000
const POLL_MAX_COUNT         = 36    // 36 × 5s = 3 minutes
const FIRST_CHECK_DELAY_MS   = 3_000 // premier check dès 3s après initiation
const AUTO_RECHECK_INTERVAL  = 20_000 // recheck auto post-timeout

/**
 * PaymentModal — flux paiement SoleasPay V3.
 *
 * Props :
 *   product  – produit unique
 *   cart     – [{product, quantity}] panier
 *   recharge – true → recharge portefeuille
 *   onClose  – ferme le modal
 *   onSuccess – callback après confirmation
 */
export default function PaymentModal({ product, cart, recharge, onClose, onSuccess }) {
  const { user } = useAuth()
  const toast    = useToast()

  // État du modal
  const [step,        setStep]        = useState('form')   // form | waiting | timeout | success | failed
  const [country,     setCountry]     = useState('CM')
  const [service,     setService]     = useState(1)
  const [name,        setName]        = useState(user ? `${user.first_name} ${user.last_name}` : '')
  const [email,       setEmail]       = useState(user?.email || '')
  const [phone,       setPhone]       = useState('')
  const [rechargeAmt, setRechargeAmt] = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [failReason,  setFailReason]  = useState('')
  const [dots,        setDots]        = useState('.')

  // Références
  const pollRef          = useRef(null)
  const autoRecheckRef   = useRef(null)  // recheck auto post-timeout
  const sessionRef       = useRef(0)
  const orderRefRef      = useRef(null)  // orderRef courant pour le bouton "Vérifier"

  const countryServices  = SERVICES.filter(s => s.country === country)
  const selectedService  = SERVICES.find(s => s.id === service) || SERVICES[0]

  const amountXAF = recharge
    ? (parseInt(rechargeAmt) || 0)
    : cart
      ? cart.reduce((s, i) => s + Math.round(i.product.price * 655 / 100) * i.quantity, 0)
      : product ? Math.round(product.price * 655 / 100) : 0

  const headerLabel = recharge
    ? 'Recharge portefeuille'
    : cart ? `Panier — ${cart.reduce((s,i)=>s+i.quantity,0)} article(s)`
    : product?.name || ''

  const headerSub = recharge
    ? 'Rechargez votre solde Stream-It'
    : `${amountXAF.toLocaleString()} XAF`

  // Nettoyage
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
      if (pollRef.current)        clearInterval(pollRef.current)
      if (autoRecheckRef.current) clearInterval(autoRecheckRef.current)
    }
  }, [])

  // Animation points d'attente
  useEffect(() => {
    if (step !== 'waiting') return
    const id = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 600)
    return () => clearInterval(id)
  }, [step])

  const handleCountryChange = (code) => {
    setCountry(code)
    const first = SERVICES.find(s => s.country === code)
    if (first) setService(first.id)
  }

  // ── Appel recheck via le serveur ────────────────────────────────────────────
  const doRecheck = useCallback(async (orderRef, session) => {
    if (sessionRef.current !== session) return null
    try {
      const res = await Payment.recheck(orderRef)
      return res.data?.status ?? 'pending'
    } catch {
      return 'pending'  // erreur réseau → on continue le polling
    }
  }, [])

  // ── Résolution terminale (succès / échec confirmé) ──────────────────────────
  const handleTerminalStatus = useCallback((status, message) => {
    if (pollRef.current)        clearInterval(pollRef.current)
    if (autoRecheckRef.current) clearInterval(autoRecheckRef.current)
    if (status === 'paid') {
      setStep('success')
      toast(recharge ? 'Solde rechargé ! 🎉' : 'Paiement confirmé ! 🎉', 'success')
      setTimeout(() => { onSuccess?.(); onClose() }, 3000)
    } else {
      setStep('failed')
      setFailReason(status === 'expired'
        ? 'Transaction expirée. Veuillez relancer un paiement.'
        : (message || 'Transaction annulée ou refusée par l\'opérateur.'))
    }
  }, [onClose, onSuccess, recharge, toast])

  // ── Polling actif : 36 × 5s = 3 min, avec premier check dès 3s ─────────────
  const startPolling = useCallback((orderRef, session) => {
    orderRefRef.current = orderRef
    let count = 0

    // Premier check rapide après 3s (Orange Money peut confirmer vite)
    const firstCheck = setTimeout(async () => {
      if (sessionRef.current !== session) return
      const status = await doRecheck(orderRef, session)
      if (sessionRef.current !== session) return
      if (status === 'paid' || status === 'failed' || status === 'expired') {
        handleTerminalStatus(status)
      }
    }, FIRST_CHECK_DELAY_MS)

    // Polling régulier toutes les 5s
    pollRef.current = setInterval(async () => {
      if (sessionRef.current !== session) { clearInterval(pollRef.current); return }
      count++

      const status = await doRecheck(orderRef, session)
      if (sessionRef.current !== session) return

      if (status === 'paid' || status === 'failed' || status === 'expired') {
        clearTimeout(firstCheck)
        handleTerminalStatus(status)
        return
      }

      // 3 minutes écoulées sans confirmation → mode timeout (non échec)
      if (count >= POLL_MAX_COUNT) {
        clearInterval(pollRef.current)
        setStep('timeout')

        // Auto-recheck toutes les 20s en arrière-plan — ne jamais afficher échec ici
        autoRecheckRef.current = setInterval(async () => {
          if (sessionRef.current !== session) { clearInterval(autoRecheckRef.current); return }
          const s = await doRecheck(orderRef, session)
          if (sessionRef.current !== session) return
          if (s === 'paid') {
            handleTerminalStatus('paid')
          }
          // Si 'failed' ou 'expired' dans l'auto-recheck → on ne bascule PAS en échec
          // Le job de réconciliation prendra le relais
        }, AUTO_RECHECK_INTERVAL)
      }
    }, POLL_INTERVAL_MS)
  }, [doRecheck, handleTerminalStatus])

  // ── Bouton "Actualiser le paiement" (après timeout) ────────────────────────
  const handleManualRecheck = async () => {
    const orderRef = orderRefRef.current
    if (!orderRef) return
    setLoading(true)
    try {
      const res = await Payment.recheck(orderRef)
      const status = res.data?.status ?? 'pending'
      if (status === 'paid') {
        setStep('success')
        toast(recharge ? 'Solde rechargé ! 🎉' : 'Paiement confirmé ! 🎉', 'success')
        setTimeout(() => { onSuccess?.(); onClose() }, 3000)
      } else if (status === 'failed' || status === 'expired') {
        setStep('failed')
        setFailReason(res.data?.message || 'Paiement non abouti.')
      } else {
        toast('Paiement toujours en cours de traitement…', 'info')
      }
    } catch {
      toast('Erreur de vérification. Réessayez.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // ── Soumission du formulaire ────────────────────────────────────────────────
  const submit = async () => {
    if (!name.trim())                                 return setError('Veuillez entrer votre nom')
    if (!email.trim() || !email.includes('@'))        return setError('Email invalide')
    if (phone.replace(/\D/g,'').length < 8)           return setError('Numéro de téléphone invalide')
    if (recharge && amountXAF < 10)                   return setError('Montant minimum : 10 XAF')
    if (!recharge && amountXAF < 10)                  return setError('Montant trop faible')

    setError('')
    setLoading(true)
    setStep('waiting')
    const mySession = ++sessionRef.current

    try {
      const payload = {
        service,
        wallet:     phone.replace(/\D/g, ''),
        amount:     amountXAF,
        payer:      name,
        payerEmail: email,
      }

      if (recharge) {
        payload.productName = `Recharge portefeuille ${amountXAF} XAF`
        payload.type = 'recharge'
      } else if (cart) {
        payload.productName = `Panier Stream-It (${cart.reduce((s,i)=>s+i.quantity,0)} articles)`
        payload.products    = cart.map(i => ({ productId: i.product.id, quantity: i.quantity }))
        payload.type = 'cart'
      } else {
        payload.productName = `${product.name} – ${product.duration_label || product.duration_days + 'j'}`
        payload.productId   = product.id
        payload.type = 'product'
      }

      // Appel création paiement — toute la logique métier est côté serveur
      const res = await Payment.create(payload)
      if (sessionRef.current !== mySession) return

      const orderRef = res.data?.orderRef
      if (!orderRef) throw new Error('orderRef manquant dans la réponse')

      startPolling(orderRef, mySession)

    } catch (err) {
      if (sessionRef.current !== mySession) return
      setStep('failed')
      setFailReason(err.response?.data?.message || 'Erreur de connexion. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  // ── Rendu ───────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md bg-[#0f0f18] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div>
            <p className="font-bold truncate max-w-[280px]">{headerLabel}</p>
            <p className="text-xs text-slate-500">{headerSub}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors flex-shrink-0"
          >✕</button>
        </div>

        <div className="p-6">

          {/* ── FORMULAIRE ── */}
          {step === 'form' && (
            <div className="space-y-4">
              {recharge && (
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Montant à recharger (XAF)</label>
                  <input
                    value={rechargeAmt}
                    onChange={e => setRechargeAmt(e.target.value.replace(/\D/g,''))}
                    placeholder="Ex: 5000"
                    className="input-field text-lg font-bold"
                    inputMode="numeric"
                  />
                  <p className="text-xs text-slate-600 mt-1">Minimum : 10 XAF</p>
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-500 mb-2">Pays</label>
                <div className="flex gap-1.5 flex-wrap">
                  {COUNTRIES.map(c => (
                    <button key={c.code} onClick={() => handleCountryChange(c.code)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${country === c.code ? 'border-indigo-500 bg-indigo-500/15 text-white' : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'}`}>
                      {c.flag} {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-2">Opérateur</label>
                <div className="grid grid-cols-2 gap-2">
                  {countryServices.map(s => (
                    <button key={s.id} onClick={() => setService(s.id)}
                      className={`p-3 rounded-xl border text-sm font-semibold transition-all text-left ${service === s.id ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'}`}>
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              <input value={name}  onChange={e => setName(e.target.value)}  placeholder="Nom complet"          className="input-field" />
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email"   className="input-field" />
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Numéro de téléphone" className="input-field" />

              {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</p>}

              <button
                onClick={submit}
                disabled={loading || (recharge ? amountXAF < 10 : amountXAF < 100)}
                className="w-full btn-primary py-3.5 text-sm disabled:opacity-50"
              >
                💳 {recharge
                  ? `Recharger ${amountXAF >= 10 ? amountXAF.toLocaleString() + ' XAF' : ''}`
                  : `Payer ${amountXAF.toLocaleString()} XAF`}
              </button>

              <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-600">
                <div>🔒 Sécurisé</div><div>⚡ Immédiat</div><div>💬 Support</div>
              </div>
            </div>
          )}

          {/* ── ATTENTE POLLING ── */}
          {step === 'waiting' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin mx-auto" />
              <div>
                <p className="font-bold text-lg">Confirmez sur votre téléphone</p>
                <p className="text-slate-500 text-sm mt-1">Vérification{dots}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-xs text-slate-400">
                Suivez les instructions <span className="text-white font-semibold">{selectedService.name}</span> sur votre téléphone
              </div>
            </div>
          )}

          {/* ── TIMEOUT : polling épuisé, vérification auto en cours ── */}
          {step === 'timeout' && (
            <div className="text-center py-8 space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <span className="text-3xl">⏳</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-amber-500/40 border-t-amber-400 animate-spin" />
              </div>
              <div>
                <p className="font-bold text-lg text-amber-400">Confirmation en cours</p>
                <p className="text-slate-500 text-sm mt-1">
                  Vérification automatique active — nous vous confirmerons dès que le paiement est validé.
                </p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300 text-left">
                ⚠️ <span className="font-semibold">N'effectuez pas un second paiement.</span><br />
                Si vous avez confirmé sur votre téléphone, votre paiement est en cours de traitement.
              </div>
              <button
                onClick={handleManualRecheck}
                disabled={loading}
                className="w-full btn-primary py-3 text-sm disabled:opacity-50"
              >
                {loading ? 'Vérification…' : '🔄 Vérifier maintenant'}
              </button>
            </div>
          )}

          {/* ── SUCCÈS ── */}
          {step === 'success' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                <span className="text-3xl">✅</span>
              </div>
              <div>
                <p className="font-bold text-xl text-emerald-400">
                  {recharge ? 'Solde rechargé !' : 'Paiement confirmé !'}
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  {recharge
                    ? 'Votre solde a été mis à jour.'
                    : 'Votre abonnement sera activé sous 5–15 minutes.'}
                </p>
              </div>
            </div>
          )}

          {/* ── ÉCHEC ── */}
          {step === 'failed' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
                <span className="text-3xl">❌</span>
              </div>
              <div>
                <p className="font-bold text-xl text-red-400">Échec</p>
                <p className="text-slate-500 text-sm mt-1">{failReason}</p>
              </div>
              <button
                onClick={() => { setStep('form'); setError('') }}
                className="btn-secondary w-full"
              >
                Réessayer
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
