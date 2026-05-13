import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Payments, Wallet } from '../api/client'
import { useToast } from '../components/Toast'

/**
 * PaymentReturn — Stream-It-side confirmation page for the two-tab pattern.
 *
 * URL: /payment/return?orderId=<id>[&status=success|failed]
 *
 * Flow (the "two tabs" trick):
 *   - The checkout modal opens GeniusPay in a NEW tab via window.open.
 *   - The ORIGINAL tab is navigated here (current tab stays on stream-it.shop).
 *   - This page polls /api/payments/:orderId/recheck every 3.5s.
 *   - The webhook is the only source of truth — this page only reads status,
 *     it never marks an order as paid by itself.
 *
 * States:
 *   - checking            initial reconciliation
 *   - pending_confirmation webhook hasn't landed yet; soft "still verifying"
 *   - success              terminal — wallet/order updated
 *   - failed               terminal — only when backend says so explicitly
 *   - support              60s elapsed without webhook; show reference + contact
 *
 * A UI timeout NEVER produces a 'failed' state — only the backend can.
 */
export default function PaymentReturn() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const orderId = params.get('orderId')

  const [state, setState] = useState('checking')
  const [error, setError] = useState('')
  const pollRef = useRef(0)
  const stopRef = useRef(false)
  const startedAtRef = useRef(Date.now())

  // Poll cadence — matches the spec (3.5s) so users see the success state
  // within a few seconds of the webhook landing.
  const POLL_INTERVAL_MS = 3500
  // After 60s without a terminal status we surface a "we're still verifying"
  // screen with the reference and a support contact. This does NOT mark the
  // payment as failed — the webhook remains the authority.
  const SUPPORT_TIMEOUT_MS = 60 * 1000
  // Hard polling cap. Beyond this we stop hammering the API; the user can
  // refresh the page or check their wallet later.
  const MAX_POLLS = 60  // ≈ 3.5 min of network traffic

  useEffect(() => {
    if (!orderId) {
      setState('failed')
      setError('Référence de commande manquante')
      return
    }

    const tick = async () => {
      if (stopRef.current) return
      pollRef.current += 1
      const elapsed = Date.now() - startedAtRef.current

      try {
        const res = await Payments.recheck(orderId)
        // CRITICAL: re-check stopRef after the await. If checkNow() (manual
        // verify) raced ahead and already set state=success while we were
        // waiting on the network, this stale tick must NOT overwrite the
        // terminal state with pending_confirmation. Same guard for unmount
        // (StrictMode double-mount, navigation, etc.).
        if (stopRef.current) return
        const status = res.data.data?.status

        if (status === 'success') {
          stopRef.current = true
          setState('success')
          try { sessionStorage.removeItem('sit_pending_payment') } catch { /* ignore */ }
          toast?.('Paiement confirmé', 'success')
          // Refresh wallet balance silently (best-effort)
          Wallet.getBalance().catch(() => {})
          return
        }

        if (status === 'failed' || status === 'expired' || status === 'cancelled') {
          stopRef.current = true
          setState('failed')
          setError(`Paiement ${status}`)
          try { sessionStorage.removeItem('sit_pending_payment') } catch { /* ignore */ }
          return
        }

        // Still pending — webhook hasn't landed yet.
        if (elapsed > SUPPORT_TIMEOUT_MS) {
          setState('support')
        } else {
          setState('pending_confirmation')
        }

        if (pollRef.current < MAX_POLLS) {
          setTimeout(tick, POLL_INTERVAL_MS)
        }
      } catch {
        // Network/server error during recheck — keep polling, never fail.
        if (pollRef.current < MAX_POLLS && !stopRef.current) {
          setTimeout(tick, POLL_INTERVAL_MS)
        }
      }
    }

    tick()
    return () => { stopRef.current = true }
  }, [orderId])

  const checkNow = async () => {
    if (!orderId || stopRef.current) return
    try {
      const res = await Payments.recheck(orderId)
      // Same race guard as tick(): if a parallel poll (or another click)
      // resolved the order while we were awaiting the network, do not
      // overwrite the terminal state.
      if (stopRef.current) return
      const status = res.data.data?.status
      if (status === 'success') {
        stopRef.current = true
        setState('success')
        try { sessionStorage.removeItem('sit_pending_payment') } catch { /* ignore */ }
        toast?.('Paiement confirmé', 'success')
        Wallet.getBalance().catch(() => {})
      } else if (status === 'failed' || status === 'expired' || status === 'cancelled') {
        stopRef.current = true
        setState('failed')
        setError(`Paiement ${status}`)
      } else {
        toast?.('Paiement encore en attente — revenez dans quelques secondes.', 'info')
      }
    } catch {
      if (stopRef.current) return
      toast?.('Vérification impossible, réessayez.', 'error')
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#0f0f18] border border-white/10 rounded-3xl p-8 text-center shadow-2xl">
        {state === 'checking' && (
          <>
            <div className="w-16 h-16 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin mx-auto mb-4" />
            <p className="font-bold text-lg">Paiement reçu, livraison en cours…</p>
            <p className="text-slate-500 text-sm mt-1">Quelques instants.</p>
          </>
        )}

        {state === 'pending_confirmation' && (
          <>
            <div className="w-16 h-16 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin mx-auto mb-4" />
            <p className="font-bold text-lg">Confirmation en cours</p>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">
              Validez le paiement Mobile Money sur l'onglet GeniusPay.
              Cette page se mettra à jour automatiquement dès la confirmation.
            </p>
            <p className="text-slate-600 text-xs mt-3 leading-relaxed">
              Vous pouvez fermer l'onglet GeniusPay une fois le paiement validé sur votre téléphone — votre confirmation reste ici.
            </p>
            <div className="mt-5 space-y-2">
              <button
                onClick={checkNow}
                className="w-full py-3 text-sm font-semibold rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25 transition-colors"
              >
                J'ai payé, vérifier maintenant
              </button>
              <button
                onClick={() => navigate('/account')}
                className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Voir mon compte
              </button>
            </div>
          </>
        )}

        {state === 'support' && (
          <>
            <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⏱</span>
            </div>
            <p className="font-bold text-lg">Nous vérifions votre paiement…</p>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">
              La confirmation prend plus de temps que d'habitude. Si le montant a
              été débité, votre commande sera enregistrée dès réception de la
              confirmation par notre prestataire.
            </p>
            <p className="text-slate-300 text-xs mt-3 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
              Référence à communiquer au support :<br />
              <span className="font-mono text-slate-100">{orderId}</span>
            </p>
            <div className="mt-5 space-y-2">
              <button
                onClick={checkNow}
                className="w-full py-3 text-sm font-semibold rounded-2xl btn-primary"
              >
                Vérifier maintenant
              </button>
              <a
                href={`https://wa.me/237655521445?text=Bonjour%2C%20j%27ai%20pay%C3%A9%20mais%20ma%20commande%20Stream-It%20n%27est%20pas%20confirm%C3%A9e%20%28r%C3%A9f%20%3A%20${encodeURIComponent(orderId || '')}%29`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-2.5 text-xs font-medium rounded-2xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors"
              >
                Contacter le support
              </a>
              <button
                onClick={() => navigate('/account')}
                className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Voir mon compte
              </button>
            </div>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <p className="font-bold text-xl text-emerald-400">Paiement confirmé</p>
            <p className="text-slate-400 text-sm mt-2">Votre commande a été enregistrée.</p>
            <p className="text-slate-600 text-xs mt-3">
              Vous pouvez fermer l'onglet GeniusPay s'il est encore ouvert.
            </p>
            <button onClick={() => navigate('/account')} className="btn-primary mt-6 w-full">
              Voir mon compte
            </button>
          </>
        )}

        {state === 'failed' && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">!</span>
            </div>
            <p className="font-bold text-xl text-red-400">Paiement non abouti</p>
            <p className="text-slate-400 text-sm mt-2">{error || 'Le paiement n’a pas pu être validé.'}</p>
            <button onClick={() => navigate('/')} className="btn-secondary mt-6 w-full">
              Retour à l’accueil
            </button>
          </>
        )}
      </div>
    </div>
  )
}
