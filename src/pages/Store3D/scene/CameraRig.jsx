import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useStore3DSession } from '../hooks/useStore3DSession'

/**
 * CameraRig — caméra orbit douce avec transitions vers les stands quand
 * une catégorie devient active. Limites de tilt + zoom pour empêcher
 * l'utilisateur de se retrouver sous le sol ou loin de la scène.
 */
export default function CameraRig() {
  const ref = useRef()
  const { camera } = useThree()
  const activeCategory = useStore3DSession(s => s.activeCategory)

  // Position cible selon la catégorie active.
  // Hall (null) → caméra haute centrée. Sinon : zoom léger sur le stand.
  const targetPos = (() => {
    switch (activeCategory) {
      case 'streaming': return [-3, 1.6, 4]
      case 'iptv':      return [ 0, 1.6, 4.5]
      case 'gaming':    return [ 3, 1.6, 4]
      default:          return [ 0, 2.4, 7]
    }
  })()

  useFrame(() => {
    // Lissage caméra : lerp vers la position cible (ease-out)
    camera.position.x += (targetPos[0] - camera.position.x) * 0.04
    camera.position.y += (targetPos[1] - camera.position.y) * 0.04
    camera.position.z += (targetPos[2] - camera.position.z) * 0.04
    camera.lookAt(0, 1, 0)
  })

  useEffect(() => {
    camera.position.set(0, 6, 12) // entrée cinématique
  }, [camera])

  return (
    <OrbitControls
      ref={ref}
      enablePan={false}
      enableZoom={false}
      minPolarAngle={Math.PI / 3}
      maxPolarAngle={Math.PI / 2.05}
      target={[0, 1, 0]}
      makeDefault
    />
  )
}
