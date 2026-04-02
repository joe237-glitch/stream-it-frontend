import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Products } from '../api/client'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import PaymentModal from '../components/PaymentModal'
import SEO from '../components/SEO'

const CATEGORY_EMOJI = {
  'Netflix': '🎬', 'Spotify': '🎵', 'Amazon Prime': '📦',
  'IPTV': '📺', 'Disney+': '✨', 'Gaming': '🎮',
  'Cartes Cadeaux': '🎁', 'Autres': '⭐', 'Abonnements Gaming': '🕹',
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { isLoggedIn } = useAuth()
  const toast = useToast()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [payProduct, setPayProduct] = useState(null)

  useEffect(() => {
    setLoading(true)
    setNotFound(false)
    Products.getById(id)
      .then(r => {
        const data = r.data?.data || r.data
        if (!data) { setNotFound(true); return }
        setProduct(data)
      })
      .catch(err => {
        if (err.response?.status === 404) setNotFound(true)
        else toast('Erreur de chargement du produit', 'error')
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleBuy = () => {
    if (!isLoggedIn) { navigate('/login'); return }
    setPayProduct(product)
  }

  const handleAddToCart = () => {
    addItem(product)
    toast(`${product.name.split(' – ')[0]} ajouté au panier`, 'success')
  }

  // ─── Loading skeleton ──────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <SEO title="Chargement..." />
        <div className="animate-pulse">
          <div className="h-4 bg-white/5 rounded w-40 mb-8" />
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-96 aspect-square bg-white/5 rounded-2xl flex-shrink-0" />
            <div className="flex-1 space-y-4">
              <div className="h-6 bg-white/5 rounded w-24" />
              <div className="h-8 bg-white/5 rounded w-3/4" />
              <div className="h-4 bg-white/5 rounded w-full" />
              <div className="h-4 bg-white/5 rounded w-5/6" />
              <div className="h-4 bg-white/5 rounded w-2/3" />
              <div className="h-10 bg-white/5 rounded w-40 mt-6" />
              <div className="flex gap-3 mt-4">
                <div className="h-12 bg-white/5 rounded-xl flex-1" />
                <div className="h-12 bg-white/5 rounded-xl flex-1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── 404 state ─────────────────────────────────────────────
  if (notFound || !product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <SEO title="Produit introuvable" />
        <p className="text-6xl mb-4">😕</p>
        <h1 className="text-2xl font-black mb-2">Produit introuvable</h1>
        <p className="text-slate-500 mb-6">Ce produit n'existe pas ou a été retiré.</p>
        <Link to="/" className="btn-primary py-2.5 px-6">
          ← Retour à la boutique
        </Link>
      </div>
    )
  }

  const isAvailable = product.stock !== 0 && product.is_active

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <SEO
        title={product.name}
        description={product.description || `${product.name} - ${Math.round(product.price).toLocaleString()} XAF`}
      />

      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-400 transition-colors mb-8"
      >
        ← Retour à la boutique
      </Link>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left: Image */}
        <div className="w-full md:w-96 flex-shrink-0">
          <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-900/40 to-violet-900/40 border border-white/10">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className={`w-full h-full object-cover ${!isAvailable ? 'opacity-40 grayscale' : ''}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-8xl">{CATEGORY_EMOJI[product.category] || '📦'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Info */}
        <div className="flex-1 min-w-0">
          {/* Category badge */}
          <span className="inline-block text-xs font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full mb-4">
            {CATEGORY_EMOJI[product.category] || '📦'} {product.category}
          </span>

          {/* Name */}
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2 leading-tight">
            {product.name.split(' – ')[0]}
          </h1>
          {product.name.split(' – ')[1] && (
            <p className="text-slate-400 text-lg mb-4">
              {product.name.split(' – ').slice(1).join(' – ')}
            </p>
          )}

          {/* Description */}
          <div className="text-slate-400 text-sm leading-relaxed whitespace-pre-line mb-6">
            {product.description || 'Aucune description disponible.'}
          </div>

          {/* Duration */}
          {product.duration_label && (
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
              <span className="text-base">🕐</span>
              Durée : <span className="text-slate-300 font-semibold">{product.duration_label}</span>
            </div>
          )}

          {/* Price */}
          <div className="mb-6">
            <p className="text-4xl font-black text-white">
              {Math.round(product.price).toLocaleString()} <span className="text-lg text-slate-400 font-semibold">XAF</span>
            </p>
            {product.discount > 0 && (
              <span className="inline-block mt-2 text-xs font-black text-white bg-green-500 px-3 py-1 rounded-full">
                -{product.discount}% de remise
              </span>
            )}
          </div>

          {/* Actions */}
          {isAvailable ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleBuy}
                className="btn-primary py-3.5 px-8 text-base font-bold flex-1 sm:flex-none"
              >
                Commander →
              </button>
              <button
                onClick={handleAddToCart}
                className="btn-secondary py-3.5 px-8 text-base font-bold flex-1 sm:flex-none"
              >
                + Ajouter au panier
              </button>
            </div>
          ) : (
            <div className="inline-block text-sm text-slate-500 bg-white/5 border border-white/10 rounded-xl py-3 px-6">
              🔜 Bientôt disponible
            </div>
          )}
        </div>
      </div>

      {/* Payment modal */}
      {payProduct && (
        <PaymentModal
          product={payProduct}
          onClose={() => setPayProduct(null)}
          onSuccess={() => navigate('/account')}
        />
      )}
    </div>
  )
}
