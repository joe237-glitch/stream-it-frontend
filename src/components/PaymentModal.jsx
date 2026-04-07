import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'
import { Payment, Wallet, Orders } from '../api/client'

// Props:
//   product  – single product object (standard buy)
//   cart     – [{product, quantity}] (cart checkout)
//   recharge – true → wallet top-up mode
export default function PaymentModal({ product, cart, recharge, onClose, onSuccess }) {
  const { user } = useAuth()
  const toast = useToast()
  const [step, setStep] = useState('form')
  const [rechargeAmt, setRechargeAmt] = useState('')
  const [loading, setLoading] = useState(false)
  const [walletLoading, setWalletLoading] = useState(false)
  const [error, setError] = useState('')
  const [failReason, setFailReason] = useState('')
  const [dots, setDots] = useState('.')
  const [walletBalance, setWalletBalance] = useState(null)
  const [currentOrderId, setCurrentOrderId] = useState(null)
  const pollRef = useRef(null)
  const sessionRef = useRef(0)

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

  // ── Poll /payment/verify until success or failure ──────────
  const startPolling = (orderId, session) => {
    let count = 0
    pollRef.current = setInterval(async () => {
      if (sessionRef.current !== session) { clearInterval(pollRef.current); return }
      count++
      try {
        const res = await Payment.verify(orderId)
        const status = res.data.data?.status?.toLowerCase()
        if (status === 'success') {
          clearInterval(pollRef.current)
          setStep('success')
          toast('Paiement confirmé ! 🎉', 'success')
          setTimeout(() => { onSuccess?.(); onClose() }, 3000)
        } else if (status === 'failed' || status === 'cancelled') {
          clearInterval(pollRef.current)
          setStep('failed')
          setFailReason('Paiement annulé ou échoué. Réessayez.')
        }
      } catch { /* ignore network hiccups */ }
      if (count >= 36) { // 3 min timeout
        clearInterval(pollRef.current)
        setStep('failed')
        setFailReason('Délai dépassé. Si vous avez payé, vérifiez votre compte dans quelques minutes.')
      }
    }, 5000)
  }

  // ── Mobile Money via CinetPay hosted checkout ──────────────
  const submitMobileMoney = async () => {
    if (recharge && amountXAF < 500) return setError('Montant minimum : 500 XAF')
    if (!recharge && amountXAF < 100) return setError('Montant trop faible')

    setError('')
    setLoading(true)
    const mySession = ++sessionRef.current

    try {
      let paymentUrl = null
      let orderId = null

      if (recharge) {
        // Wallet top-up
        const res = await Wallet.recharge({
          amount: amountXAF,
          return_url: `${window.location.origin}/account?tab=wallet`,
        })
        paymentUrl = res.data.data?.payment_url
      } else {
        // 1. Create order
        const items = cart
          ? cart.map(i => ({ product_id: i.product.id, quantity: i.quantity }))
          : [{ product_id: product.id, quantity: 1 }]

        const orderRes = await Orders.create({ items })
        orderId = orderRes.data.data?.id
        const amount = parseFloat(orderRes.data.data?.total_amount) || amountXAF

        // 2. Initialize CinetPay payment
        const payRes = await Payment.pay({
          order_id: orderId,
          amount,
          return_url: `${window.location.origin}/account`,
        })
        paymentUrl = payRes.data.data?.payment_url
      }

      if (!paymentUrl) throw new Error('URL de paiement introuvable')

      // 3. Open CinetPay hosted checkout in a new window
      window.open(paymentUrl, 'cinetpay_checkout', 'width=650,height=700,scrollbars=yes,resizable=yes')

      setCurrentOrderId(orderId)
      setStep('waiting')
      if (orderId) startPolling(orderId, mySession)

    } catch (err) {
      if (sessionRef.current !== mySession) return
      setStep('form')
      setError(err.response?.data?.message || err.message || 'Erreur de connexion. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  // ── Instant wallet payment ─────────────────────────────────
  const payWithWallet = async () => {
    setWalletLoading(true)
    setError('')
    try {
      const items = cart
        ? cart.map(i => ({ product_id: i.product.id, quantity: i.quantity }))
        : [{ product_id: product.id, quantity: 1 }]

      const orderRes = await Orders.create({ items })
      const orderId = orderRes.data.data?.id

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

          {/* ── FORM STEP ─────────────────────────────────── */}
          {step === 'form' && (
            <div className="space-y-4">

              {/* Recharge amount */}
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

              {/* Order summary */}
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

              {error && (
                <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  {error}
                </p>
              )}

              {/* Wallet pay button */}
              {!recharge && user && walletBalance !== null && (
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
              )}

              {!recharge && user && walletBalance !== null && (
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <div className="flex-1 h-px bg-white/10" />
                  <span>ou payer par Mobile Money</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
              )}

              <button
                onClick={submitMobileMoney}
                disabled={loading || (recharge ? amountXAF < 500 : amountXAF < 100)}
                className="w-full btn-primary py-3.5 text-sm disabled:opacity-50"
              >
                {loading
                  ? '⏳ Initialisation...'
                  : recharge
                    ? `📱 Recharger${amountXAF >= 500 ? ` ${amountXAF.toLocaleString()} XAF` : ''}`
                    : '📱 Payer par Mobile Money'
                }
              </button>

              <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-600">
                <div>🔒 Sécurisé</div>
                <div>⚡ Immédiat</div>
                <div>💬 Support</div>
              </div>
            </div>
          )}

          {/* ── WAITING STEP ──────────────────────────────── */}
          {step === 'waiting' && (
            <div className="text-center py-8 space-y-5">
              <div className="w-16 h-16 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin mx-auto" />

              <div>
                <p className="font-bold text-lg">
                  {recharge ? 'Recharge en cours' : 'Vérification du paiement'}
                  {dots}
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  {recharge
                    ? 'Complétez le paiement dans la fenêtre CinetPay.'
                    : 'Nous vérifions votre paiement toutes les 5 secondes.'}
                </p>
              </div>

              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-sm text-indigo-300 space-y-1">
                <p>🌐 Une fenêtre de paiement CinetPay a été ouverte.</p>
                <p className="text-xs text-slate-500">Si elle n'est pas apparue, vérifiez les pop-ups bloqués dans votre navigateur.</p>
              </div>

              {recharge ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-600">Votre solde sera crédité automatiquement après paiement.</p>
                  <button
                    onClick={() => { onSuccess?.(); onClose() }}
                    className="btn-secondary w-full text-sm"
                  >
                    Fermer
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-600">
                  Ne fermez pas cette fenêtre. Redirection automatique après confirmation.
                </p>
              )}
            </div>
          )}

          {/* ── SUCCESS STEP ──────────────────────────────── */}
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

          {/* ── FAILED STEP ───────────────────────────────── */}
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
