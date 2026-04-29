import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import Scene from './scene/Scene'
import HUD2D from './hud/HUD2D'
import Fallback2D from './hud/Fallback2D'
import { probeDeviceTier } from './perf/DeviceProbe'
import { useStore3DSession } from './hooks/useStore3DSession'

/**
 * Store3D — entry point /3d-store.
 *
 * 1. Feature flag: VITE_STORE_3D_ENABLED. Si !== 'true' → Navigate('/').
 * 2. DeviceProbe synchrone : 'fallback' → rendu 2D, sinon Scene + HUD.
 * 3. SEO/title minimal côté document.
 *
 * Pas de Suspense ici : le code 3D est déjà dans un chunk lazy via
 * App.jsx (React.lazy). Le Suspense interne au Scene gère les Environments.
 */
export default function Store3D() {
  const flagEnabled = import.meta.env.VITE_STORE_3D_ENABLED !== 'false'
  const [tier, setTierState] = useState(null) // null = en cours
  const setTier = useStore3DSession(s => s.setTier)

  useEffect(() => {
    if (!flagEnabled) return
    const t = probeDeviceTier()
    setTierState(t)
    setTier(t)

    const previousTitle = document.title
    document.title = 'Boutique 3D · Stream-It'
    return () => { document.title = previousTitle }
  }, [flagEnabled, setTier])

  if (!flagEnabled) return <Navigate to="/" replace />
  if (tier === null)        return <BootSplash />
  if (tier === 'fallback')  return <Fallback2D reason="low_device" />

  return (
    <div className="fixed inset-0 z-30" aria-label="Boutique 3D Stream-It">
      <Scene />
      <HUD2D />
      {tier === 'light' && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-semibold text-amber-300">
          Mode 3D allégé · effets désactivés pour fluidité
        </div>
      )}
    </div>
  )
}

function BootSplash() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center text-slate-300">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full border-2 border-violet-500/30 border-t-violet-400 animate-spin" />
        <p className="text-sm">Préparation de la boutique 3D…</p>
      </div>
    </div>
  )
}
