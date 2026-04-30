import { useEffect, useState } from 'react'
import { useStore3DSession } from '../hooks/useStore3DSession'
import { useCart } from '../../../context/CartContext'
import { useToast } from '../../../components/Toast'

/**
 * ProductDrawer V2 — drawer adaptatif desktop / mobile.
 *
 * - Desktop ≥ 768 px → panneau latéral droit (slide-in 240 ms)
 * - Mobile < 768 px → bottom sheet plein écran (slide-up depuis bas)
 *
 * Contenu :
 * - Badge catégorie + glyph holographique
 * - Titre + durée pill
 * - Description
 * - Spec list générée (3 puces synthétiques par produit)
 * - Prix + Ajouter au panier (gradient violet)
 * - Note "Prototype interne · paiement non actif"
 *
 * Animations :
 * - Backdrop opacity + backdrop-filter blur
 * - Slide easing cubic-bezier(0.22, 1, 0.36, 1)
 * - Bouton CTA pulse au mount
 */

const CATEGORY_GLYPHS = {
  streaming: '▶',
  iptv: '⌘',
  gaming: '◆',
}

function useIsMobile() {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onResize = () => setM(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return m
}

const SPEC_HINTS = {
  streaming: [
    'Multi-écrans simultanés',
    'Activation < 5 min',
    'Garantie 100 % du temps payé',
  ],
  iptv: [
    '12 000+ chaînes internationales',
    'EPG intégré + replay 7 j',
    'Streaming 1080p stable',
  ],
  gaming: [
    'Code livré instantanément',
    'Compatible toutes régions',
    'Validité illimitée',
  ],
}

export default function ProductDrawer() {
  const product = useStore3DSession((s) => s.activeProduct)
  const close = useStore3DSession((s) => s.closeProduct)
  const { addItem, setIsOpen: setCartOpen } = useCart()
  const toast = useToast()
  const isOpen = !!product
  const isMobile = useIsMobile()

  const handleAdd = () => {
    if (!product) return
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      currency: product.currency,
      _source: 'store3d_v2',
    })
    toast(`${product.name} ajouté au panier`, 'success')
    close()
    setCartOpen(true)
  }

  const accent = product?.accent || '#7c3aed'
  const glyph = CATEGORY_GLYPHS[product?.category] || '◆'
  const specs = SPEC_HINTS[product?.category] || []

  // ESC pour fermer
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  return (
    <>
      <div
        className="store3d-drawer-backdrop"
        data-open={isOpen}
        onClick={close}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="store3d-drawer-title"
        className={'store3d-drawer ' + (isMobile ? 'is-mobile' : 'is-desktop')}
        data-open={isOpen}
      >
        {/* Glyph holographique en arrière-plan */}
        <div
          className="store3d-drawer-glyph"
          style={{ color: accent }}
          aria-hidden="true"
        >
          {glyph}
        </div>

        <header className="store3d-drawer-head">
          <span
            className="store3d-drawer-cat"
            style={{ color: accent, borderColor: accent + '66' }}
          >
            {product?.category}
          </span>
          <button
            type="button"
            className="store3d-drawer-close"
            onClick={close}
            aria-label="Fermer"
          >
            ✕
          </button>
        </header>

        <h2 id="store3d-drawer-title" className="store3d-drawer-title">
          {product?.name}
        </h2>

        <div
          className="store3d-drawer-pill"
          style={{ background: accent + '22', borderColor: accent + '66', color: accent }}
        >
          {product?.duration_label}
        </div>

        <p className="store3d-drawer-desc">{product?.description}</p>

        <ul className="store3d-drawer-specs" aria-label="Caractéristiques">
          {specs.map((s, i) => (
            <li key={i}>
              <span className="store3d-drawer-check" style={{ background: accent }}>✓</span>
              {s}
            </li>
          ))}
        </ul>

        <footer className="store3d-drawer-foot">
          <div className="store3d-drawer-price-row">
            <span className="store3d-drawer-price-label">Prix</span>
            <span className="store3d-drawer-price">
              {product ? new Intl.NumberFormat('fr-FR').format(product.price) : '—'}
              <span className="store3d-drawer-currency">{product?.currency}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!product}
            className="store3d-drawer-cta"
          >
            Ajouter au panier
          </button>
          <p className="store3d-drawer-note">
            Prototype interne · paiement non actif sur ce périmètre
          </p>
        </footer>
      </aside>
    </>
  )
}
