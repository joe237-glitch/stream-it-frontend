import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Payments, Wallet } from '../api/client'
import { useToast } from '../components/Toast'

/**
 * PaymentReturn — handles the return from GeniusPay hosted checkout.
 *
 * URL: /payment/return?orderId=<id>&status=<success|failed>
 *
 * Behavior:
 *  - Calls /api/payments/:orderId/recheck (server-side reconciliation against provider).
 *  - If still pending → "confirmation en cours" UI. Webhook may confirm shortly after.
 *  - Polls recheck a few times before giving up gracefully (no false-failed).
 *  - A UI timeout NEVER produces a failed state.
 */
export default function PaymentReturn() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const orderId = params.get('orderId')
  const hint = params.get('status') // hint from provider redirect (informational only)

  const [state, setState] = useState('checking') // checking | success | failed | pending_confirmation
  const [error, setError] = useState('')
  const pollRef = useRef(0)
  const stopRef = useRef(false)

  useEffect(() => {
    if (!orderId) {
      setState('failed')
      setError('Référence de commande manquante')
      return
    }

    const tick = async () => {
      if (stopRef.current) return
      pollRef.current += 1
      try {
        const res = await Payments.recheck(orderId)
        const status = res.data.data?.status
        if (status === 'success') {
          stopRef.current = true
          setState('success')
          toast('Paiement confirmé !', 'success')
          // Refresh wallet balance silently (best-effort)
          Wallet.getBalance().catch(() => {})
        } else if (status === 'failed' || status === 'expired' || status === 'cancelled') {
          stopRef.current = true
          setState('failed')
          setError(`Paiement ${status}`)
        } else {
          // still pending — show neutral confirmation_en_cours and keep polling
          setState('pending_confirmation')
          if (pollRef.current < 8) {
            setTimeout(tick, 4000)
          }
          // After ~32s of polling we stop polling but DO NOT set 'failed'.
          // The user sees "confirmation en cours" and can refresh; the webhook
          // will reconcile asynchronously.
        }
      } catch (err) {
        // Network/server error during recheck — keep polling, never fail.
        if (pollRef.current < 8 && !stopRef.current) {
          setTimeout(tick, 4000)
        }
      }
    }

    tick()
    return () => { stopRef.current = true }
  }, [orderId])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#0f0f18] border border-white/10 rounded-3xl p-8 text-center shadow-2xl">
        {state === 'checking' && (
          <>
            <div className="w-16 h-16 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin mx-auto mb-4" />
            <p className="font-bold text-lg">Vérification de votre paiement…</p>
            <p className="text-slate-500 text-sm mt-1">Quelques instants.</p>
          </>
        )}

        {state === 'pending_confirmation' && (
          <>
            <div className="w-16 h-16 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin mx-auto mb-4" />
            <p className="font-bold text-lg">Confirmation en cours</p>
            <p className="text-slate-500 text-sm mt-2">
              Votre paiement est en cours de validation par votre opérateur.
              Cela peut prendre quelques minutes — vous serez crédité automatiquement.
            </p>
            <p className="text-slate-600 text-xs mt-4">
              Vous pouvez fermer cette page sans risque ; le crédit sera appliqué dès confirmation.
            </p>
            <button onClick={() => navigate('/account')} className="btn-secondary mt-6 w-full">
              Aller à mon compte
            </button>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <p className="font-bold text-xl text-emerald-400">Paiement confirmé</p>
            <p className="text-slate-500 text-sm mt-2">Votre commande a été enregistrée.</p>
            <button onClick={() => navigate('/account')} className="btn-primary mt-6 w-full">
              Voir mon compte
            </button>
          </>
        )}

        {state === 'failed' && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">!</span>
            </div>
            <p className="font-bold text-xl text-red-400">Paiement non abouti</p>
            <p className="text-slate-500 text-sm mt-2">{error || 'Le paiement n’a pas pu être validé.'}</p>
            <button onClick={() => navigate('/')} className="btn-secondary mt-6 w-full">
              Retour à l’accueil
            </button>
          </>
        )}
      </div>
    </div>
  )
}
