/**
 * PaymentModal — provider-aware wrapper.
 *
 * Selects the active payment provider via VITE_PAYMENT_PROVIDER:
 *   - 'soleaspay' (default) → legacy PaymentModalLegacy with mobile-money push polling
 *   - 'geniuspay'           → GeniusPayCheckout with hosted-checkout redirect
 *
 * Call sites (Home, CartDrawer, Account, ProductDetail) keep importing PaymentModal
 * with the same props — the wrapper dispatches to the right implementation.
 *
 * Switching providers is a one-line env change; no code change required.
 */
import PaymentModalLegacy from './PaymentModalLegacy'
import GeniusPayCheckout from './GeniusPayCheckout'

const PROVIDER = (import.meta.env.VITE_PAYMENT_PROVIDER || 'soleaspay').toLowerCase()

export default function PaymentModal(props) {
  if (PROVIDER === 'geniuspay') {
    return <GeniusPayCheckout {...props} />
  }
  return <PaymentModalLegacy {...props} />
}
