/**
 * DeviceProbe.js — détection device tier + intent utilisateur, synchrone au boot.
 *
 * Décision retournée :
 *   'fallback'  → fallback 2D obligatoire (low-end, save-data, pas WebGL2)
 *   'light'     → 3D mais sans post-processing ni ombres
 *   'full'      → 3D complète
 *
 * On utilise uniquement des signaux navigateur disponibles synchroniquement.
 * detect-gpu (lib async) est volontairement pas appelé ici pour ne pas
 * bloquer le first paint — il pourra raffiner runtime côté Scene si besoin.
 */

const STORAGE_KEY = 'sit_store3d_pref' // override manuel utilisateur

export function readUserPref() {
  try { return localStorage.getItem(STORAGE_KEY) || null } catch { return null }
}

export function setUserPref(v) {
  try {
    if (v) localStorage.setItem(STORAGE_KEY, v)
    else localStorage.removeItem(STORAGE_KEY)
  } catch { /* quota */ }
}

/**
 * @returns {'fallback' | 'light' | 'full'}
 */
export function probeDeviceTier() {
  // 1. Override utilisateur prioritaire
  const pref = readUserPref()
  if (pref === 'fallback' || pref === 'light' || pref === 'full') return pref

  if (typeof navigator === 'undefined' || typeof window === 'undefined') return 'fallback'

  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  // 2. Save-Data → respect intent user
  if (conn?.saveData) return 'fallback'
  // 3. Réseau 2G ou pire → fallback
  if (conn?.effectiveType && ['slow-2g', '2g'].includes(conn.effectiveType)) return 'fallback'
  // 4. Mémoire device < 2 Go → fallback
  if (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory < 2) return 'fallback'

  // 5. WebGL2 indispensable
  let webgl2 = false
  try {
    const canvas = document.createElement('canvas')
    webgl2 = !!canvas.getContext('webgl2')
  } catch { webgl2 = false }
  if (!webgl2) return 'fallback'

  // 6. Mid-tier → light (≤ 4 cores OR ≤ 4 Go RAM)
  const cores = navigator.hardwareConcurrency || 4
  const mem   = typeof navigator.deviceMemory === 'number' ? navigator.deviceMemory : 4
  if (cores < 4 || mem < 4) return 'light'

  // 7. Réseau 3G → light pour économiser la bande passante
  if (conn?.effectiveType === '3g') return 'light'

  return 'full'
}
