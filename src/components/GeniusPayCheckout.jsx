import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'
import { Payments, Wallet } from '../api/client'
import { usePaymentCoverage, getSellableCountries } from '../hooks/usePaymentCoverage'
import { stripDialCode } from '../utils/phone'
import CountrySelect from './CountrySelect'

/**
 * GeniusPayCheckout — enriched hosted-checkout flow (Phase 1, 2026-04-29).
 *
 * Replaces the previous minimal version. Now drives the user through:
 *   1. Country     (filtered to enabled=true)
 *   2. Payment type (filtered by country.payment_types, auto if only one)
 *   3. Operator     (filtered by country.operators of that type)
 *   4. Phone        (only if operator.phone_required, validated against pattern)
 *   5. Confirm      → POST /api/payments/create with {country_code, operator_code, phone}
 *
 * The backend derives `currency` and `payment_method` from the matrix — the
 * frontend is only authoritative for what the user chose, never for what
 * gets billed. If GeniusPay rejects an operator slug the fix is to patch
 * the JSON in the backend repo, not this component.
 *
 * Wallet payment (when not a recharge) is preserved as the previous behaviour.
 *
 * Props (compatible with PaymentModal):
 *   product   – single product object
 *   cart      – [{ product, quantity }]
 *   recharge  – true → wallet top-up
 *   onClose   – callback to close the modal
 *
 * If the coverage endpoint fails AND no cache is available, the modal falls
 * back to a degraded confirm screen that submits the legacy body shape; the
 * backend's legacy fallback then takes over (currency='XOF', no operator).
 * This makes the migration robust to a temporary backend coverage outage.
 */
export default function GeniusPayCheckout({ product, cart, recharge, onClose, onSuccess }) {
  const { user } = useAuth()
  const toast = useToast()
  const { data: coverage, loading: coverageLoading, error: coverageError } = usePaymentCoverage()

  const [step, setStep]               = useState('form')   // form | redirecting | polling | done | failed
  const [pollOrderId, setPollOrderId] = useState(null)
  const [pollSecondsLeft, setPollSecondsLeft] = useState(0)
  const [rechargeAmt, setRechargeAmt] = useState('')
  const [countryCode, setCountryCode] = useState(null)
  const [paymentType, setPaymentType] = useState(null)     // 'mobile_money' | 'card'
  const [operatorCode, setOperatorCode] = useState(null)
  const [phone, setPhone]             = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState('')

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

  // ─── Polling: when GeniusPay checkout is open in a new tab, this tab
  //     polls the backend every 3s for up to 5 min until status is final.
  //     Triggered by setStep('polling') after successful new-tab open.
  useEffect(() => {
    if (step !== 'polling' || !pollOrderId) return

    const POLL_INTERVAL = 3000
    const MAX_DURATION = 5 * 60 * 1000  // 5 min
    const startedAt = Date.now()
    let cancelled = false

    const tick = async () => {
      if (cancelled) return
      const elapsed = Date.now() - startedAt
      setPollSecondsLeft(Math.max(0, Math.ceil((MAX_DURATION - elapsed) / 1000)))

      if (elapsed >= MAX_DURATION) {
        if (!cancelled) {
          setStep('failed')
          setError('Délai dépassé. Si vous avez payé, votre solde sera mis à jour automatiquement à votre prochaine connexion.')
        }
        return
      }

      try {
        const r = await Payments.status(pollOrderId)
        const s = r.data?.data?.status
        if (cancelled) return
        if (s === 'success') {
          setStep('done')
          try { sessionStorage.removeItem('sit_pending_payment') } catch { /* ignore */ }
          toast?.('Paiement reçu !', 'success')
          if (typeof onSuccess === 'function') onSuccess()
          setTimeout(() => onClose?.(), 1800)
          return
        }
        if (s === 'failed' || s === 'cancelled' || s === 'expired') {
          setStep('failed')
          setError(s === 'cancelled' ? 'Paiement annulé.' : 'Paiement échoué. Vous pouvez réessayer.')
          try { sessionStorage.removeItem('sit_pending_payment') } catch { /* ignore */ }
          return
        }
      } catch {
        // network blip — keep polling
      }
      setTimeout(tick, POLL_INTERVAL)
    }
    tick()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, pollOrderId])

  // ─── Selection state derived from coverage ────────────────────
  const sellableCountries = useMemo(() => getSellableCountries(coverage), [coverage])
  const country = useMemo(
    () => (countryCode ? sellableCountries.find(c => c.country_code === countryCode) : null),
    [countryCode, sellableCountries]
  )
  const operatorsForType = useMemo(() => {
    if (!country || !paymentType) return []
    return country.operators.filter(op => op.payment_type === paymentType)
  }, [country, paymentType])
  const operator = useMemo(
    () => (operatorCode ? operatorsForType.find(op => op.code === operatorCode) : null),
    [operatorCode, operatorsForType]
  )

  // Pick a default country once coverage is loaded.
  useEffect(() => {
    if (!coverage || countryCode) return
    const def = coverage.countries.find(c => c.country_code === coverage.default_country)
    const initial = def?.enabled ? def.country_code : sellableCountries[0]?.country_code
    if (initial) setCountryCode(initial)
  }, [coverage, countryCode, sellableCountries])

  // Auto-select payment type if only one is available.
  useEffect(() => {
    if (!country) return
    if (country.payment_types.length === 1) {
      setPaymentType(country.payment_types[0])
    } else if (paymentType && !country.payment_types.includes(paymentType)) {
      setPaymentType(null)
    }
  }, [country])

  // Reset operator + phone when country/type changes.
  useEffect(() => {
    setOperatorCode(null)
    setPhone('')
  }, [countryCode, paymentType])

  // ─── Amount + currency ─────────────────────────────────────────
  // Currency comes from the chosen country. Until a country is chosen we
  // display nothing rather than guess — keeps the UX honest.
  const currency = country?.currency || ''
  const minAmount = currency
    ? (coverage?.currencies?.[currency]?.min_amount ?? 200)
    : 200

  const amount = recharge
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
    : `${amount.toLocaleString()} ${currency || ''}`.trim()

  // ─── Phone validation (best-effort, backend revalidates) ──────
  // Strip the country dial code (+237, 237, leading 0) before testing the
  // operator pattern, so the user can type any of:
  //   "655521445", "+237655521445", "237655521445", "0655521445"
  // and validation still passes for Cameroun's pattern `^6[0-9]{8}$`.
  // The backend re-formats to E.164 before sending to GeniusPay.
  const phoneNational = stripDialCode(phone, countryCode)
  const phoneOk = !operator?.phone_required
    || (operator.phone_pattern
        ? new RegExp(operator.phone_pattern).test(phoneNational)
        : phoneNational.length >= 6)

  // ─── Degraded mode: coverage unreachable, no cache ────────────
  // We render a minimal confirm screen and let the backend's legacy body
  // fallback handle the create call. The user can still pay; they just
  // pick the operator on the GeniusPay hosted page.
  const degraded = !coverage && !!coverageError

  const canSubmit = degraded
    ? amount >= 200 && !submitting
    : (!!country && !!paymentType && !!operator && phoneOk && amount >= minAmount && !submitting)

  // ─── Submit ───────────────────────────────────────────────────
  const submit = async () => {
    if (!canSubmit) return
    setError('')
    setSubmitting(true)

    try {
      const base = recharge
        ? { type: 'recharge', amount }
        : cart
          ? { type: 'cart', products: cart.map(i => ({ productId: i.product.id, quantity: i.quantity })) }
          : { type: 'product', productId: product.id }

      const payload = degraded
        ? base
        : {
            ...base,
            country_code:  country.country_code,
            operator_code: operator.code,
            ...(operator.phone_required ? { phone } : {}),
          }

      const res = await Payments.create(payload)
      const { checkout_url, orderId } = res.data?.data || {}
      if (!checkout_url) {
        setError('Réponse provider invalide')
        setSubmitting(false)
        return
      }

      try { sessionStorage.setItem('sit_pending_payment', JSON.stringify({ orderId, ts: Date.now() })) } catch { /* ignore */ }

      // Open the GeniusPay checkout in a new tab so this Stream-It page stays
      // alive and can poll for the payment status. GeniusPay's success page
      // has a "Retour à l'accueil" button that points to pay.genius.ci (their
      // domain), so we cannot rely on a server-side redirect to bring the
      // user back. Polling lets us auto-confirm the payment without the user
      // having to navigate back manually.
      const newTab = typeof window !== 'undefined'
        ? window.open(checkout_url, '_blank', 'noopener,noreferrer')
        : null

      if (!newTab || newTab.closed) {
        // Popup blocked → fallback to current-tab redirect (legacy behaviour)
        setStep('redirecting')
        window.location.href = checkout_url
        return
      }

      // New tab opened → start polling current tab.
      setPollOrderId(orderId)
      setStep('polling')
      setSubmitting(false)
    } catch (err) {
      const code = err.response?.data?.error?.code
      const message = err.response?.data?.message || 'Erreur lors de la création du paiement'
      setError(code ? `${message}` : message)
      setSubmitting(false)
    }
  }

  const payWithWallet = async () => {
    if (!user || walletBalance == null || walletBalance < amount) return
    setWalletLoading(true); setError('')
    try {
      const payload = product
        ? { productId: product.id }
        : { products: cart.map(i => ({ productId: i.product.id, quantity: i.quantity })) }
      await Wallet.pay(payload)
      toast('Paiement par solde confirmé !', 'success')
      setTimeout(() => onClose(), 1500)
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de paiement wallet')
    } finally {
      setWalletLoading(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md bg-[#0f0f18] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
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
          {step === 'form' && (
            <div className="space-y-4">
              {recharge && (
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">
                    Montant à recharger {currency && `(${currency})`}
                  </label>
                  <input
                    value={rechargeAmt}
                    onChange={e => setRechargeAmt(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ex: 5000"
                    className="input-field text-lg font-bold"
                    inputMode="numeric"
                  />
                  <p className="text-xs text-slate-600 mt-1">
                    Minimum : {minAmount} {currency}
                  </p>
                </div>
              )}

              {/* Coverage loading */}
              {coverageLoading && !coverage && (
                <div className="text-xs text-slate-500 text-center py-3">
                  Chargement des moyens de paiement…
                </div>
              )}

              {/* Degraded mode: minimal confirm */}
              {degraded && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300">
                  Impossible de charger la liste des opérateurs. Vous pourrez choisir votre moyen de paiement sur la page sécurisée.
                </div>
              )}

              {/* Country + operator pickers */}
              {!degraded && coverage && (
                <>
                  {/* Country */}
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">Pays</label>
                    <CountrySelect
                      value={countryCode}
                      onChange={setCountryCode}
                      options={sellableCountries}
                    />
                  </div>

                  {/* Payment type (skip if a single one) */}
                  {country && country.payment_types.length > 1 && (
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5">Mode de paiement</label>
                      <div className="grid grid-cols-2 gap-2">
                        {country.payment_types.map(t => (
                          <button
                            key={t}
                            onClick={() => setPaymentType(t)}
                            className={`px-3 py-2.5 text-sm rounded-xl border transition-colors ${
                              paymentType === t
                                ? 'bg-indigo-500/15 border-indigo-500/50 text-white'
                                : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
                            }`}
                          >
                            {t === 'mobile_money' ? 'Mobile Money' : t === 'card' ? 'Carte' : t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Operator */}
                  {paymentType && operatorsForType.length > 0 && (
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5">Opérateur</label>
                      <div className="grid grid-cols-2 gap-2">
                        {operatorsForType.map(op => (
                          <button
                            key={op.code}
                            onClick={() => setOperatorCode(op.code)}
                            className={`px-3 py-2.5 text-sm rounded-xl border text-left transition-colors ${
                              operatorCode === op.code
                                ? 'bg-indigo-500/15 border-indigo-500/50 text-white'
                                : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
                            }`}
                          >
                            {op.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Phone (only if operator requires it) */}
                  {operator?.phone_required && (
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5">
                        Numéro de téléphone {operator.name && `(${operator.name})`}
                      </label>
                      <input
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\s+/g, ''))}
                        placeholder={operator.phone_example || ''}
                        inputMode="tel"
                        className="input-field"
                      />
                      {phone && !phoneOk && (
                        <p className="text-xs text-red-400 mt-1">
                          Format attendu : {operator.phone_example || 'numéro mobile'}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-400 space-y-2">
                <p className="font-semibold text-slate-200">Paiement sécurisé</p>
                <p>Vous serez redirigé vers la page sécurisée de GeniusPay pour finaliser le paiement avec votre opérateur.</p>
              </div>

              {error && (
                <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  {error}
                </p>
              )}

              {/* Wallet payment (not for recharge) */}
              {!recharge && user && walletBalance !== null && (
                <>
                  <button
                    onClick={payWithWallet}
                    disabled={walletLoading || walletBalance < amount}
                    className={`w-full py-3.5 text-sm font-bold rounded-2xl border transition-all ${
                      walletBalance >= amount
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                        : 'bg-white/5 border-white/10 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {walletLoading
                      ? 'Paiement en cours...'
                      : walletBalance >= amount
                        ? `Payer avec mon solde (${walletBalance.toLocaleString()} XAF)`
                        : `Solde insuffisant (${walletBalance.toLocaleString()} XAF)`}
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
                disabled={!canSubmit}
                className="w-full btn-primary py-3.5 text-sm disabled:opacity-50"
              >
                {submitting
                  ? 'Préparation du paiement…'
                  : recharge
                    ? `Recharger ${amount >= minAmount ? amount.toLocaleString() + ' ' + currency : ''}`
                    : `Payer ${amount.toLocaleString()} ${currency}`}
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
                <p className="text-slate-500 text-sm mt-1">Vous allez être conduit vers la page de paiement sécurisée.</p>
              </div>
            </div>
          )}

          {step === 'polling' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin mx-auto" />
              <div>
                <p className="font-bold text-lg">Paiement en cours…</p>
                <p className="text-slate-400 text-sm mt-2 px-2">
                  Une nouvelle fenêtre s'est ouverte pour finaliser votre paiement Mobile Money.
                </p>
                <p className="text-slate-500 text-xs mt-3">
                  Cette page se mettra à jour automatiquement dès la confirmation. Vous pouvez fermer la fenêtre GeniusPay une fois le paiement validé sur votre téléphone.
                </p>
                {pollSecondsLeft > 0 && (
                  <p className="text-slate-600 text-xs mt-3">
                    Délai max : {Math.floor(pollSecondsLeft / 60)}m {String(pollSecondsLeft % 60).padStart(2, '0')}s
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center py-8 space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
                <span className="text-3xl">✓</span>
              </div>
              <p className="font-bold text-lg">Paiement reçu !</p>
              <p className="text-slate-500 text-sm">Votre solde a été mis à jour.</p>
            </div>
          )}

          {step === 'failed' && (
            <div className="text-center py-8 space-y-3">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                <span className="text-3xl">✕</span>
              </div>
              <p className="font-bold text-lg">Échec du paiement</p>
              <p className="text-slate-400 text-sm px-3">{error || 'Une erreur est survenue.'}</p>
              <button
                onClick={() => { setStep('form'); setError(''); setPollOrderId(null) }}
                className="btn-primary mt-2 px-6 py-2 text-sm"
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
