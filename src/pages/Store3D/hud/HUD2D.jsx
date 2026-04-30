import { useStore3DSession } from '../hooks/useStore3DSession'
import { STORE3D_CATEGORIES } from '../data/mockProducts'
import MiniCartButton from './MiniCartButton'
import Mode2DToggle from './Mode2DToggle'
import ProductDrawer from './ProductDrawer'
import MiniMap from './MiniMap'

/**
 * HUD2D V2 — overlay DOM premium par-dessus le Canvas R3F.
 *
 * Améliorations vs V0 :
 * - Top bar frosted glass continu (plutôt que pills isolés)
 * - MiniMap top-right qui montre les 3 stands en plan radial
 * - Chips bottom avec ripple animation et glow accent par catégorie
 * - Banner tier light en gradient avec icône
 * - Backdrop blur 14 px partout (ressenti premium iOS)
 */
export default function HUD2D() {
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

      {/* MiniMap (top-right secondaire) */}
      <MiniMap />

      {/* Bottom chips */}
      <div className="store3d-chip-bar" role="toolbar" aria-label="Catégories">
        <button
          type="button"
          className={
            'store3d-chip' + (focus === null ? ' is-active' : '')
          }
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
            style={{
              '--chip-accent': cat.accent,
            }}
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
