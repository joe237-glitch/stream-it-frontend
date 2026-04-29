import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../../../context/CartContext'
import { useStore3DSession } from '../hooks/useStore3DSession'
import { useToast } from '../../../components/Toast'

/**
 * ProductDrawer — modale 2D ouverte au-dessus du Canvas quand l'utilisateur
 * clique sur une carte produit 3D. Affiche : nom, prix, description courte,
 * 2 actions (ajouter au panier, voir mode classique).
 *
 * Phase 1 : pas de PaymentModal. L'ajout au panier va directement dans
 * CartContext, et l'utilisateur peut basculer en 2D pour finaliser.
 */
export default function ProductDrawer() {
  const product   = useStore3DSession(s => s.selectedProduct)
  const close     = useStore3DSession(s => s.closeProduct)
  const { addItem } = useCart()
  const toast = useToast()

  // Echap pour fermer
  useEffect(() => {
    if (!product) return
    const onKey = (e) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [product, close])

  if (!product) return null

  const handleAdd = () => {
    addItem(product)
    if (toast) toast(`${product.name} ajouté au panier !`, 'success')
    close()
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      onClick={close}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#0e0e1c] p-6 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          aria-label="Fermer"
          className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >×</button>

        <p className="text-xs uppercase tracking-wide text-violet-300 mb-1">{product.category}</p>
        <h2 className="text-2xl font-bold mb-3">{product.name}</h2>

        <div className="text-3xl font-extrabold text-white mb-4">
          {product.price.toLocaleString('fr-FR')} <span className="text-base font-bold text-violet-300">{product.currency}</span>
        </div>

        <p className="text-sm text-slate-300 mb-6 leading-relaxed">{product.description}</p>

        <div className="space-y-2">
          <button
            onClick={handleAdd}
            className="btn-primary w-full py-3 text-sm font-semibold"
          >
            Ajouter au panier
          </button>
          <Link
            to="/"
            className="block w-full py-3 text-sm font-semibold text-center rounded-2xl border border-white/15 text-white hover:bg-white/5 transition-colors"
            onClick={close}
          >
            Voir en mode classique
          </Link>
        </div>

        <p className="mt-4 text-center text-[10px] text-slate-500">
          Prototype 3D — produit factice, paiement non actif Phase 1
        </p>
      </div>
    </div>
  )
}
