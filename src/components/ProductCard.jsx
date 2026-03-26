import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'

const CATEGORY_EMOJI = {
  'Netflix': '🎬', 'Spotify': '🎵', 'Amazon Prime': '📦',
  'IPTV': '📺', 'Disney+': '✨', 'Gaming': '🎮',
  'Cartes Cadeaux': '🎁', 'Autres': '⭐', 'Abonnements Gaming': '🕹',
}

export default function ProductCard({ product, onBuy, onDetail }) {
  const { addItem } = useCart()
  const { isAdmin } = useAuth()
  const toast = useToast()
  const isAvailable = product.stock !== 0 && product.is_active

  const handleAddToCart = (e) => {
    e.stopPropagation()
    addItem(product)
    toast(`${product.name.split(' – ')[0]} ajouté au panier`, 'success')
  }

  return (
    <div className="card group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 flex flex-col">

      {/* Thumbnail */}
      <div
        className="aspect-square overflow-hidden relative cursor-pointer"
        onClick={() => onDetail(product)}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${!isAvailable ? 'opacity-40 grayscale' : ''}`}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-900/40 to-violet-900/40 flex items-center justify-center">
            <span className="text-6xl">{CATEGORY_EMOJI[product.category] || '📦'}</span>
          </div>
        )}

        {!isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-slate-300 bg-black/70 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
              🔜 Bientôt
            </span>
          </div>
        )}
        {isAvailable && product.discount > 0 && (
          <div className="absolute top-2 left-2">
            <span className="text-xs font-black text-white bg-green-500 px-2 py-0.5 rounded-full shadow-lg">
              -{product.discount}%
            </span>
          </div>
        )}
      </div>

      {/* Infos */}
      <div className="p-3 flex flex-col flex-1">
        <p className="font-bold text-sm leading-tight line-clamp-1">
          {CATEGORY_EMOJI[product.category]} {product.name.split(' – ')[0]}
        </p>
        <p className="text-slate-500 text-xs mb-2">
          {product.name.split(' – ').slice(1).join(' – ')}
        </p>

        <div className="mt-auto">
          {isAvailable ? (
            <>
              <p className="text-lg font-black text-white">
                {Math.round(product.price * 655 / 100).toLocaleString()} XAF
              </p>
              {isAdmin() ? (
                <button
                  onClick={() => onDetail(product)}
                  className="w-full btn-secondary text-xs py-2 mt-2"
                >
                  👁 Voir le détail
                </button>
              ) : (
                <>
                  <button
                    onClick={() => onBuy(product)}
                    className="w-full btn-primary text-xs py-2 mt-2"
                  >
                    Commander →
                  </button>
                  <button
                    onClick={handleAddToCart}
                    className="w-full btn-secondary text-xs py-1.5 mt-1.5"
                  >
                    + Ajouter au panier
                  </button>
                </>
              )}
            </>
          ) : (
            <button
              onClick={() => onDetail(product)}
              disabled={!product.description}
              className="w-full btn-secondary text-xs py-2 mt-2 cursor-not-allowed opacity-50"
            >
              Bientôt disponible
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
