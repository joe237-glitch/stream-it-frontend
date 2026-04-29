import { useStore3DSession } from '../hooks/useStore3DSession'
import { STORE3D_CATEGORIES } from '../data/mockProducts'
import MiniCartButton from './MiniCartButton'
import Mode2DToggle from './Mode2DToggle'
import ProductDrawer from './ProductDrawer'

/**
 * HUD2D — overlay DOM par-dessus le Canvas R3F.
 *
 * Composé de :
 * - top-left : badge titre + bouton Retour site classique
 * - top-right : MiniCartButton + Mode2DToggle
 * - bottom-center : 3 chips catégories (focus camera)
 * - drawer : ProductDrawer (slide-in droite quand activeProduct != null)
 *
 * Pas de tailwind dynamique côté HUD (pour rester léger), tout en CSS-in-JS
 * inline minimaliste. Le HUD reste 2D pur — la cinématique vient de la Scene.
 */
export default function HUD2D() {
  const focus = useStore3DSession((s) => s.focusCategory)
  const setFocus = useStore3DSession((s) => s.setFocusCategory)
  const tier = useStore3DSession((s) => s.tier)

  return (
    <>
      {/* Top-left : titre + retour */}
      <div
        className="store3d-hud-top-left"
        style={{
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 50,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <a
          href="/"
          className="store3d-pill"
          aria-label="Retour au site classique"
          title="Retour au site classique"
        >
          ← Site classique
        </a>
        <span
          className="store3d-pill store3d-pill-strong"
          style={{ pointerEvents: 'none' }}
        >
          Boutique 3D · Stream-It
        </span>
      </div>

      {/* Top-right : panier + mode */}
      <div
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 50,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <Mode2DToggle />
        <MiniCartButton />
      </div>

      {/* Bottom-center : focus catégories */}
      <div
        className="store3d-hud-categories"
        style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: 'calc(100vw - 32px)',
        }}
      >
        <button
          type="button"
          className={
            'store3d-chip' + (focus === null ? ' store3d-chip-active' : '')
          }
          onClick={() => setFocus(null)}
        >
          Vue d'ensemble
        </button>
        {STORE3D_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            type="button"
            className={
              'store3d-chip' +
              (focus === cat.key ? ' store3d-chip-active' : '')
            }
            style={{
              borderColor:
                focus === cat.key ? cat.accent : 'rgba(255,255,255,0.18)',
              boxShadow:
                focus === cat.key
                  ? `0 0 0 1px ${cat.accent}, 0 0 24px -6px ${cat.accent}`
                  : 'none',
            }}
            onClick={() => setFocus(cat.key)}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: cat.accent,
                display: 'inline-block',
                marginRight: 8,
                boxShadow: `0 0 10px ${cat.accent}`,
              }}
            />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tier light banner */}
      {tier === 'light' && (
        <div
          style={{
            position: 'fixed',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 49,
            padding: '6px 14px',
            borderRadius: 999,
            background: 'rgba(245, 185, 66, 0.12)',
            border: '1px solid rgba(245, 185, 66, 0.4)',
            color: '#f5b942',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 0.3,
          }}
        >
          Mode 3D allégé — effets désactivés pour fluidité
        </div>
      )}

      <ProductDrawer />
    </>
  )
}
