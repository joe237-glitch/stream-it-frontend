import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'
import { Payment, Wallet, Orders } from '../api/client'

// ─── Opérateurs Soleas Pay ───────────────────────────────────
// IDs numériques à passer en header "service" lors de l'appel API.
// IDs confirmés : MTN CM (1), Orange CM (2), Express Union CM (5).
// ⚠️  Les IDs des autres pays doivent être confirmés avec support@mysoleas.com
const COUNTRIES = [
  { code: 'CM',  flag: '🇨🇲', name: 'Cameroun' },
  { code: 'CI',  flag: '🇨🇮', name: "Côte d'Ivoire" },
  { code: 'SN',  flag: '🇸🇳', name: 'Sénégal' },
  { code: 'BF',  flag: '🇧🇫', name: 'Burkina Faso' },
  { code: 'BJ',  flag: '🇧🇯', name: 'Bénin' },
  { code: 'TG',  flag: '🇹🇬', name: 'Togo' },
  { code: 'COG', flag: '🇨🇬', name: 'Congo' },
  { code: 'GAB', flag: '🇬🇦', name: 'Gabon' },
  { code: 'UGA', flag: '🇺🇬', name: 'Ouganda' },
]

const SERVICES = [
  // ── Cameroun — IDs confirmés ──────────────────────────────
  { id: 1, name: 'MTN Mobile Money',  country: 'CM',  color: 'from-yellow-600 to-yellow-500', prefix: '6[57]' },
  { id: 2, name: 'Orange Money',      country: 'CM',  color: 'from-orange-600 to-orange-500', prefix: '6[89]' },
  { id: 5, name: 'Express Union',     country: 'CM',  color: 'from-blue-700 to-blue-600',     prefix: '6' },
  // ── Autres pays — IDs à confirmer avec support@mysoleas.com ──
  // Décommentez et renseignez l'ID correct après confirmation :
  // { id: ??, name: 'Orange Money',   country: 'CI',  color: 'from-orange-600 to-orange-500' },
  // { id: ??, name: 'MTN Money',      country: 'CI',  color: 'from-yellow-600 to-yellow-500' },
  // { id: ??, name: 'Orange Money',   country: 'SN',  color: 'from-orange-600 to-orange-500' },
  // { id: ??, name: 'Orange Money',   country: 'BF',  color: 'from-orange-600 to-orange-500' },
  // { id: ??, name: 'MTN Money',      country: 'BJ',  color: 'from-yellow-600 to-yellow-500' },
  // { id: ??, name: 'Moov Money',     country: 'TG',  color: 'from-blue-600 to-blue-500'    },
  // { id: ??, name: 'MTN Money',      country: 'COG', color: 'from-yellow-600 to-yellow-500' },
  // { id: ??, name: 'Airtel Money',   country: 'GAB', color: 'from-red-600 to-red-500'       },
  // { id: ??, name: 'MTN Money',      country: 'UGA', color: 'from-yellow-600 to-yellow-500' },
]

// Props:
//   product  – single product object (achat direct)
//   cart     – [{product, quantity}] (panier)
//   recharge – true → recharge wallet
export default function PaymentModal({ product, cart, recharge, onClose, onSuccess }) {
  const { user } = useAuth()
  const toast    = useToast()

  const [step, setStep]               = useState('form')
  const [country, setCountry]         = useState('CM')
  const [service, setService]         = useState(1)
  const [phone, setPhone]             = useState('')
  const [rechargeAmt, setRechargeAmt] = useState('')
  const [loading, setLoading]         = useState(false)
  const [walletLoading, setWalletLoading] = useState(false)
  const [error, setError]             = useState('')
  const [failReason, setFailReason]   = useState('')
  const [dots, setDots]               = useState('.')
  const [walletBalance, setWalletBalance] = useState(null)
  const pollRef    = useRef(null)
  const sessionRef = useRef(0)

  const countryServices   = SERVICES.filter(s => s.country === country)
  const selectedService   = SERVICES.find(s => s.id === service) || SERVICES[0]
  const hasServicesForCountry = countryServices.length > 0

  const handleCountryChange = (code) => {
    setCountry(code)
    const first = SERVICES.find(s => s.country === code)
    if (first) setService(first.id)
  }

  const amountXAF = recharge
    ? (parseInt(rechargeAmt) || 0)
    : cart
      ? cart.reduce((s, i) => s + Math.round(i.product.price) * i.quantity, 0)
      : product ? Math.round(product.price) : 0

  const headerLabel = recharge
    ? 'Recharge portefeuille'
    : cart ? `Panier — ${cart.reduce((s, i) => s + i.quantity, 0)} article(s)`
    : product?.name || ''

  const headerSub = recharge
    ? 'Rechargez votre solde Stream-It'
    : `${amountXAF.toLocaleString()} XAF`

  useEffect(() => {
    document.body.style.overflow = 'hidden'
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

  // ── Poll /payment/verify jusqu'à succès ou échec ───────────
  const startPolling = (orderId, session) => {
    let count = 0
    pollRef.current = setInterval(async () => {
      if (sessionRef.current !== session) { clearInterval(pollRef.current); return }
      count++
      try {
        const res    = await Payment.verify(orderId)
        const status = res.data.data?.status?.toLowerCase()
        if (status === 'success') {
          clearInterval(pollRef.current)
          setStep('success')
          toast(recharge ? 'Solde rechargé ! 🎉' : 'Paiement confirmé ! 🎉', 'success')
          setTimeout(() => { onSuccess?.(); onClose() }, 3000)
        } else if (status === 'failed' || status === 'cancelled') {
          clearInterval(pollRef.current)
          setStep('failed')
          setFailReason('Paiement annulé ou refusé. Réessayez.')
        }
      } catch { /* ignorer les erreurs réseau temporaires */ }
      if (count >= 36) { // 3 minutes timeout
        clearInterval(pollRef.current)
        setStep('failed')
        setFailReason('Délai dépassé. Si vous avez confirmé, vérifiez votre compte dans quelques minutes.')
      }
    }, 5000)
  }

  // ── Paiement Mobile Money (Soleas Pay push) ────────────────
  const submitMobileMoney = async () => {
    const cleanPhone = phone.replace(/\D/g, '')
    if (recharge && amountXAF < 500) return setError('Montant minimum : 500 XAF')
    if (!recharge && amountXAF < 100) return setError('Montant trop faible')
    if (cleanPhone.length < 8)        return setError('Numéro de téléphone invalide (min 8 chiffres)')
    if (!service)                     return setError('Sélectionnez un opérateur')

    setError('')
    setLoading(true)
    const mySession = ++sessionRef.current

    try {
      let orderId = null

      if (recharge) {
        // Recharge wallet : pas de commande, juste le push
        await Wallet.recharge({
          amount:  amountXAF,
          wallet:  cleanPhone,
          service: service,
        })
        // Pas de polling pour les recharges (webhook crédite le wallet)
        setStep('waiting')
      } else {
        // 1. Créer la commande
        const items = cart
          ? cart.map(i => ({ product_id: i.product.id, quantity: i.quantity }))
          : [{ product_id: product.id, quantity: 1 }]

        const orderRes = await Orders.create({ items })
        orderId = orderRes.data.data?.id
        const amount = parseFloat(orderRes.data.data?.total_amount) || amountXAF

        // 2. Initier le paiement push Soleas Pay
        await Payment.pay({
          order_id: orderId,
          amount,
          wallet:   cleanPhone,
          service:  service,
        })

        setStep('waiting')
        startPolling(orderId, mySession)
      }

    } catch (err) {
      if (sessionRef.current !== mySession) return
      setStep('form')
      setError(err.response?.data?.message || err.message || 'Erreur de connexion. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  // ── Paiement instantané par wallet ─────────────────────────
  const payWithWallet = async () => {
    setWalletLoading(true)
    setError('')
    try {
      const items = cart
        ? cart.map(i => ({ product_id: i.product.id, quantity: i.quantity }))
        : [{ product_id: product.id, quantity: 1 }]

      const orderRes = await Orders.create({ items })
      const orderId  = orderRes.data.data?.id

      await Wallet.pay({ order_id: orderId })

      setStep('success')
      toast('Paiement par solde confirmé ! 🎉', 'success')
      setTimeout(() => { onSuccess?.(); onClose() }, 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de paiement wallet')
    } finally {
      setWalletLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md bg-[#0f0f18] border border-white/10 rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0">
          <div>
            <p className="font-bold truncate max-w-[280px]">{headerLabel}</p>
            <p className="text-xs text-slate-500">{headerSub}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors flex-shrink-0"
          >✕</button>
        </div>

        <div className="p-6 overflow-y-auto">

          {/* ── FORM ──────────────────────────────────────── */}
          {step === 'form' && (
            <div className="space-y-4">

              {/* Montant de recharge */}
              {recharge && (
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Montant à recharger (XAF)</label>
                  <input
                    value={rechargeAmt}
                    onChange={e => setRechargeAmt(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ex: 5000"
                    className="input-field text-lg font-bold"
                    inputMode="numeric"
                  />
                  <p className="text-xs text-slate-600 mt-1">Minimum : 500 XAF</p>
                </div>
              )}

              {/* Résumé commande */}
              {!recharge && (
                <div className="bg-white/5 rounded-xl p-4 space-y-2">
                  {cart && cart.map((i, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-slate-400 truncate max-w-[200px]">{i.product.name} × {i.quantity}</span>
                      <span className="text-white font-medium ml-2 flex-shrink-0">
                        {(Math.round(i.product.price) * i.quantity).toLocaleString()} XAF
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="text-sm font-semibold text-slate-300">Total</span>
                    <span className="text-lg font-bold text-white">{amountXAF.toLocaleString()} XAF</span>
                  </div>
                </div>
              )}

              {/* Wallet pay */}
              {!recharge && user && walletBalance !== null && (
                <>
                  <button
                    onClick={payWithWallet}
                    disabled={walletLoading || walletBalance < amountXAF}
                    className={`w-full py-3.5 text-sm font-bold rounded-2xl border transition-all ${
                      walletBalance >= amountXAF
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                        : 'bg-white/5 border-white/10 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {walletLoading
                      ? '⏳ Traitement...'
                      : walletBalance >= amountXAF
                        ? `💰 Payer avec mon solde (${walletBalance.toLocaleString()} XAF)`
                        : `💰 Solde insuffisant (${walletBalance.toLocaleString()} XAF)`
                    }
                  </button>
                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <div className="flex-1 h-px bg-white/10" />
                    <span>ou payer par Mobile Money</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>
                </>
              )}

              {/* Pays */}
              <div>
                <label className="block text-xs text-slate-500 mb-2">Pays</label>
                <div className="flex gap-1.5 flex-wrap">
                  {COUNTRIES.map(c => {
                    const hasOps = SERVICES.some(s => s.country === c.code)
                    return (
                      <button
                        key={c.code}
                        onClick={() => hasOps && handleCountryChange(c.code)}
                        disabled={!hasOps}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                          country === c.code
                            ? 'border-indigo-500 bg-indigo-500/15 text-white'
                            : hasOps
                              ? 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                              : 'border-white/5 bg-white/3 text-slate-700 cursor-not-allowed'
                        }`}
                        title={!hasOps ? 'Bientôt disponible' : undefined}
                      >
                        {c.flag} {c.name}
                        {!hasOps && <span className="ml-1 text-[10px]">🔜</span>}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Opérateur */}
              {hasServicesForCountry && (
                <div>
                  <label className="block text-xs text-slate-500 mb-2">Opérateur</label>
                  <div className="grid grid-cols-2 gap-2">
                    {countryServices.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setService(s.id)}
                        className={`p-3 rounded-xl border text-sm font-semibold transition-all text-left ${
                          service === s.id
                            ? 'border-indigo-500 bg-indigo-500/10 text-white'
                            : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                        }`}
                      >
                        <span className={`inline-block w-2 h-2 rounded-full bg-gradient-to-br ${s.color} mr-2`} />
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Téléphone */}
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Numéro Mobile Money</label>
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder={country === 'CM' ? 'Ex: 699000000 ou 655000000' : 'Votre numéro Mobile Money'}
                  className="input-field"
                  inputMode="tel"
                  type="tel"
                />
                <p className="text-xs text-slate-600 mt-1">
                  Numéro associé à votre compte {selectedService?.name || 'Mobile Money'}
                </p>
              </div>

              {error && (
                <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  {error}
                </p>
              )}

              <button
                onClick={submitMobileMoney}
                disabled={
                  loading
                  || !hasServicesForCountry
                  || (recharge ? amountXAF < 500 : amountXAF < 100)
                  || phone.replace(/\D/g, '').length < 8
                }
                className="w-full btn-primary py-3.5 text-sm disabled:opacity-50"
              >
                {loading
                  ? '⏳ Envoi en cours...'
                  : recharge
                    ? `📱 Recharger${amountXAF >= 500 ? ` ${amountXAF.toLocaleString()} XAF` : ''}`
                    : `📱 Payer ${amountXAF.toLocaleString()} XAF`
                }
              </button>

              <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-600">
                <div>🔒 Sécurisé</div>
                <div>⚡ Immédiat</div>
                <div>💬 Support</div>
              </div>
            </div>
          )}

          {/* ── WAITING ───────────────────────────────────── */}
          {step === 'waiting' && (
            <div className="text-center py-8 space-y-5">
              <div className="w-16 h-16 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin mx-auto" />

              <div>
                <p className="font-bold text-lg">
                  {recharge ? 'Recharge en cours' : 'Confirmez sur votre téléphone'}
                  {dots}
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  {recharge
                    ? 'Votre solde sera crédité après confirmation.'
                    : `Validez la notification ${selectedService?.name || 'Mobile Money'} sur votre téléphone.`}
                </p>
              </div>

              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-sm space-y-1">
                <p className="text-indigo-300">
                  📲 Une notification a été envoyée au <span className="font-bold">{phone}</span>
                </p>
                <p className="text-xs text-slate-500">
                  Ouvrez votre application {selectedService?.name || 'Mobile Money'} et acceptez la demande de paiement.
                </p>
              </div>

              {recharge ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-600">
                    Votre solde sera crédité automatiquement après confirmation. Vous pouvez fermer cette fenêtre.
                  </p>
                  <button
                    onClick={() => { onSuccess?.(); onClose() }}
                    className="btn-secondary w-full text-sm"
                  >
                    Fermer
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-600">
                  Vérification automatique{dots} Ne fermez pas cette fenêtre.
                </p>
              )}
            </div>
          )}

          {/* ── SUCCESS ───────────────────────────────────── */}
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
                    : 'Votre abonnement sera activé sous quelques minutes.'}
                </p>
              </div>
            </div>
          )}

          {/* ── FAILED ────────────────────────────────────── */}
          {step === 'failed' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
                <span className="text-3xl">❌</span>
              </div>
              <div>
                <p className="font-bold text-xl text-red-400">Échec du paiement</p>
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
