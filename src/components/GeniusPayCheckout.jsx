import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'
import { Payments, Wallet } from '../api/client'

/**
 * GeniusPayCheckout — hosted-checkout flow.
 *
 * 1. Collect amount (recharge only) and confirm.
 * 2. Call /api/payments/create → backend creates order + provider payment.
 * 3. Redirect user to checkout_url (full-page navigation, no polling).
 * 4. On return (/payment/return), the PaymentReturn page calls recheck.
 *
 * Props (same as PaymentModal):
 *   product   – single product object
 *   cart      – [{product, quantity}]
 *   recharge  – true → wallet top-up
 *   onClose   – close modal callback
 *   onSuccess – not used here (success happens after redirect)
 */
const MIN_AMOUNT_XOF = 200

export default function GeniusPayCheckout({ product, cart, recharge, onClose }) {
  const { user } = useAuth()
  const toast = useToast()
  const [step, setStep] = useState('form') // form | redirecting
  const [rechargeAmt, setRechargeAmt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [walletBalance, setWalletBalance] = useState(null)
  const [walletLoading, setWalletLoading] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    if (user && !recharge) {
      Wallet.getBalance()
        .then(res => setWalletBalance(parseFloat(res.data.data.balance) || 0))
        .catch(() => setWalletBalance(null))
    }
    return () => { document.body.style.overflow = '' }
  }, [])

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
    : `${amountXAF.toLocaleString()} XOF`

  const submit = async () => {
    if (amountXAF < MIN_AMOUNT_XOF) {
      return setError(`Montant minimum : ${MIN_AMOUNT_XOF} XOF`)
    }
    setError('')
    setLoading(true)

    try {
      let payload
      if (recharge) {
        payload = { type: 'recharge', amount: amountXAF }
      } else if (cart) {
        payload = {
          type: 'cart',
          products: cart.map(i => ({ productId: i.product.id, quantity: i.quantity })),
        }
      } else {
        payload = { type: 'product', productId: product.id }
      }

      const res = await Payments.create(payload)
      const { checkout_url, orderId } = res.data.data || {}
      if (!checkout_url) {
        setError('Réponse provider invalide')
        setLoading(false)
        return
      }

      // Persist a hint for the return page (in case the redirect strips state)
      try { sessionStorage.setItem('sit_pending_payment', JSON.stringify({ orderId, ts: Date.now() })) } catch {}

      setStep('redirecting')
      // Full-page redirect to GeniusPay hosted checkout.
      window.location.href = checkout_url
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création du paiement')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={e => { if(e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-md bg-[#0f0f18] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
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
              {recharge && (
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Montant à recharger (XOF)</label>
                  <input
                    value={rechargeAmt}
                    onChange={e => setRechargeAmt(e.target.value.replace(/\D/g,''))}
                    placeholder="Ex: 5000"
                    className="input-field text-lg font-bold"
                    inputMode="numeric"
                  />
                  <p className="text-xs text-slate-600 mt-1">Minimum : {MIN_AMOUNT_XOF} XOF</p>
                </div>
              )}

              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-400 space-y-2">
                <p className="font-semibold text-slate-200">Paiement sécurisé</p>
                <p>Vous serez redirigé vers la page de paiement pour choisir votre opérateur (Mobile Money, carte bancaire…).</p>
                <p>Suivez les instructions de votre opérateur pour confirmer le paiement.</p>
              </div>

              {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</p>}

              {/* Wallet payment button (not for recharge) */}
              {!recharge && user && walletBalance !== null && (
                <>
                  <button
                    onClick={async () => {
                      if (walletBalance < amountXAF) return
                      setWalletLoading(true); setError('')
                      try {
                        const payload = product
                          ? { productId: product.id }
                          : { products: cart.map(i => ({ productId: i.product.id, quantity: i.quantity })) }
                        await Wallet.pay(payload)
                        toast('Paiement par solde confirmé !', 'success')
                        setTimeout(() => { onClose() }, 1500)
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
                    {walletLoading ? 'Paiement en cours...' :
                     walletBalance >= amountXAF
                      ? `Payer avec mon solde (${walletBalance.toLocaleString()} XOF)`
                      : `Solde insuffisant (${walletBalance.toLocaleString()} XOF)`}
                  </button>
                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <div className="flex-1 h-px bg-white/10" />
                    <span>ou paiement en ligne</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>
                </>
              )}

              <button
                onClick={submit}
                disabled={loading || amountXAF < MIN_AMOUNT_XOF}
                className="w-full btn-primary py-3.5 text-sm disabled:opacity-50"
              >
                {loading
                  ? 'Préparation du paiement…'
                  : recharge
                    ? `Recharger ${amountXAF >= MIN_AMOUNT_XOF ? amountXAF.toLocaleString() + ' XOF' : ''}`
                    : `Payer ${amountXAF.toLocaleString()} XOF`}
              </button>

              <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-600">
                <div>Sécurisé</div><div>Rapide</div><div>Support</div>
              </div>
            </div>
          )}

          {step === 'redirecting' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin mx-auto" />
              <div>
                <p className="font-bold text-lg">Redirection en cours…</p>
                <p className="text-slate-500 text-sm mt-1">Vous allez être conduit vers la page de paiement.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
