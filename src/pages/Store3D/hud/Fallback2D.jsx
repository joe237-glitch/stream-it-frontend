import { Link } from 'react-router-dom'
import { useCart } from '../../../context/CartContext'
import { useToast } from '../../../components/Toast'
import { CATEGORIES, MOCK_PRODUCTS_BY_CATEGORY } from '../data/mockProducts'
import { setUserPref } from '../perf/DeviceProbe'

/**
 * Fallback2D — version 2D propre rendue quand DeviceProbe retourne 'fallback'
 * ou quand l'utilisateur a forcé manuellement le mode classique sur 3D.
 *
 * Conformément à la directive PM : 3D jamais forcée sur mobile, bouton
 * "Acheter rapidement" toujours visible. Cette page sert de version
 * dégradée propre, pas une page 404 ou un message d'erreur.
 */
export default function Fallback2D({ reason }) {
  const { addItem } = useCart()
  const toast = useToast()

  const handleAdd = (product) => {
    addItem(product)
    if (toast) toast(`${product.name} ajouté au panier !`, 'success')
  }

  return (
    <div className="min-h-[80vh] max-w-5xl mx-auto px-4 py-10 text-white">
      <header className="text-center mb-8 space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold">Boutique 3D Stream-It</h1>
        <p className="text-slate-400 max-w-xl mx-auto">
          {reason === 'low_device'
            ? 'La version immersive nécessite un appareil compatible. Voici la version rapide pour ne pas vous faire perdre de temps.'
            : 'Version classique de la boutique — aussi disponible si vous préférez.'}
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <Link
            to="/"
            className="px-4 py-2 rounded-lg bg-white/10 border border-white/15 text-xs font-semibold hover:bg-white/20"
          >
            ← Retour à la boutique principale
          </Link>
          <button
            onClick={() => { setUserPref(null); window.location.reload() }}
            className="px-4 py-2 rounded-lg bg-violet-500/20 border border-violet-500/40 text-xs font-semibold hover:bg-violet-500/30"
            title="Réessayer en 3D si votre device le permet"
          >
            Tenter le mode 3D
          </button>
        </div>
      </header>

      {CATEGORIES.map(cat => {
        const products = MOCK_PRODUCTS_BY_CATEGORY[cat.code] || []
        return (
          <section key={cat.code} className="mb-10">
            <h2
              className="text-lg font-bold mb-4 inline-flex items-center gap-2"
              style={{ color: cat.accent }}
            >
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: cat.accent }} />
              {cat.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {products.map(product => (
                <article
                  key={product.id}
                  className="rounded-2xl border border-white/10 bg-[#0f0f18] p-4 flex flex-col gap-2"
                >
                  <h3 className="font-bold text-base">{product.name}</h3>
                  <p className="text-xs text-slate-400 flex-1">{product.description}</p>
                  <div className="text-xl font-extrabold mt-1" style={{ color: cat.accent }}>
                    {product.price.toLocaleString('fr-FR')} {product.currency}
                  </div>
                  <button
                    onClick={() => handleAdd(product)}
                    className="btn-primary py-2 text-xs"
                  >
                    Acheter rapidement
                  </button>
                </article>
              ))}
            </div>
          </section>
        )
      })}

      <p className="text-center text-[11px] text-slate-500 mt-10">
        Prototype 3D — produits factices, paiement non actif Phase 1
      </p>
    </div>
  )
}
