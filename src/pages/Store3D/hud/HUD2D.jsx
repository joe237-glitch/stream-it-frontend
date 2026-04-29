import MiniCartButton from './MiniCartButton'
import Mode2DToggle from './Mode2DToggle'
import ProductDrawer from './ProductDrawer'
import { useStore3DSession } from '../hooks/useStore3DSession'

/**
 * HUD2D — tous les overlays DOM superposés au Canvas R3F.
 * - Top-left : panier
 * - Top-right : sortie 2D
 * - Bottom-center : breadcrumb catégorie active
 * - Modal centré : drawer produit (si selectedProduct)
 */
export default function HUD2D() {
  const activeCategory = useStore3DSession(s => s.activeCategory)
  const goHome = useStore3DSession(s => s.goHome)

  return (
    <>
      <MiniCartButton />
      <Mode2DToggle />

      {/* Breadcrumb */}
      {activeCategory && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={goHome}
            className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white text-xs font-semibold hover:bg-white/20"
          >
            ← Retour au hall
          </button>
        </div>
      )}

      {/* Hint d'introduction (visible 5 s) */}
      <div className="fixed bottom-6 right-6 z-30 pointer-events-none">
        <div className="px-3 py-2 rounded-lg bg-black/40 backdrop-blur-sm border border-white/10 text-[11px] text-white/80">
          Cliquez sur un pilier pour explorer une catégorie
        </div>
      </div>

      <ProductDrawer />
    </>
  )
}
