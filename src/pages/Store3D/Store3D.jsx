import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import Scene from './scene/Scene'
import HUD2D from './hud/HUD2D'
import Fallback2D from './hud/Fallback2D'
import { probeDeviceTier } from './perf/DeviceProbe'
import { useStore3DSession } from './hooks/useStore3DSession'
import './styles/store3d.css'

/**
 * Store3D — entry point /3d-store.
 *
 * 1. Feature flag VITE_STORE_3D_ENABLED. Si === 'false' → Navigate('/') immédiat
 *    (kill-switch sans toucher à App.jsx).
 * 2. DeviceProbe asynchrone : tier 'fallback' | 'light' | 'full'.
 * 3. Pendant la probe → BootSplash.
 * 4. Si fallback OU forceFallback (Mode2DToggle) → Fallback2D.
 * 5. Sinon → Scene (R3F) + HUD2D overlay.
 *
 * Pas de Suspense ici : le code 3D est déjà dans un chunk lazy via App.jsx
 * (React.lazy). Le Suspense interne à Scene gère les Environment.
 */
export default function Store3D() {
  const flagDisabled = import.meta.env.VITE_STORE_3D_ENABLED === 'false'
  const [tierLocal, setTierLocal] = useState(null)
  const setTier = useStore3DSession((s) => s.setTier)
  const force = useStore3DSession((s) => s.forceFallback)

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
    // Cache le Navbar/Footer/ChatBot/CartDrawer du site classique pendant
    // l'immersion 3D (la HUD2D fournit son propre top bar)
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
      style={{ background: '#06060d' }}
    >
      <Scene />
      <HUD2D />
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
