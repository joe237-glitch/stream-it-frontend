import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore3DSession } from '../hooks/useStore3DSession'

/**
 * CameraIntro V4 — séquence cinématique d'entrée 3.5 s.
 *
 * Trajectoire :
 *   t=0    : caméra position [0, 0.6, 14], FOV 35° (très éloignée, basse, FOV serré)
 *   t=1.0  : interpole vers [0, 1.2, 10], FOV 48°
 *   t=2.5  : interpole vers [0, 1.65, 8], FOV 56°
 *   t=3.5  : final [0, 1.75, 7.0], FOV 60° → cède le contrôle au CameraRig
 *
 * Easing : easeOutQuart pour une décélération naturelle (pas brutal).
 *
 * Skip : clic n'importe où sur le canvas OU touche Espace/Entrée
 * fait sauter à la position finale instantanément.
 *
 * Skip auto déjà disponible si l'utilisateur a `prefers-reduced-motion`.
 *
 * État partagé : `useStore3DSession.introDone` (boolean) — quand true, le
 * CameraRig reprend le pilotage normal.
 */
const FRAMES = [
  { t: 0,   pos: [0, 0.55, 14], fov: 35 },
  { t: 1.0, pos: [0, 1.25, 10.5], fov: 48 },
  { t: 2.4, pos: [0, 1.65, 8.2], fov: 56 },
  { t: 3.4, pos: [0, 1.75, 7.0], fov: 60 },
]

function easeOutQuart(x) {
  return 1 - Math.pow(1 - x, 4)
}

function lerpFrames(elapsed) {
  // Trouve les 2 frames qui encadrent
  for (let i = 0; i < FRAMES.length - 1; i++) {
    const a = FRAMES[i]
    const b = FRAMES[i + 1]
    if (elapsed >= a.t && elapsed <= b.t) {
      const u = (elapsed - a.t) / (b.t - a.t)
      const eased = easeOutQuart(u)
      return {
        pos: [
          THREE.MathUtils.lerp(a.pos[0], b.pos[0], eased),
          THREE.MathUtils.lerp(a.pos[1], b.pos[1], eased),
          THREE.MathUtils.lerp(a.pos[2], b.pos[2], eased),
        ],
        fov: THREE.MathUtils.lerp(a.fov, b.fov, eased),
      }
    }
  }
  // après le dernier frame
  const last = FRAMES[FRAMES.length - 1]
  return { pos: last.pos, fov: last.fov }
}

export default function CameraIntro({ isPortrait = false }) {
  const { camera } = useThree()
  const startRef = useRef(null)
  const introDone = useStore3DSession((s) => s.introDone)
  const setIntroDone = useStore3DSession((s) => s.setIntroDone)
  const [skipRequested, setSkipRequested] = useState(false)

  const totalDuration = FRAMES[FRAMES.length - 1].t

  // Respecte prefers-reduced-motion : skip immédiat
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setSkipRequested(true)
    }
  }, [])

  // Listener clavier Espace/Entrée → skip
  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') && !introDone) {
        setSkipRequested(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [introDone])

  useFrame((state) => {
    if (introDone) return
    if (startRef.current === null) startRef.current = state.clock.elapsedTime

    const elapsed = state.clock.elapsedTime - startRef.current

    if (skipRequested || elapsed >= totalDuration) {
      // Snap to final
      const last = FRAMES[FRAMES.length - 1]
      camera.position.set(...last.pos)
      camera.fov = last.fov
      camera.updateProjectionMatrix()
      camera.lookAt(0, 1.55, -3.0)
      setIntroDone(true)
      return
    }

    const f = lerpFrames(elapsed)
    camera.position.set(...f.pos)
    camera.fov = f.fov
    camera.updateProjectionMatrix()
    camera.lookAt(0, 1.5, -3.0)
  })

  // Pas de mesh DOM : ce composant ne fait que piloter la caméra
  return null
}
