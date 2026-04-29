import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore3DSession } from '../hooks/useStore3DSession'
import { STORE3D_CATEGORIES } from '../data/mockProducts'

/**
 * CameraRig — pilote la caméra en fonction de focusCategory.
 *
 * Comportement :
 * - Aucun focus → vue d'ensemble du hall (caméra à ~1.6 m de hauteur, légèrement
 *   plongeante, à 8 m de recul). Inspiré P1.V2 / P1.V3 du moodboard.
 * - Focus 'streaming' → caméra dolly vers le stand de gauche, target relevé.
 * - Focus 'iptv' → centre.
 * - Focus 'gaming' → droite.
 *
 * Transitions : easeOutCubic via lerp progressif (k = clamp(delta * 2.0, 0, 0.12)).
 * Smooth, pas saccadé. Pas de OrbitControls : la caméra est piloée par le
 * scroll/clic du HUD.
 */
const TARGETS = {
  default: { pos: [0, 1.7, 6.5], look: [0, 1.5, -3] },
  streaming: { pos: [-3.6, 1.6, 1.5], look: [-5.2, 1.5, -3.5] },
  iptv: { pos: [0, 1.6, -0.5], look: [0, 1.5, -5.5] },
  gaming: { pos: [3.6, 1.6, 1.5], look: [5.2, 1.5, -3.5] },
}

export default function CameraRig() {
  const { camera } = useThree()
  const focus = useStore3DSession((s) => s.focusCategory)
  const targetPos = useRef(new THREE.Vector3(0, 1.6, 8))
  const targetLook = useRef(new THREE.Vector3(0, 1.4, 0))
  const tmpLook = useRef(new THREE.Vector3())

  useEffect(() => {
    const t = TARGETS[focus] || TARGETS.default
    targetPos.current.set(...t.pos)
    targetLook.current.set(...t.look)
  }, [focus])

  useFrame((_, delta) => {
    const k = Math.min(delta * 2.0, 0.12)
    camera.position.lerp(targetPos.current, k)
    tmpLook.current.lerp(targetLook.current, k)
    // Maintenir une orientation lookAt stable même quand position bouge
    const stableLookTarget = targetLook.current
    camera.lookAt(stableLookTarget)
  })

  return null
}

export const FOCUS_FROM_KEY = (key) =>
  STORE3D_CATEGORIES.find((c) => c.key === key) || null
