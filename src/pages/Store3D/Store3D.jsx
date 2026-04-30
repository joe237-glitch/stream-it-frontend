import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useDrag } from '@use-gesture/react'
import Scene from './scene/Scene'
import HUD2D from './hud/HUD2D'
import Fallback2D from './hud/Fallback2D'
import { probeDeviceTier } from './perf/DeviceProbe'
import { useStore3DSession } from './hooks/useStore3DSession'
import { STORE3D_CATEGORIES } from './data/mockProducts'
import './styles/store3d.css'

/**
 * Store3D V3 — entry point /3d-store.
 *
 * V3 changes :
 * - Détecte mobile portrait (window.innerWidth < 768)
 * - Sur mobile : single-stand mode + swipe horizontal pour naviguer entre
 *   catégories (gestures @use-gesture/react)
 * - Indicateur visuel des stands accessibles (dots) en bas
 * - Sinon comportement V2 (3 stands desktop, fallback 2D, force 2D)
 *
 * 1. Feature flag VITE_STORE_3D_ENABLED. Si === 'false' → Navigate('/').
 * 2. DeviceProbe asynchrone : tier 'fallback' | 'light' | 'full'.
 * 3. Pendant la probe → BootSplash.
 * 4. Si fallback OU forceFallback → Fallback2D.
 * 5. Sinon → Scene + HUD2D (avec mode mobile single-stand si portrait).
 */
function useIsPortrait() {
  const [isPortrait, set] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768,
  )
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onResize = () => set(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return isPortrait
}

export default function Store3D() {
  const flagDisabled = import.meta.env.VITE_STORE_3D_ENABLED === 'false'
  const [tierLocal, setTierLocal] = useState(null)
  const setTier = useStore3DSession((s) => s.setTier)
  const force = useStore3DSession((s) => s.forceFallback)
  const isPortrait = useIsPortrait()
  const [mobileIdx, setMobileIdx] = useState(0)

  const mobileFocusKey = isPortrait
    ? STORE3D_CATEGORIES[mobileIdx]?.key
    : null

  // Swipe gestures pour mobile
  const bind = useDrag(
    ({ swipe: [sx], last }) => {
      if (!isPortrait || !last) return
      if (sx === 1) {
        // swipe right → previous
        setMobileIdx((i) => Math.max(0, i - 1))
      } else if (sx === -1) {
        // swipe left → next
        setMobileIdx((i) => Math.min(STORE3D_CATEGORIES.length - 1, i + 1))
      }
    },
    { swipe: { distance: 50, velocity: 0.4 } },
  )

  useEffect(() => {
    if (flagDisabled) return
    let cancelled = false
    probeDeviceTier().then((t) => {
      if (cancelled) return
      setTierLocal(t)
      setTier(t)
    })
    const previous = document.title
    document.title = 'Boutique 3D · Stream-It'
    document.body.classList.add('store3d-active')
    return () => {
      cancelled = true
      document.title = previous
      document.body.classList.remove('store3d-active')
    }
  }, [flagDisabled, setTier])

  if (flagDisabled) return <Navigate to="/" replace />
  if (tierLocal === null) return <BootSplash />
  if (tierLocal === 'fallback')
    return <Fallback2D reason="appareil sans support 3D fluide" />
  if (force) return <Fallback2D reason="mode 2D activé" />

  return (
    <div
      className="fixed inset-0 z-30"
      aria-label="Boutique 3D Stream-It"
      style={{ background: '#06060d', touchAction: isPortrait ? 'pan-y' : 'auto' }}
      {...(isPortrait ? bind() : {})}
    >
      <Scene isPortrait={isPortrait} mobileFocusKey={mobileFocusKey} />
      <HUD2D
        isPortrait={isPortrait}
        mobileIdx={mobileIdx}
        onMobileNav={setMobileIdx}
      />
    </div>
  )
}

function BootSplash() {
  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(ellipse at center, rgba(124,58,237,0.18) 0%, rgba(6,6,13,1) 70%)',
        color: '#cdd0e4',
      }}
    >
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '2px solid rgba(124, 58, 237, 0.3)',
            borderTopColor: '#a78bfa',
            animation: 'store3d-spin 0.9s linear infinite',
          }}
        />
        <p style={{ margin: 0, fontSize: 13 }}>Préparation de la boutique 3D…</p>
        <style>{`@keyframes store3d-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}
