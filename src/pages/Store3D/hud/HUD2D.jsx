import { useStore3DSession } from '../hooks/useStore3DSession'
import { STORE3D_CATEGORIES } from '../data/mockProducts'
import MiniCartButton from './MiniCartButton'
import Mode2DToggle from './Mode2DToggle'
import ProductDrawer from './ProductDrawer'

/**
 * HUD2D V3 — overlay DOM premium.
 *
 * Changements vs V2 :
 * - SUPPRIMÉ : MiniMap radar (pas de référence MJ, jugée non premium par PM)
 * - Mode mobile : remplace les chips desktop par un dock vertical avec
 *   indicator de stand actif + flèches navigation (en plus du swipe)
 * - Top bar plus aérée (espacement +4 px, typo letter-spacing affiné)
 * - Banner tier light retravaillé (gradient + chip)
 */
export default function HUD2D({ isPortrait = false, mobileIdx = 0, onMobileNav }) {
  const focus = useStore3DSession((s) => s.focusCategory)
  const setFocus = useStore3DSession((s) => s.setFocusCategory)
  const tier = useStore3DSession((s) => s.tier)

  return (
    <>
      {/* Top bar continu */}
      <div className="store3d-topbar">
        <div className="store3d-topbar-left">
          <a
            href="/"
            className="store3d-back"
            aria-label="Retour au site classique"
            title="Retour au site classique"
          >
            <span className="store3d-back-arrow">←</span>
            <span>Site classique</span>
          </a>
          <div className="store3d-divider" />
          <div className="store3d-brand">
            <span className="store3d-brand-dot" />
            <span className="store3d-brand-text">Boutique 3D</span>
          </div>
        </div>

        <div className="store3d-topbar-right">
          <Mode2DToggle />
          <MiniCartButton />
        </div>
      </div>

      {/* Bottom navigation : chips desktop OU dots+arrows mobile */}
      {isPortrait ? (
        <div className="store3d-mobile-nav" role="toolbar" aria-label="Catégories">
          <button
            type="button"
            className="store3d-mobile-arrow"
            disabled={mobileIdx === 0}
            onClick={() => onMobileNav?.(Math.max(0, mobileIdx - 1))}
            aria-label="Catégorie précédente"
          >
            ‹
          </button>
          <div className="store3d-mobile-stage">
            <div className="store3d-mobile-label">
              {STORE3D_CATEGORIES[mobileIdx]?.label}
            </div>
            <div className="store3d-mobile-dots">
              {STORE3D_CATEGORIES.map((cat, i) => (
                <button
                  key={cat.key}
                  className={
                    'store3d-mobile-dot' +
                    (i === mobileIdx ? ' is-active' : '')
                  }
                  style={{ '--dot-accent': cat.accent }}
                  onClick={() => onMobileNav?.(i)}
                  aria-label={cat.label}
                  aria-current={i === mobileIdx}
                />
              ))}
            </div>
            <div className="store3d-mobile-hint">Glissez ‹ ›</div>
          </div>
          <button
            type="button"
            className="store3d-mobile-arrow"
            disabled={mobileIdx === STORE3D_CATEGORIES.length - 1}
            onClick={() =>
              onMobileNav?.(
                Math.min(STORE3D_CATEGORIES.length - 1, mobileIdx + 1),
              )
            }
            aria-label="Catégorie suivante"
          >
            ›
          </button>
        </div>
      ) : (
        <div className="store3d-chip-bar" role="toolbar" aria-label="Catégories">
          <button
            type="button"
            className={'store3d-chip' + (focus === null ? ' is-active' : '')}
            onClick={() => setFocus(null)}
          >
            <span className="store3d-chip-icon">⌂</span>
            Vue d'ensemble
          </button>
          {STORE3D_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              className={
                'store3d-chip' +
                (focus === cat.key ? ' is-active' : '')
              }
              style={{ '--chip-accent': cat.accent }}
              onClick={() => setFocus(cat.key)}
            >
              <span
                className="store3d-chip-dot"
                style={{ background: cat.accent, boxShadow: `0 0 12px ${cat.accent}` }}
              />
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Tier light banner */}
      {tier === 'light' && (
        <div className="store3d-tier-banner">
          <span className="store3d-tier-icon">⚡</span>
          Mode 3D allégé · effets désactivés pour fluidité
        </div>
      )}

      <ProductDrawer />
    </>
  )
}
