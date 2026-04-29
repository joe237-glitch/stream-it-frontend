import { getGPUTier } from 'detect-gpu'

/**
 * DeviceProbe — détermine le tier de rendu 3D supportable par l'appareil.
 *
 * Tiers :
 *   - 'fallback' : pas de WebGL, GPU inconnu/mobile faible, prefers-reduced-motion.
 *                  → rendu 2D pur (Fallback2D).
 *   - 'light'    : GPU mobile correct ou desktop modeste. Scene 3D simplifiée
 *                  (DPR cap 1.0, pas de post-process, particules désactivées).
 *   - 'full'     : desktop/laptop moderne. Scene 3D complète (Bloom + DoF léger,
 *                  particules, fog, materials physical).
 *
 * Heuristiques additionnelles (au-delà du tier detect-gpu) :
 *   - prefers-reduced-motion → fallback systématique
 *   - écran < 360 px de large → fallback (mobile feature phone)
 *   - tier detect-gpu 0 OU GPU non identifié → fallback
 *   - tier detect-gpu 1 OU mobile avec tier ≤ 2 → light
 *   - sinon full
 *
 * Cette fonction est `async` parce que detect-gpu charge un benchmark JSON.
 * En attente, on affiche un BootSplash léger.
 */
export async function probeDeviceTier() {
  if (typeof window === 'undefined') return 'fallback'

  // 1. WebGL disponible ?
  try {
    const c = document.createElement('canvas')
    const gl =
      c.getContext('webgl2') ||
      c.getContext('webgl') ||
      c.getContext('experimental-webgl')
    if (!gl) return 'fallback'
  } catch {
    return 'fallback'
  }

  // 2. prefers-reduced-motion → fallback (respect accessibilité)
  if (
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return 'fallback'
  }

  // 3. Écran trop étroit → fallback
  if (window.innerWidth < 360) return 'fallback'

  // 4. detect-gpu benchmark
  try {
    const gpu = await getGPUTier({ benchmarksURL: undefined })
    // gpu.tier ∈ {0, 1, 2, 3}, gpu.isMobile boolean
    if (!gpu || gpu.tier == null || gpu.tier === 0) return 'fallback'
    if (gpu.tier === 1) return 'light'
    if (gpu.isMobile && gpu.tier <= 2) return 'light'
    return 'full'
  } catch {
    // Pessimiste si detect-gpu échoue
    return 'light'
  }
}
