import { useEffect, useState } from 'react'
import { STORE3D_CATEGORIES, STORE3D_PRODUCTS } from '../data/mockProducts'
import { useCart } from '../../../context/CartContext'
import { useToast } from '../../../components/Toast'

/**
 * Fallback2D V2 — version 2D premium quand la 3D n'est pas viable.
 *
 * - Hero animé : conic-gradient violet/cyan tournant lentement + grain subtil
 * - Sections par catégorie avec en-tête glyph + barre lumineuse
 * - Cards glassmorphism CSS pur (backdrop-filter blur 18 px) avec hover lift
 * - Bouton mode 3D pour repasser si l'utilisateur change d'avis
 * - Tilt subtil sur hover des cards (CSS 3D transform)
 *
 * Reste 100 % CSS — aucune dépendance Framer Motion / Lottie ajoutée pour
 * garder le bundle léger.
 */

const CATEGORY_GLYPHS = {
  streaming: '▶',
  iptv: '⌘',
  gaming: '◆',
}

export default function Fallback2D({ reason }) {
  const { addItem, setIsOpen } = useCart()
  const toast = useToast()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [])

  const handleAdd = (p) => {
    addItem({
      id: p.id,
      name: p.name,
      price: p.price,
      currency: p.currency,
      _source: 'store3d_fb_v2',
    })
    toast(`${p.name} ajouté au panier`, 'success')
    setIsOpen(true)
  }

  return (
    <div className="store3d-fb-page" data-mounted={mounted}>
      {/* Hero animé */}
      <header className="store3d-fb-hero">
        <div className="store3d-fb-hero-blob" aria-hidden="true" />
        <div className="store3d-fb-hero-blob store3d-fb-hero-blob-2" aria-hidden="true" />
        <div className="store3d-fb-hero-grain" aria-hidden="true" />

        <div className="store3d-fb-hero-content">
          <a href="/" className="store3d-fb-back">
            <span>←</span> Site classique
          </a>
          <span className="store3d-fb-hero-eyebrow">BOUTIQUE PREMIUM · MODE OPTIMISÉ</span>
          <h1 className="store3d-fb-hero-title">
            Stream-It Studio<span className="store3d-fb-hero-title-accent">.</span>
          </h1>
          <p className="store3d-fb-hero-sub">
            La marketplace premium d'abonnements digitaux. Streaming, IPTV, Gaming —
            activation instantanée via Mobile Money.
          </p>
          <div className="store3d-fb-hero-meta">
            <span className="store3d-fb-hero-pill">⚡ Activation immédiate</span>
            <span className="store3d-fb-hero-pill">🛡 Garantie 100 %</span>
            <span className="store3d-fb-hero-pill">🌍 6 pays CFA</span>
          </div>
          {reason && (
            <p className="store3d-fb-hero-note">
              Mode immersif désactivé — vous accédez à la version classique premium
              avec le même catalogue ({reason}).
            </p>
          )}
        </div>
      </header>

      {/* Sections catégories */}
      <main className="store3d-fb-main">
        {STORE3D_CATEGORIES.map((cat) => {
          const products = STORE3D_PRODUCTS.filter((p) => p.category === cat.key)
          const glyph = CATEGORY_GLYPHS[cat.key] || '◆'
          return (
            <section key={cat.key} className="store3d-fb-section">
              <header className="store3d-fb-section-head">
                <span
                  className="store3d-fb-section-glyph"
                  style={{ color: cat.accent, textShadow: `0 0 24px ${cat.accent}` }}
                >
                  {glyph}
                </span>
                <div>
                  <h2 className="store3d-fb-section-title">{cat.label}</h2>
                  <p className="store3d-fb-section-desc">{cat.description}</p>
                </div>
                <span
                  className="store3d-fb-section-bar"
                  style={{ background: `linear-gradient(90deg, ${cat.accent}, transparent)` }}
                />
              </header>

              <div className="store3d-fb-grid">
                {products.map((p) => (
                  <article
                    key={p.id}
                    className="store3d-fb-card"
                    style={{
                      '--card-accent': p.accent,
                    }}
                  >
                    <div className="store3d-fb-card-glyph" aria-hidden="true">
                      {glyph}
                    </div>
                    <span className="store3d-fb-card-pill">{p.duration_label}</span>
                    <h3 className="store3d-fb-card-title">{p.name}</h3>
                    <p className="store3d-fb-card-desc">{p.description}</p>
                    <div className="store3d-fb-card-foot">
                      <span className="store3d-fb-card-price">
                        {new Intl.NumberFormat('fr-FR').format(p.price)}
                        <span className="store3d-fb-card-currency">{p.currency}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAdd(p)}
                        className="store3d-fb-card-cta"
                      >
                        Ajouter
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )
        })}
      </main>

      <footer className="store3d-fb-foot">
        <p>
          Prototype premium interne · paiement non actif sur ce périmètre. Validation visuelle uniquement.
        </p>
      </footer>
    </div>
  )
}
