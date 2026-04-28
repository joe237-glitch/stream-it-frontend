import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'
import { Payment, Wallet } from '../api/client'

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

// Props:
//   product  – single product object (standard buy)
//   cart     – [{product, quantity}] (cart checkout)
//   recharge – true → wallet top-up mode
export default function PaymentModal({ product, cart, recharge, onClose, onSuccess }) {
  const { user } = useAuth()
  const toast = useToast()
  const [step, setStep] = useState('form')
  const [country, setCountry] = useState('CM')
  const [service, setService] = useState(1)
  const [name, setName]   = useState(user ? `${user.first_name} ${user.last_name}` : '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState('')
  const [rechargeAmt, setRechargeAmt] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [failReason, setFailReason] = useState('')
  const [dots, setDots] = useState('.')
  const [walletBalance, setWalletBalance] = useState(null)
  const [walletLoading, setWalletLoading] = useState(false)
  const pollRef    = useRef(null)
  const sessionRef = useRef(0)

  const countryServices = SERVICES.filter(s => s.country === country)
  const selectedService = SERVICES.find(s => s.id === service) || SERVICES[0]

  // When country changes, auto-select first service of that country
  const handleCountryChange = (code) => {
    setCountry(code)
    const first = SERVICES.find(s => s.country === code)
    if (first) setService(first.id)
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    // Fetch wallet balance if logged in and not in recharge mode
    if (user && !recharge) {
      Wallet.getBalance()
        .then(res => setWalletBalance(parseFloat(res.data.data.balance) || 0))
        .catch(() => setWalletBalance(null))
    }
    return () => {
      document.body.style.overflow = ''
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  useEffect(() => {
    if (step !== 'waiting') return
    const id = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 600)
    return () => clearInterval(id)
  }, [step])

  const amountXAF = recharge
    ? (parseInt(rechargeAmt) || 0)
    : cart
      ? cart.reduce((s, i) => s + Math.round(i.product.price) * i.quantity, 0)
      : product ? Math.round(product.price) : 0

  const headerLabel = recharge
    ? 'Recharge portefeuille'
    : cart ? `Panier — ${cart.reduce((s,i)=>s+i.quantity,0)} article(s)`
    : product?.name || ''

  const headerSub = recharge
    ? 'Rechargez votre solde Stream-It'
    : `${amountXAF.toLocaleString()} XAF`

  const submit = async () => {
    if (!name.trim()) return setError('Veuillez entrer votre nom')
    if (!email.trim() || !email.includes('@')) return setError('Email invalide')
    if (phone.replace(/\D/g,'').length < 8) return setError('Numéro de téléphone invalide')
    if (recharge && amountXAF < 10) return setError('Montant minimum : 10 XAF')
    if (!recharge && amountXAF < 10) return setError('Montant trop faible')

    setError('')
    setLoading(true)
    setStep('waiting')
    const mySession = ++sessionRef.current

    try {
      const payload = {
        service,
        wallet:     phone.replace(/\D/g,''),
        amount:     amountXAF,
        payer:      name,
        payerEmail: email,
      }

      if (recharge) {
        payload.productName = `Recharge portefeuille ${amountXAF} XAF`
        payload.type = 'recharge'
      } else if (cart) {
        payload.productName = `Panier Stream-It (${cart.reduce((s,i)=>s+i.quantity,0)} articles)`
        payload.products = cart.map(i => ({ productId: i.product.id, quantity: i.quantity }))
        payload.type = 'cart'
      } else {
        payload.productName = `${product.name} – ${product.duration_label || product.duration_days + 'j'}`
        payload.productId = product.id
        payload.type = 'product'
      }

      const res = await Payment.pay(payload)
      if (sessionRef.current !== mySession) return
      const { orderId } = res.data
      startPolling(orderId, mySession)
    } catch (err) {
      if (sessionRef.current !== mySession) return
      setStep('failed')
      setFailReason(err.response?.data?.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const startPolling = (orderId, session) => {
    let count = 0
    pollRef.current = setInterval(async () => {
      if (sessionRef.current !== session) { clearInterval(pollRef.current); return }
      count++
      try {
        const res = await Payment.verify(orderId)
        const status = res.data.status?.toUpperCase()
        if (status === 'SUCCESS') {
          clearInterval(pollRef.current)
          setStep('success')
          toast(recharge ? 'Solde rechargé ! 🎉' : 'Paiement confirmé ! 🎉', 'success')
          setTimeout(() => { onSuccess?.(); onClose() }, 3000)
        } else if (status === 'FAILED') {
          clearInterval(pollRef.current)
          setStep('failed')
          setFailReason(res.data.message || 'Transaction annulée')
        }
      } catch {}
      if (count >= 36) {
        clearInterval(pollRef.current)
        setStep('failed')
        setFailReason('Délai dépassé. Vérifiez votre compte.')
      }
    }, 5000)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={e => { if(e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-md bg-[#0f0f18] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div>
            <p className="font-bold truncate max-w-[280px]">{headerLabel}</p>
            <p className="text-xs text-slate-500">{headerSub}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors flex-shrink-0">✕</button>
        </div>

        <div className="p-6">
          {step === 'form' && (
            <div className="space-y-4">

              {/* Recharge amount */}
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

              {/* Country selector */}
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

              {/* Service selector */}
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

              <input value={name}  onChange={e => setName(e.target.value)}  placeholder="Nom complet" className="input-field" />
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" className="input-field" />
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Numéro de téléphone" className="input-field" />

              {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</p>}

              {/* Wallet payment button (not for recharge) */}
              {!recharge && user && walletBalance !== null && (
                <button
                  onClick={async () => {
                    if (walletBalance < amountXAF) return
                    setWalletLoading(true)
                    setError('')
                    try {
                      const payload = product
                        ? { productId: product.id }
                        : { products: cart.map(i => ({ productId: i.product.id, quantity: i.quantity })) }
                      await Wallet.pay(payload)
                      setStep('success')
                      toast('Paiement par solde confirmé ! 🎉', 'success')
                      setTimeout(() => { onSuccess?.(); onClose() }, 3000)
                    } catch (err) {
                      setError(err.response?.data?.message || 'Erreur de paiement wallet')
                    } finally {
                      setWalletLoading(false)
                    }
                  }}
                  disabled={walletLoading || walletBalance < amountXAF}
                  className={`w-full py-3.5 text-sm font-bold rounded-2xl border transition-all ${
                    walletBalance >= amountXAF
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                      : 'bg-white/5 border-white/10 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {walletLoading ? '⏳ Paiement en cours...' :
                   walletBalance >= amountXAF
                    ? `💰 Payer avec mon solde (${walletBalance.toLocaleString()} XAF)`
                    : `💰 Solde insuffisant (${walletBalance.toLocaleString()} XAF)`}
                </button>
              )}

              {!recharge && user && walletBalance !== null && (
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <div className="flex-1 h-px bg-white/10" />
                  <span>ou payer par Mobile Money</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
              )}

              <button onClick={submit} disabled={loading || (recharge ? amountXAF < 10 : amountXAF < 100)}
                className="w-full btn-primary py-3.5 text-sm disabled:opacity-50">
                💳 {recharge ? `Recharger ${amountXAF >= 10 ? amountXAF.toLocaleString() + ' XAF' : ''}` : `Payer ${amountXAF.toLocaleString()} XAF`}
              </button>

              <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-600">
                <div>🔒 Sécurisé</div><div>⚡ Immédiat</div><div>💬 Support</div>
              </div>
            </div>
          )}

          {step === 'waiting' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin mx-auto" />
              <div>
                <p className="font-bold text-lg">Confirmez sur votre téléphone</p>
                <p className="text-slate-500 text-sm mt-1">Vérification{dots}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-xs text-slate-400">
                Validez la notification <span className="text-white font-semibold">{selectedService.name}</span> sur votre téléphone
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                <span className="text-3xl">✅</span>
              </div>
              <div>
                <p className="font-bold text-xl text-emerald-400">{recharge ? 'Solde rechargé !' : 'Paiement confirmé !'}</p>
                <p className="text-slate-500 text-sm mt-1">{recharge ? 'Votre solde a été mis à jour.' : 'Votre abonnement sera activé sous 5–15 minutes'}</p>
              </div>
            </div>
          )}

          {step === 'failed' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
                <span className="text-3xl">❌</span>
              </div>
              <div>
                <p className="font-bold text-xl text-red-400">Échec</p>
                <p className="text-slate-500 text-sm mt-1">{failReason}</p>
              </div>
              <button onClick={() => { setStep('form'); setError('') }} className="btn-secondary w-full">Réessayer</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
