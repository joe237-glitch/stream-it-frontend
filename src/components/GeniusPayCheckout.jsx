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

  // Step machine — kept minimal since the success/pending/failed states
  // now live on the dedicated /payment/return page (the "two-tab" pattern
  // navigates this tab away as soon as the GeniusPay popup opens). Only
  // 'form' (user fills inputs) and 'redirecting' (popup blocked → legacy
  // same-tab redirect) are reachable from this component.
  const [step, setStep]               = useState('form')   // form | redirecting
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
      // Both fields are required. Without orderId, the /payment/return
      // page can't poll (the URL would literally contain "orderId=undefined"
      // — a truthy string that slips past PaymentReturn's guard and burns
      // 60 poll cycles in the void). Refuse to navigate if either is missing.
      if (!checkout_url || !orderId) {
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

  const payWithWallet = async () => {
    if (!user || walletBalance == null || walletBalance < amount) return
    setWalletLoading(true); setError('')
    try {
      const payload = product
        ? { productId: product.id }
        : { products: cart.map(i => ({ productId: i.product.id, quantity: i.quantity })) }
      await Wallet.pay(payload)
      toast('Paiement par solde confirmé !', 'success')
      // Fire onSuccess so the parent can clear the cart and refresh state.
      // Without this, CartDrawer keeps the items in the cart after a
      // successful wallet checkout — the user could re-pay for the same
      // basket. The hosted-checkout flow handles cart-clear via the
      // /payment/return page (which calls clearCart on success), so this
      // is specifically the wallet path that needed the explicit hook.
      if (typeof onSuccess === 'function') onSuccess()
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
                <p>Un nouvel onglet va s'ouvrir pour finaliser le paiement Mobile Money. Revenez ensuite sur Stream-It — votre paiement est détecté automatiquement, pas besoin de cliquer sur "Retour".</p>
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
        </div>
      </div>
    </div>
  )
}
