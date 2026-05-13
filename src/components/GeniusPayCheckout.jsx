import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const { data: coverage, loading: coverageLoading, error: coverageError } = usePaymentCoverage()

  const [step, setStep]               = useState('form')   // form | redirecting | polling | timeout | done | failed
  const [pollOrderId, setPollOrderId] = useState(null)
  const [pollSecondsLeft, setPollSecondsLeft] = useState(0)
  const [manualChecking, setManualChecking] = useState(false)
  // Reference to the GeniusPay checkout tab. Used ONLY for a best-effort
  // .close() on success — the browser may refuse to close cross-origin
  // popups, so the UX never depends on this. Stream-It is the source of
  // truth: as soon as the webhook lands and polling sees status=success,
  // we transition to the done screen regardless of the GeniusPay tab.
  const [checkoutTab, setCheckoutTab] = useState(null)
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

    // 4s polling — light enough on the backend, fast enough that the
    // success screen appears within a few seconds of the webhook. We do NOT
    // race the GeniusPay tab close anymore; the directive is that Stream-It
    // is the source of truth, regardless of what happens on pay.genius.ci.
    const POLL_INTERVAL = 4000
    const MAX_DURATION = 5 * 60 * 1000  // 5 min
    const startedAt = Date.now()
    let cancelled = false

    // Best-effort: try to close the GeniusPay tab on terminal status. The
    // browser may ignore this for cross-origin popups — that's fine, the UX
    // doesn't depend on it. We always show the user "vous pouvez fermer
    // l'onglet GeniusPay s'il est encore ouvert" so they know what to do.
    const closeCheckoutTab = () => {
      try { checkoutTab?.close?.() } catch { /* best-effort */ }
      try { window.focus() } catch { /* ignore */ }
    }

    const tick = async () => {
      if (cancelled) return
      const elapsed = Date.now() - startedAt
      setPollSecondsLeft(Math.max(0, Math.ceil((MAX_DURATION - elapsed) / 1000)))

      if (elapsed >= MAX_DURATION) {
        if (!cancelled) {
          // Soft timeout: don't close the tab, don't claim failure. The
          // user may still be in the middle of a USSD flow. Surface a
          // gentle prompt to verify manually or contact support.
          setStep('timeout')
        }
        return
      }

      try {
        const r = await Payments.status(pollOrderId)
        const s = r.data?.data?.status
        if (cancelled) return
        if (s === 'success') {
          closeCheckoutTab()  // best-effort; UX does not depend on it
          setStep('done')
          try { sessionStorage.removeItem('sit_pending_payment') } catch { /* ignore */ }
          toast?.('Paiement confirmé', 'success')
          if (typeof onSuccess === 'function') onSuccess()
          return
        }
        if (s === 'failed' || s === 'cancelled' || s === 'expired') {
          // Note: a GeniusPay 419 page does NOT mark the payment as failed
          // — that decision belongs to the webhook. We only treat the order
          // as failed when the backend says so explicitly.
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
  }, [step, pollOrderId, checkoutTab])

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

      // ─── Pattern "deux onglets" ──────────────────────────────────────
      // GeniusPay's hosted checkout keeps the user on pay.genius.ci even
      // after a successful payment — their "Retour à l'accueil" button
      // is hardcoded to their homepage and ignores our success_url. So
      // instead of sending the user there and praying for a redirect, we
      // split the flow into two tabs:
      //   1. New tab → GeniusPay checkout (USSD push, Mobile Money flow)
      //   2. Current tab → Stream-It's /payment/return page, which polls
      //      our backend every few seconds until the webhook lands.
      //
      // The user always keeps one foot on stream-it.shop. They can close
      // the GeniusPay tab whenever; the confirmation page lives on our
      // domain regardless. The webhook is the source of truth — the
      // /payment/return page only reads status, never modifies it.
      //
      // NB: no features string. Both `noopener` and `noreferrer` make
      // window.open return null per the HTML spec.
      const paymentTab = typeof window !== 'undefined'
        ? window.open(checkout_url, '_blank')
        : null

      if (!paymentTab || paymentTab.closed) {
        // Popup blocked (strict browser) → fallback to legacy same-tab
        // redirect. The user will still hit GeniusPay's broken return
        // button, but at least the payment goes through.
        setStep('redirecting')
        window.location.href = checkout_url
        return
      }

      // Defensive: cut the opener link so the popup can't navigate us
      // via window.opener.location (harmless if the browser ignores it).
      try { paymentTab.opener = null } catch { /* cross-origin */ }

      // Navigate the ORIGINAL tab to our confirmation page. This unmounts
      // the modal and shows the user a Stream-It-branded "Paiement en
      // cours…" screen that auto-resolves to success/failed via polling.
      navigate(`/payment/return?orderId=${orderId}`)
    } catch (err) {
      const code = err.response?.data?.error?.code
      const message = err.response?.data?.message || 'Erreur lors de la création du paiement'
      setError(code ? `${message}` : message)
      setSubmitting(false)
    }
  }

  // Manual "I paid, check now" — fires a single status fetch and
  // transitions to done/failed if backend has resolved. Otherwise stays
  // in the current step. Used from the polling and timeout screens.
  const checkNow = async () => {
    if (!pollOrderId || manualChecking) return
    setManualChecking(true)
    try {
      const r = await Payments.status(pollOrderId)
      const s = r.data?.data?.status
      if (s === 'success') {
        try { checkoutTab?.close?.() } catch { /* best-effort */ }
        setStep('done')
        try { sessionStorage.removeItem('sit_pending_payment') } catch { /* ignore */ }
        toast?.('Paiement confirmé', 'success')
        if (typeof onSuccess === 'function') onSuccess()
        return
      }
      if (s === 'failed' || s === 'cancelled' || s === 'expired') {
        setStep('failed')
        setError(s === 'cancelled' ? 'Paiement annulé.' : 'Paiement échoué. Vous pouvez réessayer.')
        try { sessionStorage.removeItem('sit_pending_payment') } catch { /* ignore */ }
        return
      }
      // Still pending — surface a soft toast so the user knows we checked.
      toast?.('Paiement encore en attente, validez sur GeniusPay puis réessayez.', 'info')
    } catch {
      toast?.('Vérification impossible, réessayez dans quelques secondes.', 'error')
    } finally {
      setManualChecking(false)
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
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin mx-auto" />
              <div className="space-y-2">
                <p className="font-bold text-lg">Paiement en cours</p>
                <p className="text-slate-300 text-sm px-2 leading-relaxed">
                  Validez le paiement dans l'onglet GeniusPay, puis revenez ici.
                </p>
                <p className="text-slate-500 text-xs px-2 leading-relaxed">
                  Stream-It détectera automatiquement votre paiement.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={checkNow}
                  disabled={manualChecking}
                  className="w-full py-3 text-sm font-semibold rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25 disabled:opacity-50 transition-colors"
                >
                  {manualChecking ? 'Vérification…' : "J'ai payé, vérifier maintenant"}
                </button>
                <a
                  href="https://wa.me/237655521445?text=Bonjour%2C%20j%27ai%20un%20probl%C3%A8me%20avec%20mon%20paiement%20Stream-It"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-2.5 text-xs font-medium rounded-2xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors"
                >
                  Besoin d'aide ? Contacter le support
                </a>
              </div>

              {pollSecondsLeft > 0 && (
                <p className="text-slate-600 text-xs">
                  Vérification automatique pendant encore {Math.floor(pollSecondsLeft / 60)}m {String(pollSecondsLeft % 60).padStart(2, '0')}s
                </p>
              )}
            </div>
          )}

          {step === 'timeout' && (
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto">
                <span className="text-3xl">⏱</span>
              </div>
              <div className="space-y-2">
                <p className="font-bold text-lg">Paiement en attente</p>
                <p className="text-slate-300 text-sm px-2 leading-relaxed">
                  Si vous avez déjà validé le paiement, cliquez sur « Vérifier maintenant ».
                </p>
                <p className="text-slate-500 text-xs px-2 leading-relaxed">
                  Si le montant a été débité mais la commande n'est pas confirmée, contactez le support.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={checkNow}
                  disabled={manualChecking}
                  className="w-full py-3 text-sm font-semibold rounded-2xl btn-primary disabled:opacity-50"
                >
                  {manualChecking ? 'Vérification…' : 'Vérifier maintenant'}
                </button>
                <a
                  href="https://wa.me/237655521445?text=Bonjour%2C%20j%27ai%20pay%C3%A9%20mais%20ma%20commande%20Stream-It%20n%27est%20pas%20confirm%C3%A9e"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-2.5 text-xs font-medium rounded-2xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors"
                >
                  Contacter le support
                </a>
                <button
                  onClick={() => { setStep('form'); setError(''); setPollOrderId(null); setCheckoutTab(null) }}
                  className="block w-full py-2.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Recommencer un nouveau paiement
                </button>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <span className="text-3xl">✓</span>
              </div>
              <div className="space-y-2">
                <p className="font-bold text-lg">Paiement confirmé</p>
                <p className="text-slate-300 text-sm px-2">
                  {recharge
                    ? 'Votre solde a été mis à jour.'
                    : 'Votre commande a été enregistrée.'}
                </p>
                <p className="text-slate-500 text-xs px-2 leading-relaxed pt-1">
                  Vous pouvez fermer l'onglet GeniusPay s'il est encore ouvert.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => onClose?.()}
                  className="w-full py-3 text-sm font-semibold rounded-2xl btn-primary"
                >
                  {recharge ? 'Voir mon solde' : 'Voir ma commande'}
                </button>
              </div>
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
                onClick={() => { setStep('form'); setError(''); setPollOrderId(null); setCheckoutTab(null) }}
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
