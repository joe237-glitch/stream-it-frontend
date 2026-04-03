import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Products } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import ProductCard from '../components/ProductCard'
import PaymentModal from '../components/PaymentModal'
import SEO from '../components/SEO'

const CATEGORIES = ['Tous', 'Netflix', 'Spotify', 'Amazon Prime', 'Disney+', 'IPTV', 'Gaming', 'Abonnements Gaming', 'Cartes Cadeaux', 'Autres']

export default function Home() {
  const [products, setProducts] = useState([])
  const [filtered, setFiltered] = useState([])
  const [category, setCategory] = useState('Tous')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [payProduct, setPayProduct] = useState(null)
  const [detailProduct, setDetailProduct] = useState(null)
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => {
    Promise.all([
      Products.getAll('?limit=100&page=1'),
      Products.getAll('?limit=100&page=2'),
    ])
      .then(([r1, r2]) => {
        const data = [...(r1.data.data || []), ...(r2.data.data || [])]
        setProducts(data)
        setFiltered(data)
      })
      .catch(() => toast('Erreur de chargement', 'error'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let list = products
    if (category !== 'Tous') list = list.filter(p => p.category === category)
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    setFiltered(list)
  }, [category, search, products])

  const handleBuy = (product) => {
    if (!isLoggedIn) { navigate('/login'); return }
    setDetailProduct(null)
    setPayProduct(product)
  }

  const handleDetail = (product) => {
    setDetailProduct(product)
  }

  const activeCount = products.filter(p => p.is_active && p.stock !== 0).length

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <SEO title="Boutique" />
      {/* Hero */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold px-4 py-2 rounded-full mb-6">
          ⚡ ACTIVATION RAPIDE · SANS CARTE BANCAIRE
        </div>
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black mb-4 leading-tight overflow-hidden">
          Netflix, Spotify, Prime<br/>
          <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent inline-block w-full">& bien plus encore</span>
        </h1>
        <p className="text-slate-500 text-base sm:text-lg max-w-xl mx-auto px-2">
          1 mois · 3 mois · 6 mois · 12 mois<br className="sm:hidden" /> Accès immédiat via Mobile Money
        </p>

        <div className="flex items-center justify-center gap-6 sm:gap-10 mt-8">
          {[
            [loading ? '...' : `${activeCount}+`, 'Produits'],
            ['-80%', 'Économies'],
            ['⚡', 'Immédiat'],
            ['🔒', 'Sécurisé']
          ].map(([v, l]) => (
            <div key={l} className="text-center">
              <p className="text-2xl font-black text-indigo-400">{v}</p>
              <p className="text-xs text-slate-600 mt-0.5">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Rechercher un service..."
          className="input-field max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`text-xs font-semibold px-4 py-2 rounded-full border transition-all ${category === c ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-square bg-white/5" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-white/5 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
                <div className="h-8 bg-white/5 rounded mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(p => (
            <ProductCard key={p.id} product={p} onBuy={handleBuy} onDetail={handleDetail} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-20 text-slate-600">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-semibold">Aucun produit trouvé</p>
            </div>
          )}
        </div>
      )}

      {/* Product detail modal */}
      {detailProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setDetailProduct(null)}
        >
          <div
            className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col md:flex-row">
              {/* Left: description */}
              <div className="flex-1 p-6 flex flex-col">
                <button
                  onClick={() => setDetailProduct(null)}
                  className="self-end text-slate-500 hover:text-white text-xl mb-4 leading-none"
                >✕</button>
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">
                  {detailProduct.category}
                </p>
                <h2 className="text-xl font-black text-white mb-1">
                  {detailProduct.name.split(' – ')[0]}
                </h2>
                {detailProduct.name.split(' – ')[1] && (
                  <p className="text-slate-400 text-sm mb-4">{detailProduct.name.split(' – ').slice(1).join(' – ')}</p>
                )}
                <div className="flex-1 text-slate-400 text-sm leading-relaxed whitespace-pre-line">
                  {detailProduct.description || 'Aucune description disponible.'}
                </div>
                {detailProduct.duration_label && (
                  <p className="mt-4 text-xs text-slate-500">
                    Durée : <span className="text-slate-300 font-semibold">{detailProduct.duration_label}</span>
                  </p>
                )}
              </div>

              {/* Right: image + price + buy */}
              <div className="md:w-64 bg-slate-800/50 flex flex-col items-center justify-center p-6 gap-4 border-t md:border-t-0 md:border-l border-white/10">
                <div className="w-40 h-40 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-900/40 to-violet-900/40 flex items-center justify-center">
                  {detailProduct.image_url ? (
                    <img
                      src={detailProduct.image_url}
                      alt={detailProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-6xl">📦</span>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-3xl font-black text-white">
                    {Math.round(detailProduct.price).toLocaleString()} XAF
                  </p>
                  {detailProduct.discount > 0 && (
                    <span className="inline-block mt-1 text-xs font-black text-white bg-green-500 px-2 py-0.5 rounded-full">
                      -{detailProduct.discount}% de remise
                    </span>
                  )}
                  {detailProduct.duration_label && (
                    <p className="text-slate-500 text-xs mt-1">{detailProduct.duration_label}</p>
                  )}
                </div>
                {detailProduct.is_active && detailProduct.stock !== 0 ? (
                  <button
                    onClick={() => handleBuy(detailProduct)}
                    className="w-full btn-primary py-3"
                  >
                    Commander →
                  </button>
                ) : (
                  <div className="w-full text-center text-sm text-slate-500 bg-white/5 rounded-lg py-3">
                    🔜 Bientôt disponible
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
