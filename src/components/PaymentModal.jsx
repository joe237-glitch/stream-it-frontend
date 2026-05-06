/**
 * PaymentModal — provider-aware wrapper.
 *
 * Selects the active payment provider via VITE_PAYMENT_PROVIDER:
 *   - 'geniuspay' (default) → GeniusPayCheckout with hosted-checkout redirect
 *   - 'soleaspay'           → legacy PaymentModalLegacy (DEPRECATED, kept only
 *                             as fallback for old environments still running on
 *                             SoleasPay; prod and staging are both on GeniusPay)
 *
 * Call sites (Home, CartDrawer, Account, ProductDetail) keep importing PaymentModal
 * with the same props — the wrapper dispatches to the right implementation.
 */
import PaymentModalLegacy from './PaymentModalLegacy'
import GeniusPayCheckout from './GeniusPayCheckout'

const PROVIDER = (import.meta.env.VITE_PAYMENT_PROVIDER || 'geniuspay').toLowerCase()

export default function PaymentModal(props) {
  if (PROVIDER === 'soleaspay') {
    return <PaymentModalLegacy {...props} />
  }
  return <GeniusPayCheckout {...props} />
}
