import { useCart } from '../../../context/CartContext'

/**
 * MiniCartButton — affiche le nombre d'articles dans le panier existant.
 * Cliquer ouvre le CartDrawer global (déjà monté dans App.jsx).
 */
export default function MiniCartButton() {
  const { cartCount, setIsOpen } = useCart()

  return (
    <button
      onClick={() => setIsOpen(true)}
      aria-label="Ouvrir le panier"
      className="fixed top-4 left-4 z-50 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/15 text-white text-xs font-semibold hover:bg-white/20 transition-colors"
      style={{ boxShadow: '0 6px 18px rgba(0,0,0,0.35)' }}
    >
      <span aria-hidden>🛒</span>
      Panier
      {cartCount > 0 && (
        <span className="ml-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-violet-500 text-white text-[10px] font-bold">
          {cartCount}
        </span>
      )}
    </button>
  )
}
