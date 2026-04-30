import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore3DSession } from '../hooks/useStore3DSession'

/**
 * CameraRig V3 — pilote la caméra en fonction de focusCategory.
 *
 * V3 changes :
 * - Targets recadrés pour les nouvelles positions de stands (-5.4, 0, +5.4 X)
 * - Mobile mode : caméra plus proche, FOV plus serrée, position centrée
 * - Easing un peu plus rapide (k = delta * 2.4) pour réactivité
 * - lookAt sans drift (target stable)
 *
 * Default (vue d'ensemble) : voit les 3 stands en vue panoramique
 * Streaming/IPTV/Gaming : dolly vers chaque stand
 * Mobile : caméra fixe sur le stand mobile
 */
const TARGETS_DESKTOP = {
  default: { pos: [0, 1.75, 7.0], look: [0, 1.6, -3.0] },
  streaming: { pos: [-3.4, 1.55, 1.8], look: [-5.4, 1.55, -3.5] },
  iptv: { pos: [0, 1.55, -0.2], look: [0, 1.55, -5.5] },
  gaming: { pos: [3.4, 1.55, 1.8], look: [5.4, 1.55, -3.5] },
}

const TARGETS_MOBILE = {
  default: { pos: [0, 1.6, 5.5], look: [0, 1.55, -3.0] },
  streaming: { pos: [0, 1.6, 5.5], look: [0, 1.55, -3.0] },
  iptv: { pos: [0, 1.6, 5.5], look: [0, 1.55, -3.0] },
  gaming: { pos: [0, 1.6, 5.5], look: [0, 1.55, -3.0] },
}

export default function CameraRig({ isPortrait = false }) {
  const { camera } = useThree()
  const focus = useStore3DSession((s) => s.focusCategory)
  const introDone = useStore3DSession((s) => s.introDone)
  const targetPos = useRef(new THREE.Vector3(0, 1.75, 7.0))
  const targetLook = useRef(new THREE.Vector3(0, 1.6, -3.0))

  useEffect(() => {
    const targets = isPortrait ? TARGETS_MOBILE : TARGETS_DESKTOP
    const t = targets[focus] || targets.default
    targetPos.current.set(...t.pos)
    targetLook.current.set(...t.look)
  }, [focus, isPortrait])

  useFrame((_, delta) => {
    // V4 : laisser CameraIntro piloter pendant l'intro
    if (!introDone) return
    const k = Math.min(delta * 2.4, 0.15)
    camera.position.lerp(targetPos.current, k)
    camera.lookAt(targetLook.current)
  })

  return null
}
